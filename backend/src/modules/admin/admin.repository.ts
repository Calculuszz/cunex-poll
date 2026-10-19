import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { Database } from '../../infra/database/database.js';
import type { PollStatus } from '../../infra/database/db.js';
import type { Page, PollRow } from '../polls/polls.repository.js';

interface QueueCursor {
  t: string;
  id: string;
}

@Injectable()
export class AdminRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  /**
   * Review queue: pending polls oldest-submitted first (fair FIFO); any other
   * status newest first.
   */
  async listPolls(
    status: PollStatus,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<PollRow>> {
    const pending = status === 'pending_review';
    const col = pending ? 'submittedAt' : 'createdAt';
    const dir = pending ? 'asc' : 'desc';
    let q = this.db
      .selectFrom('polls')
      .selectAll()
      .where('status', '=', status)
      .where('deletedAt', 'is', null);
    const c = decode<QueueCursor>(cursor);
    if (c) {
      q = q.where((eb) =>
        eb(
          eb.refTuple(col, 'id'),
          pending ? '>' : '<',
          eb.tuple(new Date(c.t), c.id),
        ),
      );
    }
    const rows = await q
      .orderBy(col, dir)
      .orderBy('id', dir)
      .limit(limit + 1)
      .execute();
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > limit && last
          ? encode({
              t: (last[col] ?? last.createdAt).toISOString(),
              id: last.id,
            })
          : null,
    };
  }

  /**
   * Approve or reject a pending poll: status change, review row and audit row
   * in one transaction. False when the poll was no longer pending.
   */
  async decide(
    pollId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    comment: string | null,
  ): Promise<boolean> {
    return this.db.transaction().execute(async (tx) => {
      const now = new Date();
      const res = await tx
        .updateTable('polls')
        .set(
          // Approved polls wait for the owner to publish them.
          decision === 'approved'
            ? { status: 'approved', updatedAt: now }
            : { status: 'rejected', updatedAt: now },
        )
        .where('id', '=', pollId)
        .where('status', '=', 'pending_review')
        .where('deletedAt', 'is', null)
        .executeTakeFirst();
      if (res.numUpdatedRows === 0n) return false;

      await tx
        .insertInto('pollReviews')
        .values({ pollId, reviewerId, decision, comment })
        .execute();
      await tx
        .insertInto('auditLogs')
        .values({
          actorId: reviewerId,
          action: decision === 'approved' ? 'poll.approve' : 'poll.reject',
          entityType: 'poll',
          entityId: pollId,
          data: JSON.stringify({ comment }),
        })
        .execute();
      return true;
    });
  }

  /** Force-close a published poll and hide it from the feed. */
  async takedown(pollId: string, adminId: string, reason: string) {
    return this.db.transaction().execute(async (tx) => {
      const res = await tx
        .updateTable('polls')
        .set({
          status: 'closed',
          closedAt: sql`coalesce(closed_at, now())`,
          listedPublicly: false,
          takenDownAt: new Date(),
          takedownReason: reason,
          updatedAt: new Date(),
        })
        .where('id', '=', pollId)
        .where('status', 'in', ['open', 'closed'])
        .where('deletedAt', 'is', null)
        .executeTakeFirst();
      if (res.numUpdatedRows === 0n) return false;

      await tx
        .insertInto('auditLogs')
        .values({
          actorId: adminId,
          action: 'poll.takedown',
          entityType: 'poll',
          entityId: pollId,
          data: JSON.stringify({ reason }),
        })
        .execute();
      return true;
    });
  }

  listAdmins() {
    return this.db
      .selectFrom('users')
      .innerJoin('userIdentities', (j) =>
        j
          .onRef('userIdentities.userId', '=', 'users.id')
          .on('userIdentities.provider', '=', 'cunex'),
      )
      .select([
        'users.id',
        'users.studentId',
        'userIdentities.providerSubject as cunexUserId',
        'users.facultyCode',
        'users.lastLoginAt',
      ])
      .where('users.role', '=', 'admin')
      .orderBy('users.createdAt')
      .execute();
  }

  /** The account that last logged in with this student id. */
  findUserIdByStudentId(studentId: string) {
    return this.db
      .selectFrom('users')
      .select('id as userId')
      .where('studentId', '=', studentId)
      .orderBy(sql`last_login_at DESC NULLS LAST`)
      .limit(1)
      .executeTakeFirst();
  }

  async setRole(userId: string, role: 'user' | 'admin', actorId: string) {
    return this.db.transaction().execute(async (tx) => {
      const res = await tx
        .updateTable('users')
        .set({ role })
        .where('id', '=', userId)
        .where('role', '!=', role)
        .executeTakeFirst();
      if (res.numUpdatedRows > 0n) {
        await tx
          .insertInto('auditLogs')
          .values({
            actorId,
            action: role === 'admin' ? 'user.grant_admin' : 'user.revoke_admin',
            entityType: 'user',
            entityId: userId,
            data: '{}',
          })
          .execute();
      }
      return res.numUpdatedRows > 0n;
    });
  }

  async auditLogs(
    filter: { entityType?: string; entityId?: string },
    cursor: string | undefined,
    limit: number,
  ) {
    let q = this.db
      .selectFrom('auditLogs')
      .select([
        'id',
        'actorId',
        'action',
        'entityType',
        'entityId',
        'data',
        'createdAt',
      ])
      .orderBy('id', 'desc')
      .limit(limit + 1);
    if (filter.entityType) q = q.where('entityType', '=', filter.entityType);
    if (filter.entityId) q = q.where('entityId', '=', filter.entityId);
    const before = decode<{ id: string }>(cursor);
    if (before) q = q.where('id', '<', before.id);

    const rows = await q.execute();
    const items = rows.slice(0, limit);
    const last = items.at(-1);
    return {
      items,
      nextCursor:
        rows.length > limit && last ? encode({ id: String(last.id) }) : null,
    };
  }
}

function encode(v: object) {
  return Buffer.from(JSON.stringify(v)).toString('base64url');
}

function decode<T>(cursor: string | undefined): T | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString()) as T;
  } catch {
    return null;
  }
}
