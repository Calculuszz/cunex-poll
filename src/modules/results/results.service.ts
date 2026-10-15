import { createHash } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';
import { canSeePoll, canViewResults } from '../polls/poll-access.js';
import { pollNotFound } from '../polls/poll-errors.js';
import { PollsRepository } from '../polls/polls.repository.js';
import type { User } from '../users/users.repository.js';
import { applyKAnonymity, type GroupCounts } from './k-anonymity.js';
import { type Breakdown, ResultsRepository } from './results.repository.js';

const CACHE_SECONDS = 3;

export interface CachedResults {
  /** JSON body, already serialized */
  body: string;
  etag: string;
}

@Injectable()
export class ResultsService {
  private readonly k: number;
  // Requests for the same results on this replica wait for one DB query.
  private readonly inFlight = new Map<string, Promise<CachedResults>>();

  constructor(
    private readonly polls: PollsRepository,
    private readonly repo: ResultsRepository,
    @Inject(Redis) private readonly redis: Redis,
    config: ConfigService<Env, true>,
  ) {
    this.k = config.get('RESULTS_MIN_GROUP_SIZE');
  }

  async results(
    user: User,
    pollId: string,
    breakdown: Breakdown | 'none',
  ): Promise<CachedResults> {
    await this.authorize(user, pollId);

    const key = `results:${pollId}:${breakdown}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached) as CachedResults;

    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = this.compute(pollId, breakdown)
        .then(async (r) => {
          await this.redis.set(key, JSON.stringify(r), 'EX', CACHE_SECONDS);
          return r;
        })
        .finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }
    return pending;
  }

  async textAnswers(
    user: User,
    pollId: string,
    elementId: string,
    cursor: string | undefined,
    limit: number,
  ) {
    const agg = await this.polls.find(pollId);
    if (!agg || !canSeePoll(agg, user)) throw pollNotFound();
    // Free text can identify people; only the owner and admins read it.
    if (agg.poll.ownerId !== user.id && user.role !== 'admin') {
      throw resultsHidden();
    }
    const el = agg.elements.find((e) => e.id === elementId);
    if (!el || el.type !== 'text_question') {
      throw new AppError(
        'ELEMENT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'No such text question in this poll',
      );
    }
    const after = cursor
      ? Buffer.from(cursor, 'base64url').toString()
      : undefined;
    return this.repo.textAnswers(pollId, elementId, after, limit);
  }

  private async authorize(user: User, pollId: string) {
    const agg = await this.polls.find(pollId);
    if (!agg || !canSeePoll(agg, user)) throw pollNotFound();
    if (!canViewResults(agg.poll, user)) throw resultsHidden();
  }

  private async compute(
    pollId: string,
    breakdown: Breakdown | 'none',
  ): Promise<CachedResults> {
    const [totals, grouped] = await Promise.all([
      this.repo.totals(pollId),
      breakdown === 'none' ? null : this.repo.byGroup(pollId, breakdown),
    ]);

    const elements = new Map<
      string,
      {
        elementId: string;
        answered: number;
        options: { optionId: string; count: number }[];
      }
    >();
    const entry = (elementId: string) => {
      let e = elements.get(elementId);
      if (!e) {
        e = { elementId, answered: 0, options: [] };
        elements.set(elementId, e);
      }
      return e;
    };
    for (const a of totals.answered) entry(a.elementId).answered = a.n;
    for (const o of totals.options) {
      entry(o.elementId).options.push({ optionId: o.optionId, count: o.n });
    }

    const content = {
      totalBallots: totals.totalBallots,
      elements: [...elements.values()],
      ...(grouped
        ? {
            breakdown: {
              by: breakdown,
              minGroupSize: this.k,
              groups: applyKAnonymity(toGroups(grouped), this.k),
            },
          }
        : {}),
    };
    // ETag over the counts only, so it stays stable while nothing changes.
    const etag = `W/"${createHash('sha1').update(JSON.stringify(content)).digest('base64url')}"`;
    const body = JSON.stringify({
      ...content,
      generatedAt: new Date().toISOString(),
    });
    return { body, etag };
  }
}

function toGroups(grouped: Awaited<ReturnType<ResultsRepository['byGroup']>>) {
  const groups = new Map<string, GroupCounts>();
  for (const t of grouped.groupTotals) {
    groups.set(t.group, { group: t.group, total: t.n, counts: new Map() });
  }
  for (const c of grouped.counts) {
    const g = groups.get(c.group);
    if (!g) continue;
    const el = g.counts.get(c.elementId) ?? new Map<string, number>();
    el.set(c.optionId, c.n);
    g.counts.set(c.elementId, el);
  }
  // Biggest groups first; stable order for the ETag.
  return [...groups.values()].sort(
    (a, b) => b.total - a.total || a.group.localeCompare(b.group),
  );
}

function resultsHidden() {
  return new AppError(
    'RESULTS_HIDDEN',
    HttpStatus.FORBIDDEN,
    'Results are not available to you yet',
  );
}
