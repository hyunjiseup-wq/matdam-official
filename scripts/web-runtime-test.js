const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const projectRoot = path.join(__dirname, '..');
const distRoot = path.resolve(projectRoot, process.argv[2] || 'dist');
const distPrefix = `${path.resolve(distRoot)}${path.sep}`;
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));

assert.ok(
  fs.existsSync(path.join(distRoot, 'index.html')),
  `${distRoot}에 index.html이 없습니다.`,
);
assert.ok(chromePath, 'Chrome/Chromium을 찾을 수 없습니다. CHROME_PATH를 설정하세요.');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requestedPath = path.resolve(distRoot, `.${pathname}`);
  let filePath = requestedPath;

  if (
    (filePath !== path.resolve(distRoot) && !filePath.startsWith(distPrefix)) ||
    !fs.existsSync(filePath) ||
    fs.statSync(filePath).isDirectory()
  ) {
    filePath = path.join(distRoot, 'index.html');
  }

  response.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(response);
});

async function run() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu'],
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const requestUrl = new URL(request.url());
      if (requestUrl.origin === origin || requestUrl.protocol === 'data:') request.continue();
      else request.abort();
    });

    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(
      () => document.body.innerText.includes('무료로 시작하기'),
      { timeout: 20000 },
    );
    const landing = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText,
      rootChildren: document.getElementById('root')?.childElementCount || 0,
    }));
    assert.match(landing.title, /맛담/);
    assert.match(landing.text, /골목 노포/);
    assert.ok(landing.rootChildren > 0, '웹 루트가 비어 있습니다.');

    await page.goto(`${origin}/forgot-password`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForFunction(
      () => document.body.innerText.includes('비밀번호 찾기'),
      { timeout: 20000 },
    );

    assert.ok(
      !pageErrors.some((message) =>
        /No routes found|Supabase 설정이 없습니다/.test(message),
      ),
      `치명적인 웹 런타임 오류: ${pageErrors.join(' | ')}`,
    );
    console.log('Web runtime smoke test passed');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
