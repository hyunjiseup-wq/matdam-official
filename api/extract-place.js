// =============================================================
// 맛담 - 지도 링크 자동 인식 (Vercel 서버리스 함수)
// 네이버/구글 지도 링크를 받아 이름·주소·카테고리·사진을 추출한다.
//
// POST /api/extract-place  { "url": "https://naver.me/xxxx" }
//   → { name, address, category, image_url, naver_map_url, map_source }
//
// 네이버: 링크에서 장소 ID를 뽑아 m.place.naver.com 페이지의
//         __APOLLO_STATE__(JSON)를 직접 파싱 → 정확·무료.
// 구글:   og태그 + (선택)Claude 로 구조화.
//
// 환경변수(선택): ANTHROPIC_API_KEY  ← 구글/파싱 실패 시 fallback 에만 사용
// =============================================================

const CATEGORIES = [
  '음식점', '한식', '한식/고기', '일식', '횟집', '중식', '양식',
  'BAR', '카페', '분식', '디저트', '쇼핑', '생활/문화',
];

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 지원해요.' });

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const url = String(body.url || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: '유효한 지도 링크를 붙여넣어 주세요.' });
    }

    // 1) 링크 열기 (단축링크 리다이렉트 추적) — 최종 URL 확보용
    const pageRes = await fetchPage(url);
    const finalUrl = pageRes.finalUrl;
    const html = pageRes.html;
    const map_source = detectSource(finalUrl, url);

    // 2) 네이버: 장소 ID 로 m.place 페이지 직접 파싱
    if (map_source === 'naver') {
      const placeId = extractNaverId(finalUrl) || extractNaverId(url);
      if (placeId) {
        const parsed = await parseNaverByPlaceId(placeId);
        if (parsed && parsed.name) {
          return res.status(200).json({
            name: parsed.name,
            address: parsed.address,
            category: mapNaverCategory(parsed.naverCategory),
            image_url: parsed.image_url,
            naver_map_url: finalUrl,
            map_source: 'naver',
            price_range: parsed.price_range,
            ai: false,
          });
        }
      }
    }

    // 3) 구글: 최종 URL 에서 이름·좌표 추출 → 좌표 역지오코딩으로 주소 완성
    if (map_source === 'google') {
      const g = await parseGoogle(finalUrl, html);
      if (g && g.name) {
        return res.status(200).json({
          name: g.name,
          address: g.address,
          category: '', // 구글은 서버에서 업종을 못 얻음 → 사용자가 선택
          image_url: '', // 구글 대표사진은 API 없이는 못 얻음 (로고 대신 비움)
          naver_map_url: finalUrl,
          map_source: 'google',
          ai: false,
        });
      }
    }

    // 4) 그 외: og태그 + Claude fallback
    const meta = extractMeta(html);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let structured = null;
    if (apiKey) {
      try {
        structured = await callClaude(apiKey, meta, finalUrl);
      } catch (e) {
        console.warn('[extract-place] Claude 실패:', e && e.message);
      }
    }

    const name = clean(
      (structured && structured.name) || cleanTitle(meta.ogTitle || meta.title) || ''
    );
    const address = clean((structured && structured.address) || meta.address || '');
    let category = (structured && structured.category) || '';
    if (!CATEGORIES.includes(category)) category = '';
    let image_url = (structured && structured.image_url) || meta.ogImage || '';
    if (/google\.com\/maps\/about\/images\/icons/i.test(image_url)) image_url = ''; // 구글 로고 제외

    return res.status(200).json({
      name,
      address,
      category,
      image_url,
      naver_map_url: finalUrl,
      map_source: map_source || undefined,
      ai: Boolean(structured),
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: (e && e.message) || '자동 인식에 실패했어요. 직접 입력해주세요.' });
  }
};

// ── 공통 ─────────────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const r = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' },
  });
  return { finalUrl: r.url || url, html: await r.text() };
}

function detectSource(finalUrl, original) {
  const s = `${finalUrl} ${original}`.toLowerCase();
  if (s.includes('naver')) return 'naver';
  if (s.includes('google') || s.includes('goo.gl')) return 'google';
  return null;
}

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

// ── 네이버 전용 ───────────────────────────────────────────────────────────────

