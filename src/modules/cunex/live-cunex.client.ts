import { HttpStatus, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AppError } from '../../common/errors.js';
import {
  CunexClient,
  type CunexNotification,
  type CunexProfile,
  type NotificationReport,
} from './cunex.client.js';

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

  async createShareLink(callbackUrl: string): Promise<string> {
    const body = await this.post('create_link', { callbackUrl });
    const parsed = z
      .object({ status: z.literal('success'), shareUrl: z.url() })
      .safeParse(body);
    if (!parsed.success) {
      throw new Error(`CUNEX create_link failed: ${JSON.stringify(body)}`);
    }
    return parsed.data.shareUrl;
  }

  async sendNotifications(
    items: CunexNotification[],
  ): Promise<NotificationReport> {
    const body = await this.post('notification', {
      data: items.map((n) => ({
        userId: n.userId,
        text_TH: n.textTh,
        ...(n.textEn ? { text_EN: n.textEn } : {}),
        ...(n.callbackUrl ? { callbackUrl: n.callbackUrl } : {}),
      })),
    });
    const parsed = z
      .object({ summarySuccess: z.number(), summaryFailed: z.number() })
      .safeParse(body);
    if (!parsed.success) {
      throw new Error(`CUNEX notification failed: ${JSON.stringify(body)}`);
    }
    return {
      succeeded: parsed.data.summarySuccess,
      failed: parsed.data.summaryFailed,
    };
  }

  /** POST for the worker's calls. Errors throw so BullMQ retries the job. */
  private async post(path: string, payload: unknown): Promise<unknown> {
    const res = await fetch(
      new URL(path, withTrailingSlash(this.cfg.gatewayUrl)),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ClientId: this.cfg.clientId,
          ClientSecret: this.cfg.clientSecret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        `CUNEX ${path} returned ${res.status}: ${JSON.stringify(body)}`,
      );
    }
    return body;
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
