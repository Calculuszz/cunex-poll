import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CunexModule } from '../cunex/cunex.module.js';
import { ImagesModule } from '../images/images.module.js';
import { PollEvents } from './poll-events.service.js';
import { POLLS_QUEUE, PollJobs } from './poll-jobs.js';
import { PollTickController } from './poll-tick.controller.js';
import { PollsController } from './polls.controller.js';
import { PollsRepository } from './polls.repository.js';
import { PollsService } from './polls.service.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: POLLS_QUEUE }),
    ImagesModule,
    CunexModule,
  ],
  controllers: [PollsController, PollTickController],
  providers: [PollsRepository, PollsService, PollJobs, PollEvents],
  exports: [PollsRepository, PollsService, PollJobs],
})
export class PollsModule {}
