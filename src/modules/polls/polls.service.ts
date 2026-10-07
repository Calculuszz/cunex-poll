import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';
import type { PollStatus } from '../../infra/database/db.js';
import { voterKey } from '../ballots/voter-key.js';
import type { User } from '../users/users.repository.js';
import { findProblems } from './completeness.js';
import { isEligible } from './eligibility.js';
import type { PollDraftInput } from './poll-draft.schema.js';
import {
  EDITABLE,
  type PollAggregate,
  type PollRow,
  PollsRepository,
} from './polls.repository.js';
import {
  type MyBallot,
  toDetail,
  toDraftInput,
  toSummary,
} from './polls.view.js';

const notFound = () =>
  new AppError('POLL_NOT_FOUND', HttpStatus.NOT_FOUND, 'Poll not found');
const locked = (status: PollStatus) =>
  new AppError('POLL_LOCKED', HttpStatus.CONFLICT, `Poll is ${status}`, {
    pollStatus: status,
  });

@Injectable()
export class PollsService {
  private readonly pepper: string;

  constructor(
    private readonly repo: PollsRepository,
    config: ConfigService<Env, true>,
  ) {
    this.pepper = config.get('VOTER_KEY_PEPPER');
  }

  async create(user: User, draft: PollDraftInput) {
    await this.checkReferences(user, draft);
    const id = await this.repo.createDraft(user.id, draft);
    return this.get(user, id);
  }

  async replace(
    user: User,
    id: string,
    version: number,
    draft: PollDraftInput,
  ) {
    await this.checkReferences(user, draft);
    if (await this.repo.replaceDraft(id, user.id, version, draft)) {
      return this.get(user, id);
    }
    // The guarded update matched nothing: work out which guard failed.
    const { poll } = await this.owned(user, id);
    if (!EDITABLE.includes(poll.status)) throw locked(poll.status);
    throw new AppError(
      'VERSION_CONFLICT',
      HttpStatus.PRECONDITION_FAILED,
      'The poll was changed since you loaded it',
      { currentVersion: poll.version },
    );
  }

  async get(user: User, id: string) {
    const agg = await this.repo.find(id);
    if (!agg) throw notFound();
    const { poll } = agg;
    const isOwner = poll.ownerId === user.id;
    const isAdmin = user.role === 'admin';

    // Others only see published polls they may answer. 404, not 403, so poll
    // ids can't be probed.
    if (!isOwner && !isAdmin) {
      const published = poll.status === 'open' || poll.status === 'closed';
      if (!published || !isEligible(poll.audience, agg.rules, user)) {
        throw notFound();
      }
    }

    const [myBallot] = await this.myBallots(user, [poll]);
    return toDetail(agg, {
      isOwner,
      canSeeReviews: isOwner || isAdmin,
      myBallot: myBallot!,
      canViewResults:
        isOwner ||
        isAdmin ||
        poll.status === 'closed' ||
        (poll.status === 'open' && poll.showResultsRealtime),
    });
  }

  async submit(user: User, id: string) {
    const agg = await this.owned(user, id);
    if (!EDITABLE.includes(agg.poll.status)) throw locked(agg.poll.status);

    const problems = findProblems(toDraftInput(agg), new Date());
    if (problems.length > 0) {
      throw new AppError(
        'POLL_INCOMPLETE',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'The poll is not ready for review',
        { problems },
      );
    }
    await this.move(
      user,
      id,
      EDITABLE,
      {
        status: 'pending_review',
        submittedAt: new Date(),
      },
      'poll.submit',
    );
    return this.get(user, id);
  }

  async setClosesAt(user: User, id: string, closesAt: Date) {
    const { poll } = await this.owned(user, id);
    if (closesAt <= new Date()) {
      throw new AppError(
        'INVALID_CLOSES_AT',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'closesAt must be in the future',
      );
    }
    // Drafts change closesAt through PUT; this endpoint is for after submit.
    const allowed: PollStatus[] = ['pending_review', 'open'];
    if (!allowed.includes(poll.status)) throw locked(poll.status);
    await this.move(user, id, allowed, { closesAt }, 'poll.closes_at');
    return this.get(user, id);
  }

