import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CunexModule } from '../cunex/cunex.module.js';
import { PollEvents } from './poll-events.service.js';
import { POLLS_QUEUE } from './poll-jobs.js';
import { PollsProcessor } from './polls.processor.js';

// Worker-side registration of the polls queue consumer.
@Module({
  imports: [BullModule.registerQueue({ name: POLLS_QUEUE }), CunexModule],
  providers: [PollEvents, PollsProcessor],
})
export class PollsWorkerModule {}
