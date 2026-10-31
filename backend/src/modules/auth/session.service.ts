import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';
import { sql } from 'kysely';
import type { Env } from '../../config/env.js';
import { Database } from '../../infra/database/database.js';
import type { User } from '../users/users.repository.js';

export const SESSION_COOKIE = 'sid';

// 32 random bytes, base64url: exactly 43 chars. Anything else is not ours,
// so it is rejected before touching the database.
const SESSION_ID = /^[A-Za-z0-9_-]{43}$/;

// Only the hash is stored (sessions.id_hash), never the cookie value itself.
const hashOf = (id: string) => createHash('sha256').update(id).digest();

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;
  private readonly secureCookie: boolean;

  constructor(
    @Inject(Database) private readonly db: Database,
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
    const now = new Date();
    await this.db.transaction().execute(async (tx) => {
      // Each login adds a row; drop this user's expired ones so the table
      // stays about one row per active device.
      await tx
        .deleteFrom('sessions')
        .where('userId', '=', userId)
        .where('expiresAt', '<=', now)
        .execute();
      await tx
        .insertInto('sessions')
        .values({
          idHash: hashOf(id),
          userId,
          expiresAt: new Date(now.getTime() + this.ttlSeconds * 1000),
        })
        .execute();
    });
    return id;
  }

  /** The logged-in user, read fresh with the session in one query. */
  async userFor(id: string | undefined): Promise<User | undefined> {
    if (!id || !SESSION_ID.test(id)) return undefined;
    return this.db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.userId')
      .selectAll('users')
      .where('sessions.idHash', '=', hashOf(id))
      .where('sessions.expiresAt', '>', sql<Date>`now()`)
      .executeTakeFirst();
  }

  async destroy(id: string | undefined): Promise<void> {
    if (!id || !SESSION_ID.test(id)) return;
    await this.db
      .deleteFrom('sessions')
      .where('idHash', '=', hashOf(id))
      .execute();
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
