const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const scriptPath = html.match(/<script[^>]+src="([^"]+entry-[^"]+\.js)"/)?.[1];
assert.ok(scriptPath, '웹 entry bundle 경로를 찾을 수 없습니다.');

const bundle = fs.readFileSync(path.join(dist, scriptPath.replace(/^\//, '')), 'utf8');
for (const marker of ['forgot-password', 'feedback-thread', 'reset-password']) {
  assert.ok(bundle.includes(marker), `웹 번들에 앱 라우트(${marker})가 포함되지 않았습니다.`);
}

console.log('Web route bundle test passed');
