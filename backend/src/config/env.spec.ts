import { validateEnv } from './env.js';

const base = {
  APP_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  VOTER_KEY_PEPPER: 'x'.repeat(32),
  S3_ACCESS_KEY_ID: 'k',
  S3_SECRET_ACCESS_KEY: 's',
};

describe('validateEnv', () => {
  it('defaults to mock CUNEX and treats blank URLs as unset', () => {
    const env = validateEnv({ ...base, CUNEX_GATEWAY_URL: '' });
    expect(env.CUNEX_MODE).toBe('mock');
    expect(env.CUNEX_GATEWAY_URL).toBeUndefined();
  });

  it('parses the bootstrap admin list', () => {
    const env = validateEnv({
      ...base,
      ADMIN_BOOTSTRAP_CUNEX_IDS: ' 1001, ,1002 ',
    });
    expect(env.ADMIN_BOOTSTRAP_CUNEX_IDS).toEqual(['1001', '1002']);
  });

  it('refuses mock CUNEX in production', () => {
    expect(() => validateEnv({ ...base, APP_ENV: 'production' })).toThrow(
      /CUNEX_MODE/,
    );
  });

  it('requires CUNEX credentials in live mode', () => {
    expect(() => validateEnv({ ...base, CUNEX_MODE: 'live' })).toThrow(
      /CUNEX_CLIENT_SECRET/,
    );
  });
});
