// =============================================================
// 웹 스모크 테스트: 렌더 → 로그인 → 홈 → 지도까지 실제 브라우저로 검증
//
// 사용법:
//   npm i -D puppeteer-core   (1회)
//   ALLOW_SMOKE_ACCOUNT_MUTATION=1 node scripts/web-smoke.js http://localhost:8099
//
// 테스트 계정을 실제로 만들었다가 마지막에 delete_my_account 로 지운다.
// 대상 URL, Supabase 환경변수, 명시적 계정 변경 승인 플래그가 모두 필요하다.
// Chrome 필요 (경로 다르면 CHROME_PATH 환경변수로 지정).
// =============================================================
const path = require('path');
const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');

const BASE = process.argv[2];
const SB_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const CHROME =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

let pass = 0;
let fail = 0;
const check = (label, ok, extra) => {
  console.log(`${ok ? 'OK ' : 'FAIL'} | ${label}${extra ? ' | ' + extra : ''}`);
  ok ? pass++ : fail++;
};

async function main() {
  if (!BASE) {
    throw new Error('테스트 대상 URL을 명시하세요. 운영 주소가 기본값으로 사용되지 않습니다.');
  }
  const target = new URL(BASE);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('테스트 대상은 HTTP(S) URL이어야 합니다.');
  }
  if (!SB_URL || !SB_KEY) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY가 필요합니다.');
  }
  if (process.env.ALLOW_SMOKE_ACCOUNT_MUTATION !== '1') {
    throw new Error('계정 생성·삭제를 허용하려면 ALLOW_SMOKE_ACCOUNT_MUTATION=1을 설정하세요.');
  }

  // 0) 테스트 계정 생성 (아이디 기반 가짜 이메일 — 앱 로그인 폼과 동일 규칙)
  const id = 'smoke' + Date.now().toString().slice(-8);
  const pw = 'Smoke!Test99';
  const sb = createClient(SB_URL, SB_KEY);
  let accountCreated = false;
  let browser;

  try {
    const { error: suErr } = await sb.auth.signUp({
      email: `${id}@seoulmatjip.app`,
      password: pw,
      options: { data: { display_name: '스모크봇' } },
    });
    check('test account created', !suErr, suErr && suErr.message);
    if (suErr) throw suErr;
    accountCreated = true;

    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      // 런마다 새 프로필 (이전 런 세션이 남으면 로그인 화면이 안 떠 오탐)
      userDataDir: path.join(require('os').tmpdir(), 'matdam-smoke-' + Date.now()),
      args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--window-size=420,860'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 860 });

    const jsErrors = [];
    page.on('pageerror', (e) => jsErrors.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const url = (m.location() && m.location().url) || '';
      if (/favicon|manifest/i.test(m.text())) return;
      // 외부 리소스(이미지·타일·API 404류) 실패는 데이터 문제로 기록만
      if (/Failed to load resource/.test(m.text()) && url && !url.startsWith(BASE)) {
        console.log('  (외부 리소스 실패 무시: ' + url.slice(0, 120) + ')');
        return;
      }
      jsErrors.push('console: ' + m.text() + (url ? ' @ ' + url.slice(0, 120) : ''));
    });

    // 1) 첫 로드(로그아웃) → 랜딩 페이지
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  const landingOk = await page
    .waitForFunction(() => document.body.innerText.includes('무료로 시작하기'), { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  check('landing page rendered', landingOk);

  // 1.2) 로그인 화면
  await page.goto(new URL('/login', BASE).href, { waitUntil: 'networkidle2', timeout: 60000 });
  const idInput = await page
    .waitForSelector('input[placeholder^="아이디"]', { timeout: 30000 })
    .catch(() => null);
  check('login screen rendered', !!idInput);
    if (!idInput) {
      console.log('BODY:', (await page.evaluate(() => document.body.innerText)).slice(0, 400));
      throw new Error('로그인 화면을 찾지 못했습니다.');
    }

  // 1.5) 로그인 전 공개 라우트: 비밀번호 찾기 화면이 로그인으로 튕기지 않아야
  await page.goto(new URL('/forgot-password', BASE).href, { waitUntil: 'networkidle2', timeout: 60000 });
  const forgotOk = await page
    .waitForFunction(() => document.body.innerText.includes('비밀번호 찾기'), { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  check('forgot-password public route', forgotOk);
  await page.goto(new URL('/login', BASE).href, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('input[placeholder^="아이디"]', { timeout: 30000 });

  // 2) 로그인 ('로그인' 텍스트는 탭에도 있어 마지막 것이 제출 버튼)
  await page.type('input[placeholder^="아이디"]', id);
  await page.type('input[placeholder^="비밀번호"]', pw);
  await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll('div, span')).filter(
      (el) => el.childElementCount === 0 && el.textContent.trim() === '로그인'
    );
    const target = texts[texts.length - 1];
    const btn =
      target &&
      (target.closest('[tabindex]') || target.closest('[role="button"]') || target.parentElement);
    if (btn) btn.click();
  });

  // 3) 홈 진입
  const homeOk = await page
    .waitForFunction(
      () =>
        document.body.innerText.includes('맛담') &&
        !document.querySelector('input[placeholder^="아이디"]'),
      { timeout: 30000 }
    )
    .then(() => true)
    .catch(() => false);
  check('login → home rendered', homeOk);

  const bodyText = await page.evaluate(() => document.body.innerText);
  check('bottom nav present', /둘러보기|지도|MY/.test(bodyText));

  // 4) 지도 화면 (웹 Leaflet): 마커 수 배지 확인
  await page.goto(new URL('/map', BASE).href, { waitUntil: 'networkidle2', timeout: 60000 });
  const mapOk = await page
    .waitForFunction(() => document.body.innerText.includes('곳 표시'), { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  const badge = mapOk
    ? await page.evaluate(() => (document.body.innerText.match(/[^\n]*곳 표시[^\n]*/) || [''])[0])
    : '';
  check('web map renders with markers badge', mapOk, badge);

  // 5) 치명 JS 에러 없음
  check('no fatal JS errors', jsErrors.length === 0, jsErrors.slice(0, 3).join(' || ').slice(0, 300));

  } finally {
    if (browser) await browser.close().catch(() => {});

    // 6) 중간 실패 여부와 관계없이 생성한 테스트 계정 삭제 시도
    if (accountCreated) {
      const sb2 = createClient(SB_URL, SB_KEY);
      const { error: signInErr } = await sb2.auth.signInWithPassword({
        email: `${id}@seoulmatjip.app`,
        password: pw,
      });
      if (signInErr) {
        check('test account cleanup login', false, signInErr.message);
      } else {
        const { error: delErr } = await sb2.rpc('delete_my_account');
        check('test account deleted', !delErr, delErr && delErr.message);
      }
    }
  }

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}

main().catch((e) => {
  console.error('UNCAUGHT', e);
  process.exitCode = 1;
});
