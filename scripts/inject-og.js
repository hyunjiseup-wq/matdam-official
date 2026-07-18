// =============================================================
// 웹 빌드 후 dist/index.html에 OG·트위터·설명 메타 태그 주입 (체크리스트 H2)
//
// Expo SPA(single) 모드는 app/+html.tsx를 쓰지 않으므로,
// export 뒤에 이 스크립트를 돌려 <head>에 메타를 끼워 넣는다.
// 실행: npx expo export --platform web && node scripts/inject-og.js
// (vercel.json buildCommand에 포함됨)
// =============================================================
const fs = require('fs');
const path = require('path');

const SITE = 'https://matdam-official.vercel.app';
const TITLE = '맛담 — 맛집을 담고, 친구와 나누는 공간';
const DESC =
  '지도 링크만 붙여넣으면 3초 완성. 골목 노포부터 핫플까지, 나만의 맛집 리스트를 만들고 친구와 나눠요.';

const META = `
    <meta name="description" content="${DESC}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="맛담" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESC}" />
    <meta property="og:url" content="${SITE}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESC}" />
    <meta name="twitter:image" content="${SITE}/og-image.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;

const file = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('og:image')) {
  console.log('[inject-og] 이미 주입됨 — 건너뜀');
  process.exit(0);
}

html = html
  .replace('<html lang="en">', '<html lang="ko">')
  .replace('<title>맛담</title>', `<title>${TITLE}</title>${META}`);

if (!html.includes('og:image')) {
  console.error('[inject-og] 주입 실패: <title>맛담</title> 앵커를 찾지 못함');
  process.exit(1);
}

fs.writeFileSync(file, html);
console.log('[inject-og] dist/index.html에 OG 메타 주입 완료');
