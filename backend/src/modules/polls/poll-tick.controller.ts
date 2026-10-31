import { timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';
import { Database } from '../../infra/database/database.js';
import { Public } from '../auth/auth.decorators.js';
import { PollEvents } from './poll-events.service.js';

const BATCH = 20;

/**
 * JOBS_MODE=sweep (serverless, no worker): a cron calls this every minute
 * with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends exactly that;
 * Supabase pg_cron can too). It does what the worker's jobs would have done.
 * GET because cron callers use GET; every step is idempotent.
 */
@Controller('internal')
export class PollTickController {
  private readonly logger = new Logger(PollTickController.name);
  private readonly secret: Buffer | null;

  constructor(
    @Inject(Database) private readonly db: Database,
    private readonly events: PollEvents,
    config: ConfigService<Env, true>,
  ) {
    const secret = config.get('CRON_SECRET');
    this.secret =
      config.get('JOBS_MODE') === 'sweep' && secret
        ? Buffer.from(`Bearer ${secret}`)
        : null;
  }

  @Public()
  @Get('tick')
  async tick(@Headers('authorization') auth: string | undefined) {
    this.authorize(auth);
    const now = new Date();

    const dueToClose = await this.db
      .selectFrom('polls')
      .select('id')
      .where('status', '=', 'open')
      .where('closesAt', '<=', now)
      .where('deletedAt', 'is', null)
      .limit(BATCH)
      .execute();
    let closed = 0;
    for (const { id } of dueToClose) {
      if ((await this.events.close(id)).closed) closed++;
    }

    // Opened (or reached a scheduled opensAt) but no share link yet, or a
    // restricted poll whose audience hasn't been notified.
    const dueToAnnounce = await this.db
      .selectFrom('polls')
      .select('id')
      .where('status', '=', 'open')
      .where('openedAt', '<=', now)
      .where('deletedAt', 'is', null)
      .where((eb) =>
        eb.or([
          eb('shareUrl', 'is', null),
          eb.and([
            eb('audience', '=', 'restricted'),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('notificationBatches as n')
                  .select('n.id')
                  .whereRef('n.pollId', '=', 'polls.id')
                  .where('n.kind', '=', 'poll_opened'),
              ),
            ),
          ]),
        ]),
      )
      .limit(BATCH)
      .execute();
    let announced = 0;
    for (const { id } of dueToAnnounce) {
      try {
        await this.events.opened(id);
        announced++;
      } catch (err) {
        // Tried again on the next tick.
        this.logger.error(
          `announcing poll ${id} failed: ${(err as Error).message}`,
        );
      }
    }

    // Sessions of users who never came back (a login clears its own user's).
    const purged = await this.db
      .deleteFrom('sessions')
      .where('expiresAt', '<=', now)
      .executeTakeFirst();

    return { closed, announced, sessionsPurged: Number(purged.numDeletedRows) };
  }

  /** Wrong or missing secret looks the same as the route not existing. */
  private authorize(auth: string | undefined) {
    const given = Buffer.from(auth ?? '');
    if (
      !this.secret ||
      given.length !== this.secret.length ||
      !timingSafeEqual(given, this.secret)
    ) {
      throw new AppError('NOT_FOUND', HttpStatus.NOT_FOUND, 'Not found');
    }
  }
}
