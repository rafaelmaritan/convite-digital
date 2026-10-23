import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { webcrypto } from 'node:crypto';

const source = await readFile(
  new URL('../functions/api/admin/events/[slug]/rsvps.js', import.meta.url),
  'utf8',
);
const { onRequestGet } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);

const teamDomain = 'https://example.cloudflareaccess.com';
const accessAudience = 'organizer-access-audience';
const organizerEmail = 'organizer@example.com';
const organizerApiKey = 'test-organizer-api-key-with-at-least-32-characters';
const apiBaseUrl = 'https://invitation-api.example';
let accessJwk;
let privateKey;

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function createAccessToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key' };
  const claims = {
    iss: teamDomain,
    aud: accessAudience,
    email: organizerEmail,
    iat: now,
    nbf: now - 5,
    exp: now + 300,
    ...overrides,
  };
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedClaims = encodeBase64Url(JSON.stringify(claims));
  const signedContent = `${encodedHeader}.${encodedClaims}`;
  const signature = await webcrypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signedContent),
  );
  return `${signedContent}.${encodeBase64Url(signature)}`;
}

function createContext({ token, env = {}, slug = 'pedro-1-ano' } = {}) {
  const headers = new Headers();
  if (token) {
    headers.set('Cf-Access-Jwt-Assertion', token);
  }
  return {
    request: new Request(`https://invitation.pages.dev/api/admin/events/${slug}/rsvps`, { headers }),
    params: { slug },
    env: {
      ACCESS_TEAM_DOMAIN: teamDomain,
      ACCESS_AUDIENCE: accessAudience,
      ORGANIZER_EMAIL: organizerEmail,
      RSVP_API_BASE_URL: apiBaseUrl,
      ORGANIZER_API_KEY: organizerApiKey,
      ...env,
    },
  };
}

test.before(async () => {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  privateKey = keyPair.privateKey;
  accessJwk = {
    ...await webcrypto.subtle.exportKey('jwk', keyPair.publicKey),
    kid: 'test-key',
    alg: 'RS256',
    use: 'sig',
  };
});

test('denies calls without an Access token before contacting any origin', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('fetch must not be called'); };
  try {
    const response = await onRequestGet(createContext());
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('denies a valid Access token for another email', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('fetch must not be called'); };
  try {
    const token = await createAccessToken({ email: 'other@example.com' });
    const response = await onRequestGet(createContext({ token }));
    assert.equal(response.status, 401);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('validates Access JWT and forwards the private key only to Railway', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    calls.push({ url, headers: new Headers(init.headers) });
    if (url.pathname === '/cdn-cgi/access/certs') {
      return Response.json({ keys: [accessJwk] });
    }
    return Response.json([
      {
        id: 23,
        event_id: 1,
        name: 'Ana Silva',
        attending: true,
        adults: 2,
        children: 1,
        message: 'Vamos levar um bolo?',
        created_at: '2026-10-07T15:00:00Z',
      },
    ]);
  };

  try {
    const token = await createAccessToken();
    const response = await onRequestGet(createContext({ token }));
    const records = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(records[0].name, 'Ana Silva');
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url.href, `${apiBaseUrl}/api/admin/events/pedro-1-ano/rsvps`);
    assert.equal(calls[1].headers.get('X-Organizer-Key'), organizerApiKey);
    assert.equal(calls[0].headers.has('X-Organizer-Key'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('logs upstream fetch failures without exposing the organizer key', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const logs = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === '/cdn-cgi/access/certs') {
      return Response.json({ keys: [accessJwk] });
    }
    throw new TypeError('upstream connection failed');
  };
  console.error = (...args) => logs.push(args);

  try {
    const token = await createAccessToken();
    const response = await onRequestGet(createContext({ token }));

    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      detail: 'Serviço de confirmações indisponível.',
    });
    assert.deepEqual(logs, [[
      'Organizer RSVP proxy upstream failure',
      { stage: 'fetch', errorName: 'TypeError', upstreamStatus: null },
    ]]);
    assert.equal(JSON.stringify(logs).includes(organizerApiKey), false);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});
