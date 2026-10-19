import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError } from '../../common/errors.js';
import type { PollStatus } from '../../infra/database/db.js';
import {
  closesAtPassed,
  pollLocked as locked,
  pollNotFound,
} from '../polls/poll-errors.js';
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
    const counts = await this.polls.questionCounts(page.items.map((p) => p.id));
    return {
      items: page.items.map((p) => toSummary(p, counts.get(p.id) ?? 0)),
      nextCursor: page.nextCursor,
    };
  }

  async approve(admin: User, pollId: string) {
    const { poll } = await this.pollOr404(pollId);
    if (poll.status !== 'pending_review') throw locked(poll.status);
    // It may have sat in the queue past its own deadline. The owner must move
    // closesAt first; approving an already-expired poll helps nobody.
    if (!poll.closesAt || poll.closesAt <= new Date()) throw closesAtPassed();

    // → approved. Voting starts when the owner publishes it.
    if (!(await this.repo.decide(pollId, admin.id, 'approved', null))) {
      throw locked((await this.pollOr404(pollId)).poll.status);
    }
    return this.pollsService.get(admin, pollId);
  }

  async reject(admin: User, pollId: string, comment: string | null) {
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

  async grantAdmin(admin: User, studentId: string) {
    const found = await this.repo.findUserIdByStudentId(studentId);
    if (!found) {
      throw new AppError(
        'USER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'No user with that student id has logged in yet',
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
