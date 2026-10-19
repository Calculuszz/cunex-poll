import { Module } from '@nestjs/common';
import { PollsModule } from '../polls/polls.module.js';
import { ResultsController } from './results.controller.js';
import { ResultsRepository } from './results.repository.js';
import { ResultsService } from './results.service.js';

@Module({
  imports: [PollsModule],
  controllers: [ResultsController],
  providers: [ResultsRepository, ResultsService],
})
export class ResultsModule {}
