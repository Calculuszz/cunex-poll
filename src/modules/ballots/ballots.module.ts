import { Module } from '@nestjs/common';
import { PollsModule } from '../polls/polls.module.js';
import { BallotsController } from './ballots.controller.js';
import { BallotsRepository } from './ballots.repository.js';
import { BallotsService } from './ballots.service.js';

@Module({
  imports: [PollsModule],
  controllers: [BallotsController],
  providers: [BallotsRepository, BallotsService],
})
export class BallotsModule {}
