import { z } from 'zod';

const csv = z
  .string()
  .default('')
  .transform((s) =>
    s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  );

// Blank values in .env (KEY=) mean 'not set'.
const optionalUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.url().optional(),
);

export const envSchema = z
  .object({
    APP_ENV: z
      .enum(['development', 'test', 'staging', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_ORIGIN: z.url(),
    // Public base URL of this API; CUNEX callback links point here.
    API_PUBLIC_URL: z.url().default('http://localhost:3000'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),

    DATABASE_URL: z.url(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    REDIS_URL: z.url(),

    SESSION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(7 * 24 * 60 * 60),
    VOTER_KEY_PEPPER: z.string().min(32),
    // k-anonymity: faculty/year groups with fewer ballots are merged into "other".
    RESULTS_MIN_GROUP_SIZE: z.coerce.number().int().min(1).default(5),
    // CUNEX userIds that become admin on login. Bootstraps the first admins;
    // later admins are granted through the admin API.
    ADMIN_BOOTSTRAP_CUNEX_IDS: csv,

    // S3-compatible storage for images. Local dev: SeaweedFS from docker-compose.
    S3_ENDPOINT: optionalUrl,
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().min(1).default('pollcunex-images'),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_FORCE_PATH_STYLE: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
    // CDN/public base for serving; unset = short-lived presigned read URLs.
    S3_PUBLIC_BASE_URL: optionalUrl,
    IMAGE_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),

    // Login with Google (OIDC). Empty client id/secret = Google login disabled.
    GOOGLE_CLIENT_ID: z.string().default(''),
    GOOGLE_CLIENT_SECRET: z.string().default(''),
    GOOGLE_ISSUER_URL: z.url().default('https://accounts.google.com'),

    // mock = fake CUNEX with fixture students (no credentials needed)
    // live = real CUNEX LLE gateway
    CUNEX_MODE: z.enum(['mock', 'live']).default('mock'),
    CUNEX_GATEWAY_URL: optionalUrl,
    CUNEX_LOGIN_URL: optionalUrl,
    CUNEX_CLIENT_ID: z.string().default(''),
    CUNEX_CLIENT_SECRET: z.string().default(''),
  })
  .superRefine((env, ctx) => {
    if (env.APP_ENV === 'production' && env.CUNEX_MODE === 'mock') {
      ctx.addIssue({
        code: 'custom',
        path: ['CUNEX_MODE'],
        message: 'mock CUNEX is not allowed in production',
      });
    }
    if (env.CUNEX_MODE === 'live') {
      for (const key of [
        'CUNEX_GATEWAY_URL',
        'CUNEX_CLIENT_ID',
        'CUNEX_CLIENT_SECRET',
      ] as const) {
        if (!env[key]) {
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'required when CUNEX_MODE=live',
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