  async close(user: User, id: string) {
    const { poll } = await this.owned(user, id);
    if (poll.status !== 'open') throw locked(poll.status);
    await this.move(
      user,
      id,
      ['open'],
      {
        status: 'closed',
        closedAt: new Date(),
      },
      'poll.close',
    );
    return this.get(user, id);
  }

  async remove(user: User, id: string) {
    const { poll } = await this.owned(user, id);
    if (!EDITABLE.includes(poll.status)) throw locked(poll.status);
    await this.move(
      user,
      id,
      EDITABLE,
      { deletedAt: new Date() },
      'poll.delete',
    );
  }

  async feed(
    user: User,
    status: 'open' | 'closed',
    cursor: string | undefined,
    limit: number,
  ) {
    const page = await this.repo.listFeed(user, status, cursor, limit);
    const ballots = await this.myBallots(user, page.items);
    return {
      items: page.items.map((p, i) => toSummary(p, ballots[i])),
      nextCursor: page.nextCursor,
    };
  }

  async mine(
    user: User,
    status: PollStatus | undefined,
    cursor: string | undefined,
    limit: number,
  ) {
    const page = await this.repo.listMine(user.id, status, cursor, limit);
    return {
      items: page.items.map((p) => toSummary(p)),
      nextCursor: page.nextCursor,
    };
  }

  listFaculties() {
    return this.repo.listFaculties();
  }

  /** The poll, if `user` owns it. Anyone else gets the same 404 as a missing poll. */
  private async owned(user: User, id: string): Promise<PollAggregate> {
    const agg = await this.repo.find(id);
    if (!agg || agg.poll.ownerId !== user.id) throw notFound();
    return agg;
  }

  private async move(
    user: User,
    id: string,
    from: PollStatus[],
    set: Parameters<PollsRepository['transition']>[2],
    action: string,
  ) {
    // Lost a race with another request that changed the status first.
    if (
      !(await this.repo.transition(id, from, set, user.id, action, user.id))
    ) {
      const { poll } = await this.owned(user, id);
      throw locked(poll.status);
    }
  }

  private async myBallots(user: User, polls: PollRow[]): Promise<MyBallot[]> {
    const voted = await this.repo.votedPollIds(
      polls.map((p) => ({
        pollId: p.id,
        key: voterKey(this.pepper, p.id, user.id),
      })),
    );
    return polls.map((p) => {
      const submitted = voted.has(p.id);
      return {
        submitted,
        canEdit: submitted && p.status === 'open' && p.allowAnswerEdit,
      };
    });
  }

  private async checkReferences(user: User, draft: PollDraftInput) {
    if (draft.audience.type === 'restricted') {
      const codes = [
        ...new Set(
          draft.audience.rules
            .map((r) => r.facultyCode)
            .filter((c): c is string => !!c),
        ),
      ];
      const unknown = await this.repo.unknownFaculties(codes);
      if (unknown.length > 0) {
        throw new AppError(
          'UNKNOWN_FACULTY',
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Unknown faculty code',
          { facultyCodes: unknown },
        );
      }
    }

    const imageIds = new Set<string>();
    if (draft.coverImageId) imageIds.add(draft.coverImageId);
    for (const el of draft.elements) {
      if (el.type === 'image') imageIds.add(el.config.imageId);
      if ('options' in el) {
        for (const o of el.options) if (o.imageId) imageIds.add(o.imageId);
      }
    }
    const bad = await this.repo.unusableImages([...imageIds], user.id);
    if (bad.length > 0) {
      throw new AppError(
        'INVALID_IMAGE',
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Images must be uploaded by you and finished processing',
        { imageIds: bad },
      );
    }
  }
}
