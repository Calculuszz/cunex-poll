// Points the app at a separate test database and Redis DB so e2e runs never
// touch local dev data. Needs `pnpm db:up` (docker compose) running.
import { existsSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Redis } from 'ioredis';
import pg from 'pg';
import request from 'supertest';
import { runMigrations } from '../scripts/migrator.js';

export const APP_ORIGIN = 'http://localhost:5173';
export const TEST_REDIS_URL = 'redis://localhost:6379/15';

export async function createTestApp(
  envOverrides: Record<string, string> = {},
): Promise<{
  app: NestExpressApplication;
  db: pg.Client;
}> {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const devUrl = new URL(
    process.env.DATABASE_URL ??
      'postgres://pollcunex:pollcunex@localhost:55432/pollcunex',
  );
  const testUrl = new URL(devUrl);
  testUrl.pathname = '/pollcunex_test';

  const admin = new pg.Client({ connectionString: devUrl.toString() });
  await admin.connect();
  const exists = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = 'pollcunex_test'",
  );
  if (exists.rowCount === 0)
    await admin.query('CREATE DATABASE pollcunex_test');
  await admin.end();
  await runMigrations(testUrl.toString());

  const db = new pg.Client({ connectionString: testUrl.toString() });
  await db.connect();
  await db.query('TRUNCATE users, faculties RESTART IDENTITY CASCADE');
  // Sessions and queued jobs from earlier runs
  const redis = new Redis(TEST_REDIS_URL);
  await redis.flushdb();
  await redis.quit();

  Object.assign(process.env, {
    APP_ENV: 'test',
    APP_ORIGIN,
    LOG_LEVEL: 'warn',
    DATABASE_URL: testUrl.toString(),
    REDIS_URL: TEST_REDIS_URL,
    CUNEX_MODE: 'mock',
    ADMIN_BOOTSTRAP_CUNEX_IDS: '',
    S3_BUCKET: 'pollcunex-test',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    ...envOverrides,
  });

  // Imported only now: ConfigModule.forRoot() reads process.env when the
  // module is first evaluated, so the test overrides above must come first.
  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/app.setup.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = configureApp(
    moduleRef.createNestApplication<NestExpressApplication>({
      bufferLogs: true,
    }),
  );
  await app.init();
  return { app, db };
}

export function cookie(
  res: request.Response,
  name: string,
): string | undefined {
  const raw = res.get('Set-Cookie') ?? [];
  return raw.find((c) => c.startsWith(`${name}=`))?.split(';')[0];
}

/** Logs in through the mock CUNEX callback and returns the `sid=...` cookie. */
export async function loginAs(app: NestExpressApplication, mockUser: string) {
  const res = await request(app.getHttpServer()).get(
    `/api/v1/auth/cunex/callback?token=mock_${mockUser}`,
  );
  const sid = cookie(res, 'sid');
  if (!sid) throw new Error('no session cookie');
  return sid;
}

/** Requests as a logged-in user from our web origin, under /api/v1. */
export function as(app: NestExpressApplication, sid: string) {
  const server = app.getHttpServer();
  const withAuth = (t: request.Test) =>
    t.set('Cookie', sid).set('Origin', APP_ORIGIN);
  return {
    get: (path: string) => withAuth(request(server).get(`/api/v1${path}`)),
    post: (path: string) => withAuth(request(server).post(`/api/v1${path}`)),
    put: (path: string) => withAuth(request(server).put(`/api/v1${path}`)),
    patch: (path: string) => withAuth(request(server).patch(`/api/v1${path}`)),
    delete: (path: string) =>
      withAuth(request(server).delete(`/api/v1${path}`)),
  };
}
