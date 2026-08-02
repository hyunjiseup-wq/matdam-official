const assert = require('node:assert/strict');
const handler = require('../api/extract-place');

const { createHandler, isAllowedMapUrl, isPrivateAddress } = handler._test;

assert.equal(isAllowedMapUrl('https://naver.me/abc123'), true);
assert.equal(isAllowedMapUrl('https://map.naver.com/p/entry/place/123456'), true);
assert.equal(isAllowedMapUrl('https://maps.app.goo.gl/abc123'), true);
assert.equal(isAllowedMapUrl('https://www.google.com/maps/place/test'), true);
assert.equal(isAllowedMapUrl('https://example.com/maps/place/test'), false);
assert.equal(isAllowedMapUrl('http://naver.me/abc123'), false);
assert.equal(isAllowedMapUrl('https://naver.me.evil.example/abc123'), false);

for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.1.1', '::1', 'fc00::1']) {
  assert.equal(isPrivateAddress(ip), true, `${ip} should be private`);
}
assert.equal(isPrivateAddress('8.8.8.8'), false);
assert.equal(isPrivateAddress('2001:4860:4860::8888'), false);

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

async function testHandlerBoundaries() {
  const forbiddenOrigin = createResponse();
  await handler({ method: 'POST', headers: { origin: 'https://evil.example' } }, forbiddenOrigin);
  assert.equal(forbiddenOrigin.statusCode, 403);

  const options = createResponse();
  await handler({ method: 'OPTIONS', headers: { origin: 'https://matdam-official.vercel.app' } }, options);
  assert.equal(options.statusCode, 200);
  assert.equal(options.headers['Access-Control-Allow-Origin'], 'https://matdam-official.vercel.app');
  assert.match(options.headers['Access-Control-Allow-Headers'], /Authorization/);

  const wrongMethod = createResponse();
  await handler({ method: 'GET', headers: {} }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);

  const unsupportedMedia = createResponse();
  await handler({ method: 'POST', headers: { 'content-type': 'text/plain' } }, unsupportedMedia);
  assert.equal(unsupportedMedia.statusCode, 415);

  const missingAuth = createResponse();
  await handler(
    { method: 'POST', headers: { 'content-type': 'application/json' } },
    missingAuth,
  );
  assert.equal(missingAuth.statusCode, 401);
  assert.equal(missingAuth.headers['WWW-Authenticate'], 'Bearer');
  assert.equal(missingAuth.headers['Cache-Control'], 'no-store');

  const authUnavailableHandler = createHandler({
    verifyUser: async () => ({ status: 'unavailable' }),
  });
  const authUnavailable = createResponse();
  await authUnavailableHandler(
    { method: 'POST', headers: { 'content-type': 'application/json' } },
    authUnavailable,
  );
  assert.equal(authUnavailable.statusCode, 503);

  const authorizedHandler = createHandler({
    verifyUser: async () => ({ status: 'authenticated', userId: 'test-user' }),
  });

  const invalidTarget = createResponse();
  await authorizedHandler(
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { url: 'https://example.com/not-a-map' },
      socket: { remoteAddress: '203.0.113.10' },
    },
    invalidTarget,
  );
  assert.equal(invalidTarget.statusCode, 400);

  const malformedJson = createResponse();
  await authorizedHandler(
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json',
      socket: { remoteAddress: '203.0.113.10' },
    },
    malformedJson,
  );
  assert.equal(malformedJson.statusCode, 400);

  const oversizedBody = createResponse();
  await authorizedHandler(
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'x'.repeat(10_001),
      socket: { remoteAddress: '203.0.113.10' },
    },
    oversizedBody,
  );
  assert.equal(oversizedBody.statusCode, 413);

  const oversizedObject = createResponse();
  await authorizedHandler(
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { url: 'https://naver.me/test', padding: 'x'.repeat(10_001) },
    },
    oversizedObject,
  );
  assert.equal(oversizedObject.statusCode, 413);

  const rateLimitedHandler = createHandler({
    verifyUser: async () => ({ status: 'authenticated', userId: 'rate-test-user' }),
  });
  for (let i = 0; i < 10; i += 1) {
    const response = createResponse();
    await rateLimitedHandler(
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { url: 'https://example.com/not-a-map' },
      },
      response,
    );
    assert.equal(response.statusCode, 400);
  }
  const rateLimited = createResponse();
  await rateLimitedHandler(
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { url: 'https://example.com/not-a-map' },
    },
    rateLimited,
  );
  assert.equal(rateLimited.statusCode, 429);
  assert.equal(rateLimited.headers['Retry-After'], '60');
}

async function testSupabaseTokenVerification() {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  let captured;
  process.env.SUPABASE_URL = 'https://project-ref.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
  global.fetch = async (url, options) => {
    captured = { url: String(url), options };
    return new Response(JSON.stringify({ id: 'verified-user' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const response = createResponse();
    await createHandler()(
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer verified-jwt',
          'content-type': 'application/json',
        },
        body: { url: 'https://example.com/not-a-map' },
      },
      response,
    );
    assert.equal(response.statusCode, 400);
    assert.equal(captured.url, 'https://project-ref.supabase.co/auth/v1/user');
    assert.equal(captured.options.headers.apikey, 'test-publishable-key');
    assert.equal(captured.options.headers.Authorization, 'Bearer verified-jwt');
  } finally {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
}

Promise.all([testHandlerBoundaries(), testSupabaseTokenVerification()])
  .then(() => console.log('API security tests passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
