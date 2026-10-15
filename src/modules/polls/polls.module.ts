import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ImagesModule } from '../images/images.module.js';
import { POLLS_QUEUE, PollJobs } from './poll-jobs.js';
import { PollsController } from './polls.controller.js';
import { PollsRepository } from './polls.repository.js';
import { PollsService } from './polls.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: POLLS_QUEUE }), ImagesModule],
  controllers: [PollsController],
  providers: [PollsRepository, PollsService, PollJobs],
  exports: [PollsRepository, PollsService, PollJobs],
})
export class PollsModule {}
