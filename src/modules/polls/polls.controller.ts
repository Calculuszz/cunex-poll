import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { AppError } from '../../common/errors.js';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { User } from '../users/users.repository.js';
import { type PollDraftInput, pollDraftSchema } from './poll-draft.schema.js';
import { PollsService } from './polls.service.js';

const pollId = z.uuid();
const limit = z.coerce.number().int().min(1).max(50).default(20);

const feedQuery = z.object({
  status: z.enum(['open', 'closed']).default('open'),
  cursor: z.string().max(200).optional(),
  limit,
});

const mineQuery = z.object({
  status: z
    .enum(['draft', 'pending_review', 'rejected', 'open', 'closed'])
    .optional(),
  cursor: z.string().max(200).optional(),
  limit,
});

const closesAtBody = z.object({ closesAt: z.iso.datetime({ offset: true }) });

@Controller()
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  @Get('faculties')
  faculties() {
    return this.polls.listFaculties();
  }

  @Get('polls')
  feed(
    @CurrentUser() user: User,
    @Query({ schema: feedQuery }) q: z.infer<typeof feedQuery>,
  ) {
    return this.polls.feed(user, q.status, q.cursor, q.limit);
  }

  @Get('me/polls')
  mine(
    @CurrentUser() user: User,
    @Query({ schema: mineQuery }) q: z.infer<typeof mineQuery>,
  ) {
    return this.polls.mine(user, q.status, q.cursor, q.limit);
  }

  @Post('polls')
  create(
    @CurrentUser() user: User,
    @Body({ schema: pollDraftSchema }) draft: PollDraftInput,
  ) {
    return this.polls.create(user, draft);
  }

  @Get('polls/:id')
  get(@CurrentUser() user: User, @Param('id', { schema: pollId }) id: string) {
    return this.polls.get(user, id);
  }

  /** Saves the whole draft ("บันทึกฉบับร่าง"). Needs If-Match: <version>. */
  @Put('polls/:id')
  replace(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Body({ schema: pollDraftSchema }) draft: PollDraftInput,
  ) {
    return this.polls.replace(user, id, parseIfMatch(ifMatch), draft);
  }

  @Delete('polls/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
  ) {
    return this.polls.remove(user, id);
  }

  @Post('polls/:id/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
  ) {
    return this.polls.submit(user, id);
  }

  @Patch('polls/:id/closes-at')
  setClosesAt(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Body({ schema: closesAtBody }) body: z.infer<typeof closesAtBody>,
  ) {
    return this.polls.setClosesAt(user, id, new Date(body.closesAt));
  }

  @Post('polls/:id/close')
  @HttpCode(HttpStatus.OK)
  close(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
  ) {
    return this.polls.close(user, id);
  }
}

/** Accepts `7`, `"7"` or `W/"7"`. */
function parseIfMatch(header: string | undefined): number {
  const m = header?.trim().match(/^(?:W\/)?"?(\d{1,9})"?$/);
  if (!m) {
    throw new AppError(
      'PRECONDITION_REQUIRED',
      HttpStatus.PRECONDITION_REQUIRED,
      'Send If-Match with the poll version you loaded',
    );
  }
  return Number(m[1]);
}