// URL 에서 장소 ID 추출 (place/1332349195, restaurant/123..., pinId=123...)
function extractNaverId(u) {
  const s = String(u || '');
  let m = s.match(/(?:place|restaurant|hairshop|hospital|entry\/place)\/(\d{6,})/);
  if (m) return m[1];
  m = s.match(/[?&](?:id|pinId|placeId)=(\d{6,})/);
  if (m) return m[1];
  return '';
}

async function parseNaverByPlaceId(id) {
  const { html } = await fetchPage(`https://m.place.naver.com/place/${id}/home`);

  // __APOLLO_STATE__ 안의 PlaceDetailBase:{id} 객체에서 필드 추출
  const marker = `"PlaceDetailBase:${id}"`;
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const slice = html.slice(start, start + 2500);

  const g = (key) => {
    const m = slice.match(new RegExp(`"${key}":"([^"]*)"`));
    return m ? decodeEntities(m[1]) : '';
  };

  const name = clean(g('name'));
  const roadAddress = clean(g('roadAddress'));
  const address = clean(g('address')); // 지번 (도로명 없을 때 대비)
  const naverCategory = clean(g('category'));

  return {
    name,
    address: roadAddress || address,
    naverCategory,
    image_url: firstPlaceImage(html),
    price_range: estimatePriceRange(html),
  };
}

// 메뉴 가격들의 중앙값으로 가격대 추정 (없으면 빈 문자열)
function estimatePriceRange(html) {
  const prices = [];
  const re = /"price":"(\d{3,7})"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const v = parseInt(m[1], 10);
    if (v >= 1000 && v <= 500000) prices.push(v);
  }
  if (prices.length === 0) return '';
  prices.sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  if (median <= 10000) return '만원 이하';
  if (median <= 20000) return '1~2만원';
  if (median <= 40000) return '2~4만원';
  return '4만원 이상';
}

// 대표 사진: search.pstatic.net 을 거치는 phinf 실제 사진 URL
function firstPlaceImage(html) {
  const m = html.match(
    /https:\/\/search\.pstatic\.net\/common\/\?[^"'\\ ]*phinf[^"'\\ ]*/i
  );
  if (m) return decodeEntities(m[0]);
  const og = metaContent(html, 'og:image');
  return og || '';
}

// 네이버 업종명 → 맛담 카테고리
function mapNaverCategory(cat) {
  const c = String(cat || '');
  const has = (arr) => arr.some((k) => c.includes(k));
  if (has(['디저트', '베이커리', '제과', '빵', '도넛', '케이크', '아이스크림'])) return '디저트';
  if (has(['카페', '커피', '브런치', '차', '티하우스'])) return '카페';
  if (has(['와인', '바', '펍', '포차', '호프', '칵테일', '이자카야', '맥주', '위스키', '술집'])) return 'BAR';
  if (has(['횟집', '활어', '생선회', '물회'])) return '횟집'; // 참치·스시는 아래 일식으로
  if (has(['일식', '스시', '초밥', '라멘', '우동', '돈카츠', '규동', '일본', '사시미', '오마카세', '참치', '회'])) return '일식';
  if (has(['중식', '중국', '마라', '양꼬치', '딤섬', '훠궈'])) return '중식';
  if (has(['파스타', '이탈리', '피자', '스테이크', '프렌치', '스페인', '멕시', '양식', '이탈리안'])) return '양식';
  if (has(['고기', '삼겹', '갈비', '곱창', '정육', '구이', '바베큐', '족발', '보쌈'])) return '한식/고기';
  if (has(['분식', '떡볶이', '김밥', '순대'])) return '분식';
  if (has(['한식', '국밥', '백반', '한정식', '찌개', '국수', '냉면', '칼국수', '해장', '설렁탕'])) return '한식';
  return ''; // 애매하면 비워서 사용자가 선택
}

// ── 구글 전용 ─────────────────────────────────────────────────────────────────

// 구글 지도 최종 URL(.../maps/place/{이름}/data=...!3d{lat}!4d{lng})에서
// 이름·좌표를 뽑고, 좌표를 역지오코딩해 한국 주소를 만든다.
async function parseGoogle(finalUrl, html) {
  let name = '';
  const mName = finalUrl.match(/\/maps\/place\/([^/@]+)/);
  if (mName) {
    try {
      name = clean(decodeURIComponent(mName[1].replace(/\+/g, ' ')));
    } catch {
      name = clean(mName[1].replace(/\+/g, ' '));
    }
  }
  if (!name) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    name = cleanTitle(metaContent(html, 'og:title') || (titleMatch ? titleMatch[1] : ''));
  }

  let address = '';
  const mLL = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (mLL) address = await reverseGeocode(mLL[1], mLL[2]);

  return { name, address };
}

