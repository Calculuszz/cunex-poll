import type { NestExpressApplication } from '@nestjs/platform-express';
import { OAuth2Server } from 'oauth2-mock-server';
import type pg from 'pg';
import request from 'supertest';
import { APP_ORIGIN, cookie, createTestApp } from './e2e-env.js';

// A real OIDC provider stand-in: discovery, JWKS, signed id_tokens, PKCE, nonce.
const google = new OAuth2Server();
let app: NestExpressApplication;
let db: pg.Client;

beforeAll(async () => {
  await google.issuer.keys.generate('RS256');
  await google.start(0, 'localhost');
  google.service.on('beforeTokenSigning', (token) => {
    Object.assign(token.payload, {
      sub: 'google-sub-123',
      email: 'Somchai@Gmail.com',
      email_verified: true,
    });
  });
  ({ app, db } = await createTestApp({
    GOOGLE_CLIENT_ID: 'test-client',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    GOOGLE_ISSUER_URL: google.issuer.url!,
  }));
});

afterAll(async () => {
  await app?.close();
  await db?.end();
  await google.stop();
});

const http = () => request(app.getHttpServer());

/** Our login redirect → the provider's consent → back to our callback URL. */
async function throughGoogle(returnTo = '/') {
  const login = await http().get(
    `/api/v1/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`,
  );
  expect(login.status).toBe(302);
  const authorize = new URL(login.headers.location!);
  expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');
  expect(authorize.searchParams.get('nonce')).toBeTruthy();
  expect(authorize.searchParams.get('redirect_uri')).toBe(
    'http://localhost:3000/api/v1/auth/google/callback',
  );

  const consent = await fetch(authorize, { redirect: 'manual' });
  const back = new URL(consent.headers.get('location')!);
  return `${back.pathname}${back.search}`;
}

it('logs in with Google and lands back where the user started', async () => {
  const callback = await throughGoogle('/polls/42');
  const res = await http().get(callback);
  expect(res.status).toBe(302);
  expect(res.headers.location).toBe(`${APP_ORIGIN}/polls/42`);

  const sid = cookie(res, 'sid');
  const me = await http().get('/api/v1/me').set('Cookie', sid!);
  expect(me.body).toMatchObject({
    role: 'user',
    isChulaVerified: false,
    faculty: null,
    studentYear: null,
    providers: ['google'],
  });

  const identity = await db.query(
    "SELECT email FROM user_identities WHERE provider = 'google' AND provider_subject = 'google-sub-123'",
  );
  expect(identity.rows).toEqual([{ email: 'somchai@gmail.com' }]);
});

it('the same Google account maps to the same user', async () => {
  const a = await http().get(await throughGoogle());
  const b = await http().get(await throughGoogle());
  const meA = await http().get('/api/v1/me').set('Cookie', cookie(a, 'sid')!);
  const meB = await http().get('/api/v1/me').set('Cookie', cookie(b, 'sid')!);
  expect(meA.body.id).toBe(meB.body.id);
});

it('a replayed or forged callback is refused', async () => {
  const callback = await throughGoogle();
  expect((await http().get(callback)).status).toBe(302);

  const replay = await http().get(callback);
  expect(replay.headers.location).toBe(
    `${APP_ORIGIN}/login?error=google_failed`,
  );
  expect(cookie(replay, 'sid')).toBeUndefined();

  const forged = await http().get(
    '/api/v1/auth/google/callback?code=abc&state=not-ours',
  );
  expect(forged.headers.location).toBe(
    `${APP_ORIGIN}/login?error=google_failed`,
  );
});
