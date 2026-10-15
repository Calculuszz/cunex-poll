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
        'CUNEX_LOGIN_URL',
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
