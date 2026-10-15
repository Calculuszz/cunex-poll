import { Module } from '@nestjs/common';
import { InfraModule } from './infra/infra.module.js';
import { PollsWorkerModule } from './modules/polls/polls-worker.module.js';

// Background worker: scheduled poll closing, share links, notifications,
// image import. Runs as its own process (pnpm start:worker).
@Module({
  imports: [InfraModule, PollsWorkerModule],
})
export class WorkerModule {}
