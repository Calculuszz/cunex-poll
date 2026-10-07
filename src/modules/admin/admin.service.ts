import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError } from '../../common/errors.js';
import type { PollStatus } from '../../infra/database/db.js';
import { pollLocked as locked, pollNotFound } from '../polls/poll-errors.js';
import { PollJobs } from '../polls/poll-jobs.js';
import { PollsRepository } from '../polls/polls.repository.js';
import { PollsService } from '../polls/polls.service.js';
import { toSummary } from '../polls/polls.view.js';
import type { User } from '../users/users.repository.js';
import { AdminRepository } from './admin.repository.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly repo: AdminRepository,
    private readonly polls: PollsRepository,
    private readonly pollsService: PollsService,
    private readonly jobs: PollJobs,
  ) {}

  async listPolls(
    status: PollStatus,
    cursor: string | undefined,
    limit: number,
  ) {
    const page = await this.repo.listPolls(status, cursor, limit);
    return {
      items: page.items.map((p) => toSummary(p)),
      nextCursor: page.nextCursor,
    };
  }

  async approve(admin: User, pollId: string) {
    const { poll } = await this.pollOr404(pollId);
    if (poll.status !== 'pending_review') throw locked(poll.status);
    // It may have sat in the queue past its own deadline. The owner must move
    // closesAt first; opening an already-expired poll helps nobody.
    if (!poll.closesAt || poll.closesAt <= new Date()) {
      throw new AppError(
        'CLOSES_AT_PASSED',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'The poll closing time has already passed; ask the owner to move it',
      );
    }

    if (!(await this.repo.decide(pollId, admin.id, 'approved', null))) {
      throw locked((await this.pollOr404(pollId)).poll.status);
    }
    await this.jobs.opened(pollId, poll.closesAt);
    return this.pollsService.get(admin, pollId);
  }

  async reject(admin: User, pollId: string, comment: string) {
    const { poll } = await this.pollOr404(pollId);
    if (poll.status !== 'pending_review') throw locked(poll.status);
    if (!(await this.repo.decide(pollId, admin.id, 'rejected', comment))) {
      throw locked((await this.pollOr404(pollId)).poll.status);
    }
    return this.pollsService.get(admin, pollId);
  }

  async takedown(admin: User, pollId: string, reason: string) {
    const { poll } = await this.pollOr404(pollId);
    if (!(await this.repo.takedown(pollId, admin.id, reason))) {
      throw locked(poll.status);
    }
    await this.jobs.cancelClose(pollId);
    return this.pollsService.get(admin, pollId);
  }

  listAdmins() {
    return this.repo.listAdmins();
  }

  async grantAdmin(admin: User, cunexUserId: string) {
    const found = await this.repo.findUserIdByCunexId(cunexUserId);
    if (!found) {
      throw new AppError(
        'USER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'No user with that CUNEX id has logged in yet',
      );
    }
    await this.repo.setRole(found.userId, 'admin', admin.id);
    return this.repo.listAdmins();
  }

  async revokeAdmin(admin: User, userId: string) {
    if (userId === admin.id) {
      throw new AppError(
        'CANNOT_REVOKE_SELF',
        HttpStatus.CONFLICT,
        'Ask another admin to remove you',
      );
    }
    // Role is re-read on every request (AuthGuard), so this takes effect on
    // the user's very next call without touching their sessions.
    await this.repo.setRole(userId, 'user', admin.id);
  }

  auditLogs(
    filter: { entityType?: string; entityId?: string },
    cursor: string | undefined,
    limit: number,
  ) {
    return this.repo.auditLogs(filter, cursor, limit);
  }

  private async pollOr404(pollId: string) {
    const agg = await this.polls.find(pollId);
    if (!agg) throw pollNotFound();
    return agg;
  }
}
