import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, RequireRole } from '../auth/auth.decorators.js';
import type { User } from '../users/users.repository.js';
import { AdminService } from './admin.service.js';

const uuid = z.uuid();
const limit = z.coerce.number().int().min(1).max(100).default(20);

const pollsQuery = z.object({
  status: z
    .enum(['draft', 'pending_review', 'rejected', 'open', 'closed'])
    .default('pending_review'),
  cursor: z.string().max(200).optional(),
  limit,
});
const rejectBody = z.object({ comment: z.string().trim().min(1).max(2000) });
const takedownBody = z.object({ reason: z.string().trim().min(1).max(2000) });
const grantBody = z.object({ cunexUserId: z.string().trim().min(1).max(20) });
const auditQuery = z.object({
  entityType: z.string().max(50).optional(),
  entityId: z.uuid().optional(),
  cursor: z.string().max(200).optional(),
  limit,
});

@RequireRole('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('polls')
  polls(@Query({ schema: pollsQuery }) q: z.infer<typeof pollsQuery>) {
    return this.admin.listPolls(q.status, q.cursor, q.limit);
  }

  @Post('polls/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
  ) {
    return this.admin.approve(user, id);
  }

  @Post('polls/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: rejectBody }) body: z.infer<typeof rejectBody>,
  ) {
    return this.admin.reject(user, id, body.comment);
  }

  @Post('polls/:id/takedown')
  @HttpCode(HttpStatus.OK)
  takedown(
    @CurrentUser() user: User,
    @Param('id', { schema: uuid }) id: string,
    @Body({ schema: takedownBody }) body: z.infer<typeof takedownBody>,
  ) {
    return this.admin.takedown(user, id, body.reason);
  }

  @Get('admins')
  admins() {
    return this.admin.listAdmins();
  }

  @Post('admins')
  grant(
    @CurrentUser() user: User,
    @Body({ schema: grantBody }) body: z.infer<typeof grantBody>,
  ) {
    return this.admin.grantAdmin(user, body.cunexUserId);
  }

  @Delete('admins/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @CurrentUser() user: User,
    @Param('userId', { schema: uuid }) userId: string,
  ) {
    return this.admin.revokeAdmin(user, userId);
  }

  @Get('audit-logs')
  auditLogs(@Query({ schema: auditQuery }) q: z.infer<typeof auditQuery>) {
    return this.admin.auditLogs(
      { entityType: q.entityType, entityId: q.entityId },
      q.cursor,
      q.limit,
    );
  }
}
