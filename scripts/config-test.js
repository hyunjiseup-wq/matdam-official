const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const vercel = require(path.join(root, 'vercel.json'));
const eas = require(path.join(root, 'eas.json'));
const app = require(path.join(root, 'app.json')).expo;
const supabaseConfig = fs.readFileSync(path.join(root, 'supabase', 'config.toml'), 'utf8');
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const gitattributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8');
const dependabot = fs.readFileSync(path.join(root, '.github', 'dependabot.yml'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const workflowSources = [
  path.join(root, '.github', 'workflows', 'quality.yml'),
  path.join(root, '.github', 'workflows', 'db-backup.yml'),
].map((file) => fs.readFileSync(file, 'utf8'));

for (const key of [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_API_BASE',
  'EXPO_PUBLIC_SITE_URL',
  'GOOGLE_MAPS_API_KEY',
  'ANTHROPIC_API_KEY',
]) {
  assert.match(envExample, new RegExp(`^${key}=`, 'm'), `.env.example에 ${key}가 필요합니다.`);
}

assert.match(gitignore, /^\.env\*$/m);
assert.match(gitignore, /^!\.env\.example$/m);
assert.match(gitattributes, /^\*\.tsx text eol=lf$/m);
assert.match(gitattributes, /^\*\.sql text eol=lf$/m);
assert.match(dependabot, /^version: 2$/m);
assert.match(dependabot, /package-ecosystem: npm/);
assert.match(dependabot, /package-ecosystem: github-actions/);
for (const workflow of workflowSources) {
  const externalActions = [...workflow.matchAll(/^\s*(?:-\s+)?uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)].map(
    (match) => match[1],
  );
  assert.ok(externalActions.length > 0, '워크플로에 검사할 외부 Action이 필요합니다.');
  for (const action of externalActions) {
    assert.match(action, /^[^@]+@[0-9a-f]{40}$/, `${action}은 40자 커밋 SHA로 고정해야 합니다.`);
  }
}
assert.match(workflowSources[0], /persist-credentials:\s*false/);
assert.match(workflowSources[0], /schedule:/);
assert.match(workflowSources[0], /cron: '0 0 \* \* 1'/);
assert.match(workflowSources[0], /workflow_dispatch:/);
assert.match(workflowSources[0], /npm run audit:ci/);
assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.110.0');
assert.equal(pkg.allowScripts['@sentry/cli@2.58.4'], true);
assert.equal(pkg.allowScripts['core-js'], false);
assert.ok(pkg.dependencies['expo-dev-client'], 'developmentClient 프로필에는 expo-dev-client가 필요합니다.');
assert.equal(pkg.engines.node, '>=22 <25');
assert.match(readme, /Expo SDK 56/);
assert.match(readme, /React Native 0\.85/);
assert.match(readme, /Node\.js 22~24/);
assert.match(readme, /scripts\/pagination-test\.js|페이지네이션 검사/);
assert.match(readme, /20260810231607_optimize_discover_queries\.sql/);
assert.match(readme, /운영 적용 상태[\s\S]*미적용/);
assert.match(readme, /\.github\/workflows\/quality\.yml|`quality\.yml`/);
assert.match(readme, /\.github\/workflows\/db-backup\.yml|`db-backup\.yml`/);
assert.match(readme, /Preview 검증 전 Production 승격 금지/);
assert.match(readme, /인스턴스당 분당 10회/);
assert.doesNotMatch(readme, /Expo SDK 51/);
assert.doesNotMatch(readme, /303곳|312곳/);
assert.ok(pkg.scripts.check.includes('typecheck'));
assert.ok(pkg.scripts.check.includes('build:web'));
assert.ok(pkg.scripts.check.includes('test:web-runtime'));
assert.equal(pkg.scripts['audit:ci'], 'node scripts/dependency-audit.js');
assert.match(pkg.scripts['build:web'], /--clear/);
assert.match(pkg.scripts['build:web'], /web-bundle-test/);
const webRuntimeSource = fs.readFileSync(path.join(root, 'scripts', 'web-runtime-test.js'), 'utf8');
assert.match(webRuntimeSource, /process\.argv\[2\] \|\| 'dist'/);
assert.equal(vercel.buildCommand, 'npm run build:web');
assert.equal(vercel.outputDirectory, 'dist');
assert.equal(vercel.functions['api/extract-place.js'].maxDuration, 30);
assert.ok(vercel.rewrites.some((rewrite) => rewrite.source.includes('?!api/')));
assert.ok(
  vercel.headers
    .flatMap((entry) => entry.headers)
    .some((header) => header.key === 'X-Content-Type-Options' && header.value === 'nosniff'),
);
const responseHeaders = new Map(
  vercel.headers.flatMap((entry) => entry.headers).map((header) => [header.key, header.value]),
);
assert.equal(responseHeaders.get('X-Frame-Options'), 'DENY');
assert.match(responseHeaders.get('Strict-Transport-Security') ?? '', /max-age=63072000/);
assert.match(responseHeaders.get('Content-Security-Policy') ?? '', /frame-ancestors 'none'/);
assert.match(responseHeaders.get('Content-Security-Policy') ?? '', /object-src 'none'/);
assert.equal(eas.build.development.developmentClient, true);
assert.equal(eas.build.development.extends, 'base');
assert.equal(eas.build.base.node, '22.14.0');
assert.equal(eas.build.production.environment, 'production');
assert.equal(app.scheme, 'matdam');
assert.ok(app.description);
const notificationPlugin = app.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-notifications',
);
assert.equal(notificationPlugin?.[1]?.defaultChannel, 'default');
assert.equal(app.ios.bundleIdentifier, 'com.matdam.app');
assert.equal(app.android.package, 'com.matdam.app');
assert.ok(app.extra.eas.projectId);
assert.match(supabaseConfig, /^minimum_password_length = 8$/m);
assert.match(supabaseConfig, /^password_requirements = "letters_digits"$/m);
assert.match(supabaseConfig, /^site_url = "http:\/\/127\.0\.0\.1:3000"$/m);
assert.match(supabaseConfig, /^additional_redirect_urls = \["http:\/\/127\.0\.0\.1:3000"\]$/m);

const pushSource = fs.readFileSync(path.join(root, 'lib', 'push.ts'), 'utf8');
assert.match(pushSource, /addNotificationResponseReceivedListener/);
assert.match(pushSource, /getLastNotificationResponseAsync/);
assert.match(pushSource, /getPushRoute/);

const authSource = fs.readFileSync(path.join(root, 'context', 'AuthContext.tsx'), 'utf8');
assert.match(authSource, /Linking\.createURL\('reset-password'\)/);
assert.match(authSource, /supabase\.auth\.setSession/);
assert.match(authSource, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
assert.match(authSource, /assertValidPassword\(password\)/);
assert.match(authSource, /assertValidPassword\(newPassword\)/);

const loginSource = fs.readFileSync(path.join(root, 'app', 'login.tsx'), 'utf8');
assert.doesNotMatch(loginSource, /비밀번호 \(6자 이상\)/);
assert.match(loginSource, /비밀번호 \(8자 이상, 영문\+숫자\)/);

const placeClientSource = fs.readFileSync(path.join(root, 'lib', 'placeExtract.ts'), 'utf8');
assert.match(placeClientSource, /Authorization: `Bearer \$\{session\.access_token\}`/);

const placeApiSource = fs.readFileSync(path.join(root, 'api', 'extract-place.js'), 'utf8');
assert.match(placeApiSource, /\/auth\/v1\/user/);
assert.match(placeApiSource, /status\(401\)/);
assert.match(placeApiSource, /status\(415\)/);

const webSmokeSource = fs.readFileSync(path.join(root, 'scripts', 'web-smoke.js'), 'utf8');
assert.doesNotMatch(webSmokeSource, /sb_publishable_[A-Za-z0-9_-]+/);
assert.doesNotMatch(webSmokeSource, /process\.argv\[2\]\s*\|\|/);
assert.match(webSmokeSource, /ALLOW_SMOKE_ACCOUNT_MUTATION/);
assert.match(webSmokeSource, /finally\s*\{/);

console.log('Configuration tests passed');
