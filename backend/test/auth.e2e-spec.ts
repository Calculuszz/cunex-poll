import type { NestExpressApplication } from '@nestjs/platform-express';
import type pg from 'pg';
import request from 'supertest';
import {
  APP_ORIGIN,
  cookie,
  createTestApp,
  loginAs as login,
} from './e2e-env.js';

let app: NestExpressApplication;
let db: pg.Client;

beforeAll(async () => {
  ({ app, db } = await createTestApp());
});

afterAll(async () => {
  await app?.close();
  await db?.end();
});

const http = () => request(app.getHttpServer());

const loginAs = (mockUser: string) => login(app, mockUser);

describe('CUNEX login (mock)', () => {
  it('login → CUNEX → callback → back to the web app with a session', async () => {
    const login = await http().get(
      '/api/v1/auth/cunex/login?returnTo=/polls/42&mockUser=med-2566',
    );
    expect(login.status).toBe(302);
    expect(login.headers.location).toBe(
      '/api/v1/auth/cunex/callback?token=mock_med-2566',
    );
    const returnTo = cookie(login, 'return_to');
    expect(returnTo).toBeDefined();

    const callback = await http()
      .get(login.headers.location)
      .set('Cookie', returnTo!);
    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe(`${APP_ORIGIN}/polls/42`);
    const sid = cookie(callback, 'sid');
    expect(sid).toMatch(/^sid=[A-Za-z0-9_-]{43}$/);
    expect(callback.get('Set-Cookie')!.join()).toContain('HttpOnly');

    const me = await http().get('/api/v1/me').set('Cookie', sid!);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({
      role: 'user',
      studentId: '6630000230',
      isChulaVerified: true,
      faculty: { code: '30', nameEn: 'Faculty of Medicine' },
      studentYear: 2566,
      providers: ['cunex'],
    });
  });

  it('logging in again reuses the same user', async () => {
    const first = await loginAs('arts-2565');
    const second = await loginAs('arts-2565');
    const a = await http().get('/api/v1/me').set('Cookie', first);
    const b = await http().get('/api/v1/me').set('Cookie', second);
    expect(a.body.id).toBe(b.body.id);

    const users = await db.query(
      "SELECT count(*)::int AS n FROM user_identities WHERE provider_subject = '100000000000000003'",
    );
    expect(users.rows[0].n).toBe(1);
  });

  it('expired token sends the browser to the login page, no session', async () => {
    const res = await http().get(
      '/api/v1/auth/cunex/callback?token=mock_expired',
    );
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      `${APP_ORIGIN}/login?error=token_expired`,
    );
    expect(cookie(res, 'sid')).toBeUndefined();
  });

  it('never redirects off-site', async () => {
    const res = await http().get(
      '/api/v1/auth/cunex/callback?token=mock_eng-2567&returnTo=//evil.com',
    );
    expect(res.headers.location).toBe(`${APP_ORIGIN}/`);
  });
});

describe('sessions', () => {
  it('rejects requests without a session', async () => {
    const res = await http().get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.type).toBe('application/problem+json');
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a forged session id', async () => {
    const res = await http()
      .get('/api/v1/me')
      .set('Cookie', `sid=${'a'.repeat(43)}`);
    expect(res.status).toBe(401);
  });

  it('logout needs our Origin, then kills the session', async () => {
    const sid = await loginAs('eng-2567');

    const noOrigin = await http()
      .post('/api/v1/auth/logout')
      .set('Cookie', sid);
    expect(noOrigin.status).toBe(403);
    expect(noOrigin.body.code).toBe('BAD_ORIGIN');

    const ok = await http()
      .post('/api/v1/auth/logout')
      .set('Cookie', sid)
      .set('Origin', APP_ORIGIN);
    expect(ok.status).toBe(204);

    const me = await http().get('/api/v1/me').set('Cookie', sid);
    expect(me.status).toBe(401);
  });

  it('are stored in Postgres as a hash, never the cookie value', async () => {
    const sid = await loginAs('arts-2565');
    const value = sid.slice('sid='.length);
    const { rows } = await db.query(
      "SELECT encode(id_hash, 'hex') AS h FROM sessions WHERE id_hash = sha256(convert_to($1, 'UTF8'))",
      [value],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].h).not.toContain(value);
  });

  it('stop working once expired, and a new login clears the old rows', async () => {
    const sid = await loginAs('arts-2565');
    const value = sid.slice('sid='.length);
    await db.query(
      "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id_hash = sha256(convert_to($1, 'UTF8'))",
      [value],
    );
    expect((await http().get('/api/v1/me').set('Cookie', sid)).status).toBe(
      401,
    );

    await loginAs('arts-2565');
    const { rows } = await db.query(
      "SELECT count(*)::int AS n FROM sessions s JOIN user_identities i ON i.user_id = s.user_id WHERE i.provider_subject = '100000000000000003' AND s.expires_at <= now()",
    );
    expect(rows[0].n).toBe(0);
  });
});

describe('dev login (test accounts popup)', () => {
  it('logs in as admin', async () => {
    const res = await http()
      .post('/api/v1/auth/dev/login')
      .set('Origin', APP_ORIGIN)
      .send({ role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('admin');
    expect(cookie(res, 'sid')).toBeDefined();
  });

  it('validates the body', async () => {
    const res = await http()
      .post('/api/v1/auth/dev/login')
      .set('Origin', APP_ORIGIN)
      .send({ role: 'root' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('UNPROCESSABLE');
    expect(res.body.problems).toEqual([
      { path: 'role', message: expect.any(String) },
    ]);
  });
});

describe('health', () => {
  it('is public and reports dependencies', async () => {
    expect((await http().get('/healthz')).status).toBe(200);
    const ready = await http().get('/readyz');
    expect(ready.status).toBe(200);
    expect(ready.body.info).toMatchObject({
      postgres: { status: 'up' },
      redis: { status: 'up' },
    });
  });
});
