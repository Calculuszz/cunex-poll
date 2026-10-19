import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppError } from './errors.js';

/**
 * Fixed-window counter in Redis: at most `limit` hits per `windowSeconds` for
 * a key. Shared across API replicas. Throws 429 with Retry-After when over.
 */
@Injectable()
export class RateLimiter {
  constructor(@Inject(Redis) private readonly redis: Redis) {}

  async hit(key: string, limit: number, windowSeconds: number): Promise<void> {
    const k = `rl:${key}`;
    const [[, count], [, ttl]] = (await this.redis
      .multi()
      .incr(k)
      .ttl(k)
      .exec()) as [[null, number], [null, number]];
    if (ttl < 0) await this.redis.expire(k, windowSeconds);
    if (count > limit) {
      throw new AppError(
        'RATE_LIMITED',
        HttpStatus.TOO_MANY_REQUESTS,
        'Too many requests, try again later',
        { retryAfterSeconds: ttl > 0 ? ttl : windowSeconds },
      );
    }
  }
}
