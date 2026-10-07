import { HttpStatus, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AppError } from '../../../common/errors.js';
import { CunexClient, type CunexProfile } from './cunex.client.js';

export interface LiveCunexConfig {
  gatewayUrl: string;
  loginUrl: string;
  clientId: string;
  clientSecret: string;
}

// GET {GATEWAY}/profile response (see CUNEX LLE docs). Every field is a string.
const profileSchema = z.object({
  userId: z.string().min(1),
  studentId: z.string().min(1),
  facultyCode: z.string().regex(/^\d{2}$/),
  facultyNameTH: z.string(),
  facultyNameEN: z.string(),
  studentYear: z.string().regex(/^\d{4}$/),
});

// 417 + errorCode means the token itself is the problem, not CUNEX.
const TOKEN_ERRORS = new Set(['E002', 'E004']);

export class LiveCunexClient extends CunexClient {
  private readonly logger = new Logger(LiveCunexClient.name);

  constructor(private readonly cfg: LiveCunexConfig) {
    super();
  }

  async getProfile(token: string): Promise<CunexProfile> {
    const url = new URL('profile', withTrailingSlash(this.cfg.gatewayUrl));
    url.searchParams.set('token', token);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ClientId: this.cfg.clientId,
          ClientSecret: this.cfg.clientSecret,
        },
        signal: AbortSignal.timeout(5_000),
      });
    } catch (err) {
      this.logger.error(
        `CUNEX /profile unreachable: ${(err as Error).message}`,
      );
      throw unavailable();
    }

    const body: unknown = await res.json().catch(() => null);

    if (res.status === 417) {
      const code = z.object({ errorCode: z.string() }).safeParse(body);
      if (code.success && TOKEN_ERRORS.has(code.data.errorCode)) {
        throw new AppError(
          'CUNEX_TOKEN_INVALID',
          HttpStatus.UNAUTHORIZED,
          'CUNEX token is invalid or expired',
        );
      }
    }
    if (!res.ok) {
      this.logger.error(`CUNEX /profile returned ${res.status}`);
      throw unavailable();
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      this.logger.error('CUNEX /profile returned an unexpected body');
      throw unavailable();
    }
    const p = parsed.data;
    return {
      userId: p.userId,
      studentId: p.studentId,
      facultyCode: p.facultyCode,
      facultyNameTh: p.facultyNameTH,
      facultyNameEn: p.facultyNameEN,
      studentYear: Number(p.studentYear),
    };
  }

  loginUrl(): string {
    return this.cfg.loginUrl;
  }
}

function unavailable() {
  return new AppError(
    'CUNEX_UNAVAILABLE',
    HttpStatus.BAD_GATEWAY,
    'CUNEX is not reachable right now',
  );
}

function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}
