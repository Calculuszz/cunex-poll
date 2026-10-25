import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { Env } from '../../config/env.js';

export const POLLS_QUEUE = 'polls';

// Deterministic job ids make every call idempotent: re-approving or moving
// closesAt replaces the job instead of adding a second one.
// (BullMQ job ids may not contain ':'.)
const openedId = (pollId: string) => `opened-${pollId}`;
const closeId = (pollId: string) => `close-${pollId}`;

/**
 * Producer side of the polls queue. Jobs are enqueued after the DB commit;
 * if Redis is down at that moment the poll still opens, it just misses its
 * notification, and voting still stops at closesAt because the API checks
 * the time itself. Consumers live in the worker.
 */
@Injectable()
export class PollJobs {
  private readonly logger = new Logger(PollJobs.name);

  // JOBS_MODE=sweep: nothing is queued; the cron tick finds due polls itself.
  private readonly enabled: boolean;

  constructor(
    @InjectQueue(POLLS_QUEUE) private readonly queue: Queue,
    config: ConfigService<Env, true>,
  ) {
    this.enabled = config.get('JOBS_MODE') === 'queue';
  }

  /** Share link + notifications at `opensAt` (now, or a scheduled opening). */
  async opened(pollId: string, opensAt: Date, closesAt: Date) {
    await this.safely('poll-opened', pollId, async () => {
      await this.queue.add(
        'poll-opened',
        { pollId },
        {
          jobId: openedId(pollId),
          delay: Math.max(0, opensAt.getTime() - Date.now()),
        },
      );
      await this.addClose(pollId, closesAt);
    });
  }

  async rescheduleClose(pollId: string, closesAt: Date) {
    await this.safely('close-poll', pollId, () =>
      this.addClose(pollId, closesAt),
    );
  }

  async cancelClose(pollId: string) {
    await this.safely('close-poll', pollId, () =>
      this.queue.remove(closeId(pollId)),
    );
  }

  private async addClose(pollId: string, closesAt: Date) {
    await this.queue.remove(closeId(pollId));
    await this.queue.add(
      'close-poll',
      { pollId },
      {
        jobId: closeId(pollId),
        delay: Math.max(0, closesAt.getTime() - Date.now()),
      },
    );
  }

  private async safely(
    job: string,
    pollId: string,
    fn: () => Promise<unknown>,
  ) {
    if (!this.enabled) return;
    try {
      await fn();
    } catch (err) {
      this.logger.error(
        `could not enqueue ${job} for poll ${pollId}: ${(err as Error).message}`,
      );
    }
  }
}
