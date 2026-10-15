import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { Database } from '../../infra/database/database.js';

export type Breakdown = 'faculty' | 'year';

@Injectable()
export class ResultsRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  async totals(pollId: string) {
    const [ballots, options, answeredChoice, answeredText] = await Promise.all([
      this.db
        .selectFrom('ballots')
        .select((eb) => eb.fn.countAll<string>().as('n'))
        .where('pollId', '=', pollId)
        .executeTakeFirstOrThrow(),
      this.db
        .selectFrom('ballotChoices')
        .select([
          'elementId',
          'optionId',
          (eb) => eb.fn.countAll<string>().as('n'),
        ])
        .where('pollId', '=', pollId)
        .groupBy(['elementId', 'optionId'])
        .execute(),
      this.db
        .selectFrom('ballotChoices')
        .select(['elementId', sql<string>`count(DISTINCT ballot_id)`.as('n')])
        .where('pollId', '=', pollId)
        .groupBy('elementId')
        .execute(),
      this.db
        .selectFrom('ballotTextAnswers')
        .select(['elementId', (eb) => eb.fn.countAll<string>().as('n')])
        .where('pollId', '=', pollId)
        .groupBy('elementId')
        .execute(),
    ]);
    return {
      totalBallots: Number(ballots.n),
      options: options.map((r) => ({ ...r, n: Number(r.n) })),
      answered: [...answeredChoice, ...answeredText].map((r) => ({
        elementId: r.elementId,
        n: Number(r.n),
      })),
    };
  }

  /** Option counts per faculty or entry-year snapshot. Null → "unknown". */
  async byGroup(pollId: string, by: Breakdown) {
    const col = by === 'faculty' ? 'b.facultyCode' : 'b.studentYear';
    const [groupTotals, counts] = await Promise.all([
      this.db
        .selectFrom('ballots as b')
        .select([
          sql<string | null>`${sql.ref(col)}::text`.as('grp'),
          (eb) => eb.fn.countAll<string>().as('n'),
        ])
        .where('b.pollId', '=', pollId)
        .groupBy(col)
        .execute(),
      this.db
        .selectFrom('ballotChoices as c')
        .innerJoin('ballots as b', 'b.id', 'c.ballotId')
        .select([
          sql<string | null>`${sql.ref(col)}::text`.as('grp'),
          'c.elementId',
          'c.optionId',
          (eb) => eb.fn.countAll<string>().as('n'),
        ])
        .where('c.pollId', '=', pollId)
        .groupBy([col, 'c.elementId', 'c.optionId'])
        .execute(),
    ]);
    return {
      groupTotals: groupTotals.map((g) => ({
        group: g.grp ?? 'unknown',
        n: Number(g.n),
      })),
      counts: counts.map((c) => ({
        group: c.grp ?? 'unknown',
        elementId: c.elementId,
        optionId: c.optionId,
        n: Number(c.n),
      })),
    };
  }

  /**
   * Free-text answers for one question, ordered by ballot id. Ballot ids are
   * random UUIDs, so the order says nothing about who answered when, and no
   * id or time is returned with the text.
   */
  async textAnswers(
    pollId: string,
    elementId: string,
    after: string | undefined,
    limit: number,
  ) {
    let q = this.db
      .selectFrom('ballotTextAnswers')
      .select(['ballotId', 'answer'])
      .where('pollId', '=', pollId)
      .where('elementId', '=', elementId)
      .orderBy('ballotId')
      .limit(limit + 1);
    if (after) q = q.where('ballotId', '>', after);
    const rows = await q.execute();
    const items = rows.slice(0, limit);
    return {
      items: items.map((r) => ({ text: r.answer })),
      nextCursor:
        rows.length > limit && items.length > 0
          ? Buffer.from(items.at(-1)!.ballotId).toString('base64url')
          : null,
    };
  }
}
