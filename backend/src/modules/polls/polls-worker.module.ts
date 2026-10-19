import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CunexModule } from '../cunex/cunex.module.js';
import { POLLS_QUEUE } from './poll-jobs.js';
import { PollsProcessor } from './polls.processor.js';

// Worker-side registration of the polls queue consumer.
@Module({
  imports: [BullModule.registerQueue({ name: POLLS_QUEUE }), CunexModule],
  providers: [PollsProcessor],
})
export class PollsWorkerModule {}
