import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller.js';
import { PollsRepository } from './polls.repository.js';
import { PollsService } from './polls.service.js';

@Module({
  controllers: [PollsController],
  providers: [PollsRepository, PollsService],
  exports: [PollsRepository, PollsService],
})
export class PollsModule {}