// 좌표 → 한국 주소 (OSM Nominatim, 무료·키 불필요)
async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
      { headers: { 'User-Agent': 'matdam-app/1.0 (https://matdam-official.vercel.app)' } }
    );
    if (!r.ok) return '';
    const d = await r.json();
    const a = d.address || {};
    const parts = [];
    const push = (v) => {
      if (v && !parts.includes(v)) parts.push(v);
    };
    push(a.province || a.state || a.region);
    push(a.city || a.county);
    push(a.borough || a.city_district || a.town);
    push(a.road);
    if (a.house_number) parts.push(a.house_number);
    return clean(parts.join(' '));
  } catch {
    return '';
  }
}

// ── og태그 / JSON-LD (기타) ───────────────────────────────────────────────────

function metaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return '';
}

function extractMeta(html) {
  const ogTitle = metaContent(html, 'og:title');
  const ogImage = metaContent(html, 'og:image');
  const ogDescription = metaContent(html, 'og:description');
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]) : '';

  let jsonld = '';
  const ldMatches = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (ldMatches) {
    jsonld = ldMatches
      .map((s) => s.replace(/<\/?script[^>]*>/gi, ''))
      .join('\n')
      .slice(0, 4000);
  }

  const address = guessAddress(`${ogDescription}\n${jsonld}`);
  return { ogTitle, ogImage, ogDescription, title, jsonld, address };
}

function guessAddress(text) {
  if (!text) return '';
  const m = text.match(
    /((?:서울|경기|인천|부산|대구|대전|광주|울산|세종|강원|충청|충북|충남|전라|전북|전남|경상|경북|경남|제주)[^\n"]{5,60})/
  );
  return m ? clean(m[1]) : '';
}

function cleanTitle(t) {
  return String(t || '')
    .replace(/\s*[:\-|]\s*(네이버|Naver|NAVER|Google\s*지도|Google Maps|구글 지도).*$/i, '')
    .trim();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\\u002F/gi, '/');
}

async function callClaude(apiKey, meta, finalUrl) {
  const context = [
    `최종 URL: ${finalUrl}`,
    `og:title: ${meta.ogTitle}`,
    `문서 title: ${meta.title}`,
    `og:description: ${meta.ogDescription}`,
    `og:image: ${meta.ogImage}`,
    meta.jsonld ? `JSON-LD:\n${meta.jsonld}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const tool = {
    name: 'save_place',
    description: '지도 페이지에서 추출한 식당/장소 정보를 구조화해 저장한다.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '가게(장소) 이름. 사이트명 꼬리표 제외.' },
        address: { type: 'string', description: '한국 주소 전체(도로명 우선). 없으면 빈 문자열.' },
        category: {
          type: 'string',
          enum: ['', ...CATEGORIES],
          description: `업종. 다음 중 가장 가까운 하나: ${CATEGORIES.join(', ')}. 모르면 빈 문자열.`,
        },
        image_url: { type: 'string', description: '대표 사진 URL. 없으면 빈 문자열.' },
      },
      required: ['name', 'address', 'category', 'image_url'],
    },
  };

  const anthRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      tool_choice: { type: 'tool', name: 'save_place' },
      tools: [tool],
      messages: [
        {
          role: 'user',
          content:
            '아래는 지도 공유 페이지에서 뽑은 메타데이터야. 여기서 식당(장소) 정보를 ' +
            '추출해서 save_place 도구로 저장해줘. 추측이 어려우면 빈 문자열로 둬.\n\n' +
            context,
        },
      ],
    }),
  });

  if (!anthRes.ok) {
    const t = await anthRes.text().catch(() => '');
    throw new Error(`Claude API ${anthRes.status}: ${t.slice(0, 200)}`);
  }

  const data = await anthRes.json();
  const block = (data.content || []).find((c) => c.type === 'tool_use');
  if (!block) throw new Error('Claude 응답에 tool_use 없음');
  return block.input;
}
