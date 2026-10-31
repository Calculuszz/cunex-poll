import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
import { pageLimit } from '../../common/pagination.js';
import { AppError } from '../../common/errors.js';
import { CurrentUser, Public } from '../auth/auth.decorators.js';
import type { User } from '../users/users.repository.js';
import { type PollDraftInput, pollDraftSchema } from './poll-draft.schema.js';
import { PollsService } from './polls.service.js';
import { type ResultDisplay, resultDisplaySchema } from './result-display.js';

const pollId = z.uuid();
const limit = pageLimit(50);

const feedQuery = z.object({
  status: z.enum(['open', 'closed']).default('open'),
  cursor: z.string().max(200).optional(),
  limit,
});

const mineQuery = z.object({
  status: z
    .enum(['draft', 'pending_review', 'approved', 'rejected', 'open', 'closed'])
    .optional(),
  cursor: z.string().max(200).optional(),
  limit,
});

const closesAtBody = z.object({ closesAt: z.iso.datetime({ offset: true }) });
const realtimeBody = z.object({ showResultsRealtime: z.boolean() });
// The body is optional: a close without a reason may send nothing.
const closeBody = z
  .object({ reason: z.string().trim().max(500).optional() })
  .default({});
// `now: true` opens voting right away even if a later `opensAt` was scheduled.
// now: open right away · opensAt: open at this (new) time · neither: the
// opensAt already saved on the poll, or right away when it has none.
const publishBody = z
  .object({
    now: z.boolean().optional(),
    opensAt: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((b) => !(b.now && b.opensAt), {
    message: 'เลือกได้อย่างใดอย่างหนึ่ง: เปิดตอนนี้ หรือเปิดตามเวลา',
  })
  .default({});

@Controller()
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  // Reference data; the public poll intro card needs the names too.
  // Same for everyone and rarely changes: the CDN keeps it for an hour, so
  // most page loads never reach this function.
  @Public()
  @Header(
    'Cache-Control',
    'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  )
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

  /**
   * Shared link opened without logging in: the poll's intro card only.
   * Nothing in it depends on the viewer, so the CDN serves a burst of people
   * opening the same link; a change shows within 30 s. Errors (404) are not
   * cached: Nest only sets these headers on a successful response.
   */
  @Public()
  @Header(
    'Cache-Control',
    'public, max-age=0, s-maxage=30, stale-while-revalidate=60',
  )
  @Get('polls/:id/preview')
  preview(@Param('id', { schema: pollId }) id: string) {
    return this.polls.preview(id);
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

  @Post('polls/:id/publish')
  @HttpCode(HttpStatus.OK)
  publish(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Body({ schema: publishBody }) body: z.infer<typeof publishBody>,
  ) {
    return this.polls.publish(user, id, {
      now: body.now ?? false,
      opensAt: body.opensAt ? new Date(body.opensAt) : undefined,
    });
  }

  @Patch('polls/:id/realtime')
  setRealtime(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Body({ schema: realtimeBody }) body: z.infer<typeof realtimeBody>,
  ) {
    return this.polls.setRealtime(user, id, body.showResultsRealtime);
  }

  @Put('polls/:id/result-display')
  setResultDisplay(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Body({ schema: resultDisplaySchema }) body: ResultDisplay,
  ) {
    return this.polls.setResultDisplay(user, id, body);
  }

  @Post('polls/:id/close')
  @HttpCode(HttpStatus.OK)
  close(
    @CurrentUser() user: User,
    @Param('id', { schema: pollId }) id: string,
    @Body({ schema: closeBody }) body: z.infer<typeof closeBody>,
  ) {
    return this.polls.close(user, id, body.reason);
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
