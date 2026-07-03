// =============================================================
// 맛담 - 지도 링크 자동 인식 (Vercel 서버리스 함수)
// 네이버/구글 지도 링크를 받아 이름·주소·카테고리·사진을 추출한다.
//
// POST /api/extract-place  { "url": "https://naver.me/xxxx" }
//   → { name, address, category, image_url, naver_map_url, map_source }
//
// 환경변수(선택): ANTHROPIC_API_KEY
//   - 있으면 Claude(Haiku)로 정확히 구조화
//   - 없으면 og:태그만으로 이름·사진을 best-effort 로 채움
// =============================================================

const CATEGORIES = [
  '음식점', '한식', '한식/고기', '일식', '중식', '양식',
  'BAR', '카페', '분식', '디저트', '쇼핑', '생활/문화',
];

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

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

    // 1) 페이지 가져오기 (단축링크 리다이렉트 추적)
    const pageRes = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });
    const finalUrl = pageRes.url || url;
    const html = await pageRes.text();

    const map_source = detectSource(finalUrl, url);
    const meta = extractMeta(html);

    // 2) Claude 로 구조화 (키 있을 때)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let structured = null;
    if (apiKey) {
      try {
        structured = await callClaude(apiKey, meta, finalUrl);
      } catch (e) {
        // Claude 실패 시 meta fallback 으로 진행
        console.warn('[extract-place] Claude 실패:', e && e.message);
      }
    }

    const name = clean(
      (structured && structured.name) || cleanTitle(meta.ogTitle || meta.title) || ''
    );
    const address = clean((structured && structured.address) || meta.address || '');
    let category = (structured && structured.category) || '';
    if (!CATEGORIES.includes(category)) category = '';
    const image_url = (structured && structured.image_url) || meta.ogImage || '';

    return res.status(200).json({
      name,
      address,
      category,
      image_url,
      naver_map_url: finalUrl,
      map_source: map_source || undefined,
      ai: Boolean(structured), // AI로 구조화됐는지 여부 (클라이언트 안내용)
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: (e && e.message) || '자동 인식에 실패했어요. 직접 입력해주세요.' });
  }
};

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

function detectSource(finalUrl, original) {
  const s = `${finalUrl} ${original}`.toLowerCase();
  if (s.includes('naver')) return 'naver';
  if (s.includes('google') || s.includes('goo.gl')) return 'google';
  return null;
}

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

// "성수연방 : 네이버", "성수연방 - Google 지도" 같은 꼬리표 제거
function cleanTitle(t) {
  return String(t || '')
    .replace(/\s*[:\-|]\s*(네이버|Naver|NAVER|Google\s*지도|Google Maps|구글 지도).*$/i, '')
    .trim();
}

function metaContent(html, key) {
  // property/name 속성 순서가 뒤바뀐 경우까지 커버
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

  // JSON-LD (주소·이름이 들어있는 경우가 많음)
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

  // 주소로 보이는 텍스트 (한국 도로명/지번 흔한 패턴)
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

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, ' ');
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
        address: {
          type: 'string',
          description: '한국 주소 전체(도로명 우선). 없으면 빈 문자열.',
        },
        category: {
          type: 'string',
          enum: ['', ...CATEGORIES],
          description: `업종. 다음 중 가장 가까운 하나: ${CATEGORIES.join(', ')}. 모르면 빈 문자열.`,
        },
        image_url: {
          type: 'string',
          description: '대표 사진 URL(og:image 등). 없으면 빈 문자열.',
        },
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
            '아래는 네이버/구글 지도 공유 페이지에서 뽑은 메타데이터야. ' +
            '여기서 식당(장소) 정보를 추출해서 save_place 도구로 저장해줘. ' +
            '추측이 어려우면 빈 문자열로 둬.\n\n' +
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
