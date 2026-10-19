import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { sql } from 'kysely';
import type { Env } from '../../config/env.js';
import { Database } from '../../infra/database/database.js';
import { CunexClient } from '../cunex/cunex.client.js';
import { POLLS_QUEUE } from './poll-jobs.js';

const NOTIFY_CHUNK = 100;

/** Consumer side of the polls queue. Runs in the worker process only. */
@Processor(POLLS_QUEUE)
export class PollsProcessor extends WorkerHost {
  private readonly logger = new Logger(PollsProcessor.name);
  private readonly apiUrl: string;

  constructor(
    @Inject(Database) private readonly db: Database,
    private readonly cunex: CunexClient,
    config: ConfigService<Env, true>,
  ) {
    super();
    this.apiUrl = config.get('API_PUBLIC_URL').replace(/\/$/, '');
  }

  async process(job: Job<{ pollId: string }>): Promise<unknown> {
    switch (job.name) {
      case 'close-poll':
        return this.close(job.data.pollId);
      case 'poll-opened':
        return this.opened(job.data.pollId);
      default:
        throw new Error(`unknown job ${job.name}`);
    }
  }

  /**
   * Closes the poll if its deadline has passed. If the owner moved closesAt
   * later, a new job was scheduled and this one finds nothing to do.
   */
  async close(pollId: string) {
    return this.db.transaction().execute(async (tx) => {
      const res = await tx
        .updateTable('polls')
        // Never before closes_at, so it isn't mistaken for an early close.
        .set({
          status: 'closed',
          closedAt: sql<Date>`greatest(now(), closes_at)`,
          updatedAt: new Date(),
        })
        .where('id', '=', pollId)
        .where('status', '=', 'open')
        .where('closesAt', '<=', sql<Date>`now() + interval '5 seconds'`)
        .executeTakeFirst();
      const closed = res.numUpdatedRows > 0n;
      if (closed) {
        await tx
          .insertInto('auditLogs')
          .values({
            actorId: null,
            action: 'poll.auto_close',
            entityType: 'poll',
            entityId: pollId,
            data: '{}',
          })
          .execute();
      }
      return { closed };
    });
  }

  /** Share link for every poll; notifications only for restricted ones. */
  async opened(pollId: string) {
    const poll = await this.db
      .selectFrom('polls')
      .select(['id', 'title', 'status', 'audience', 'ownerId', 'shareUrl'])
      .where('id', '=', pollId)
      .executeTakeFirst();
    if (!poll || poll.status !== 'open') return { skipped: true };

    const callbackUrl = `${this.apiUrl}/api/v1/auth/cunex/callback?returnTo=${encodeURIComponent(`/polls/${pollId}`)}`;

    if (!poll.shareUrl) {
      const shareUrl = await this.cunex.createShareLink(callbackUrl);
      await this.db
        .updateTable('polls')
        .set({ shareUrl })
        .where('id', '=', pollId)
        .execute();
    }

    // Public polls would mean notifying the whole university for every poll:
    // only polls aimed at specific faculties/years notify their audience.
    if (poll.audience !== 'restricted') return { notified: 0 };

    // One batch row per poll: a retried job doesn't notify everyone twice.
    const batch = await this.db
      .insertInto('notificationBatches')
      .values({ pollId, kind: 'poll_opened' })
      .onConflict((oc) => oc.columns(['pollId', 'kind']).doNothing())
      .returning('id')
      .executeTakeFirst();
    if (!batch) return { notified: 0, alreadySent: true };

    const recipients = await this.recipients(pollId, poll.ownerId);
    const title = poll.title.slice(0, 400);
    let succeeded = 0;
    let failed = 0;
    for (let i = 0; i < recipients.length; i += NOTIFY_CHUNK) {
      const chunk = recipients.slice(i, i + NOTIFY_CHUNK);
      try {
        const report = await this.cunex.sendNotifications(
          chunk.map((userId) => ({
            userId,
            textTh: `มีโพลใหม่สำหรับคุณ: ${title}`,
            textEn: `New poll for you: ${title}`,
            callbackUrl,
          })),
        );
        succeeded += report.succeeded;
        failed += report.failed;
      } catch (err) {
        // Keep going: one failed chunk shouldn't block everyone else.
        failed += chunk.length;
        this.logger.error(
          `notification chunk for poll ${pollId} failed: ${(err as Error).message}`,
        );
      }
    }

    await this.db
      .updateTable('notificationBatches')
      .set({
        total: recipients.length,
        succeeded,
        failed,
        finishedAt: new Date(),
      })
      .where('id', '=', batch.id)
      .execute();
    return { notified: succeeded, failed };
  }

  /** CUNEX userIds of everyone in the poll's audience who has logged in. */
  private async recipients(pollId: string, ownerId: string) {
    const rows = await this.db
      .selectFrom('users as u')
      .innerJoin('userIdentities as ui', (j) =>
        j.onRef('ui.userId', '=', 'u.id').on('ui.provider', '=', 'cunex'),
      )
      .select('ui.providerSubject')
      .where('u.isChulaVerified', '=', true)
      .where('u.id', '!=', ownerId)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('pollAudienceRules as r')
            .select(sql.lit(1).as('one'))
            .where('r.pollId', '=', pollId)
            .where((r) =>
              r.and([
                r.or([
                  r('r.facultyCode', 'is', null),
                  r('r.facultyCode', '=', r.ref('u.facultyCode')),
                ]),
                r.or([
                  r('r.studentYear', 'is', null),
                  r('r.studentYear', '=', r.ref('u.studentYear')),
                ]),
              ]),
            ),
        ),
      )
      .execute();
    return rows.map((r) => r.providerSubject);
  }
}
