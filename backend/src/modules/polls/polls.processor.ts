import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PollEvents } from './poll-events.service.js';
import { POLLS_QUEUE } from './poll-jobs.js';

/** Consumer side of the polls queue. Runs in the worker process only. */
@Processor(POLLS_QUEUE)
export class PollsProcessor extends WorkerHost {
  constructor(private readonly events: PollEvents) {
    super();
  }

  async process(job: Job<{ pollId: string }>): Promise<unknown> {
    switch (job.name) {
      case 'close-poll':
        return this.events.close(job.data.pollId);
      case 'poll-opened':
        return this.events.opened(job.data.pollId);
      default:
        throw new Error(`unknown job ${job.name}`);
    }
  }
}
