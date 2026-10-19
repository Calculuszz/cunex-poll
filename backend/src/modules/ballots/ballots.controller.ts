import { Body, Controller, Get, Param, Put, Res } from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { RateLimiter } from '../../common/rate-limiter.js';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { User } from '../users/users.repository.js';
import { type BallotBody, ballotBodySchema } from './answers.js';
import { BallotsService } from './ballots.service.js';

const pollId = z.uuid();

@Controller('polls/:id/ballot')
export class BallotsController {
  constructor(
    private readonly ballots: BallotsService,
    private readonly limiter: RateLimiter,
  ) {}

  @Get()
  mine(@CurrentUser() user: User, @Param('id', { schema: pollId }) id: string) {
    return this.ballots.mine(user, id);
  }

  /** Submit or replace my answers: 201 the first time, 200 on edit. */
  @Put()
  async submit(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Body({ schema: ballotBodySchema }) body: BallotBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.limiter.hit(`ballot:${user.id}`, 20, 60);
    const { created, ballot } = await this.ballots.submit(user, id, body);
    res.status(created ? 201 : 200);
    return ballot;
  }
}
