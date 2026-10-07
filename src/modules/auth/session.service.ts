import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import { Redis } from 'ioredis';
import type { Env } from '../../config/env.js';

export const SESSION_COOKIE = 'sid';

interface SessionData {
  userId: string;
  createdAt: number;
}

// 32 random bytes, base64url: exactly 43 chars. Anything else is not ours,
// so it is rejected before touching Redis.
const SESSION_ID = /^[A-Za-z0-9_-]{43}$/;

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;
  private readonly secureCookie: boolean;

  constructor(
    @Inject(Redis) private readonly redis: Redis,
    config: ConfigService<Env, true>,
  ) {
    this.ttlSeconds = config.get('SESSION_TTL_SECONDS');
    // Local dev and tests run on plain http://localhost.
    this.secureCookie = !['development', 'test'].includes(
      config.get('APP_ENV'),
    );
  }

  async create(userId: string): Promise<string> {
    const id = randomBytes(32).toString('base64url');
    const data: SessionData = { userId, createdAt: Date.now() };
    await this.redis.set(key(id), JSON.stringify(data), 'EX', this.ttlSeconds);
    return id;
  }

  async getUserId(id: string | undefined): Promise<string | null> {
    if (!id || !SESSION_ID.test(id)) return null;
    const raw = await this.redis.get(key(id));
    return raw ? (JSON.parse(raw) as SessionData).userId : null;
  }

  async destroy(id: string | undefined): Promise<void> {
    if (id && SESSION_ID.test(id)) await this.redis.del(key(id));
  }

  cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: this.ttlSeconds * 1000,
    };
  }
}

function key(id: string) {
  return `sess:${id}`;
}
