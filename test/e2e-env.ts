// Points the app at a separate test database and Redis DB so e2e runs never
// touch local dev data. Needs `pnpm db:up` (docker compose) running.
import { existsSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import pg from 'pg';
import { runMigrations } from '../scripts/migrator.js';

export const APP_ORIGIN = 'http://localhost:5173';

export async function createTestApp(): Promise<{
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
  if (exists.rowCount === 0) await admin.query('CREATE DATABASE pollcunex_test');
  await admin.end();
  await runMigrations(testUrl.toString());

  const db = new pg.Client({ connectionString: testUrl.toString() });
  await db.connect();
  await db.query('TRUNCATE users, faculties RESTART IDENTITY CASCADE');

  Object.assign(process.env, {
    APP_ENV: 'test',
    APP_ORIGIN,
    LOG_LEVEL: 'warn',
    DATABASE_URL: testUrl.toString(),
    REDIS_URL: 'redis://localhost:6379/15',
    CUNEX_MODE: 'mock',
    ADMIN_BOOTSTRAP_CUNEX_IDS: '',
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
