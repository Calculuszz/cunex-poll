import type { NestExpressApplication } from '@nestjs/platform-express';
import type pg from 'pg';
import { as, createTestApp, loginAs } from './e2e-env.js';

let app: NestExpressApplication;
let db: pg.Client;
let owner: ReturnType<typeof as>; // eng-2567 (faculty 21)
let med: ReturnType<typeof as>; // faculty 30, year 2566
let arts: ReturnType<typeof as>; // faculty 22, year 2565
let admin: ReturnType<typeof as>; // faculty 23, year 2564

beforeAll(async () => {
  ({ app, db } = await createTestApp());
  owner = as(app, await loginAs(app, 'eng-2567'));
  med = as(app, await loginAs(app, 'med-2566'));
  arts = as(app, await loginAs(app, 'arts-2565'));
  admin = as(app, await loginAs(app, 'admin'));
  await db.query(
    "UPDATE users SET role = 'admin' WHERE id = (SELECT user_id FROM user_identities WHERE provider_subject = '100000000000000099')",
  );
});

afterAll(async () => {
  await app?.close();
  await db?.end();
});

interface Poll {
  id: string;
  single: { id: string; options: { id: string }[] };
  multi: { id: string; options: { id: string }[] };
  text: { id: string };
}

/** Engineering + anyone who entered in 2566; approved through the admin API. */
async function openPoll(settings: { allowAnswerEdit: boolean }): Promise<Poll> {
  const { body } = await owner.post('/polls').send({
    title: 'ธีมงาน',
    closesAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
    audience: {
      type: 'restricted',
      rules: [{ facultyCode: '21' }, { studentYear: 2566 }],
    },
    settings,
    elements: [
      {
        type: 'single_choice',
        title: 'ธีม',
        isRequired: true,
        options: [{ label: 'ย้อนยุค' }, { label: 'ร่วมสมัย' }],
      },
      {
        type: 'multi_choice',
        title: 'กิจกรรม',
        config: { maxSelect: 2 },
        options: [{ label: 'ดนตรี' }, { label: 'อาหาร' }, { label: 'เกม' }],
      },
      { type: 'text_question', title: 'ข้อเสนอแนะ' },
    ],
  });
  expect((await owner.post(`/polls/${body.id}/submit`)).status).toBe(200);
  const approved = await admin.post(`/admin/polls/${body.id}/approve`);
  expect(approved.status).toBe(200);
  const [single, multi, text] = approved.body.elements;
  return { id: body.id, single, multi, text };
}

describe('voting with answer edits allowed', () => {
  let p: Poll;
  beforeAll(async () => {
    p = await openPoll({ allowAnswerEdit: true });
  });

  it('first vote is 201 and shows up as myBallot', async () => {
    const res = await med.put(`/polls/${p.id}/ballot`).send({
      answers: [
        { elementId: p.single.id, optionIds: [p.single.options[0]!.id] },
        {
          elementId: p.multi.id,
          optionIds: [p.multi.options[0]!.id, p.multi.options[2]!.id],
        },
        { elementId: p.text.id, text: '  สนุกดี  ' },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.answers).toContainEqual({
      elementId: p.text.id,
      text: 'สนุกดี',
    });
    // minute precision only
    expect(new Date(res.body.submittedAt).getSeconds()).toBe(0);

    const detail = await med.get(`/polls/${p.id}`);
    expect(detail.body.myBallot).toEqual({ submitted: true, canEdit: true });
  });

  it('voting again replaces the answers (200), still one ballot', async () => {
    const res = await med.put(`/polls/${p.id}/ballot`).send({
      answers: [
        { elementId: p.single.id, optionIds: [p.single.options[1]!.id] },
      ],
    });
    expect(res.status).toBe(200);

    const mine = await med.get(`/polls/${p.id}/ballot`);
    expect(mine.body.answers).toEqual([
      { elementId: p.single.id, optionIds: [p.single.options[1]!.id] },
    ]);

    const counts = await db.query(
      `SELECT (SELECT count(*) FROM ballots WHERE poll_id = $1)::int AS ballots,
              (SELECT count(*) FROM ballot_choices WHERE poll_id = $1)::int AS choices,
              (SELECT count(*) FROM ballot_text_answers WHERE poll_id = $1)::int AS texts`,
      [p.id],
    );
    expect(counts.rows[0]).toEqual({ ballots: 1, choices: 1, texts: 0 });
  });

  it('reports every invalid answer', async () => {
    const res = await med.put(`/polls/${p.id}/ballot`).send({
      answers: [
        {
          elementId: p.multi.id,
          optionIds: p.multi.options.map((o) => o.id),
        },
        { elementId: p.single.id, optionIds: [p.multi.options[0]!.id] },
      ],
    });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_ANSWERS');
    expect(res.body.problems.map((x: { path: string }) => x.path)).toEqual([
      'answers.0.optionIds',
      'answers.1.optionIds',
      `elements.${p.single.id}`,
    ]);
  });

  it('who may vote', async () => {
    const answer = {
      answers: [
        { elementId: p.single.id, optionIds: [p.single.options[0]!.id] },
      ],
    };
    // outside the audience: the poll doesn't exist for them
    expect((await arts.put(`/polls/${p.id}/ballot`).send(answer)).status).toBe(
      404,
    );
    // the admin can see it but isn't in the audience
    const adminVote = await admin.put(`/polls/${p.id}/ballot`).send(answer);
    expect(adminVote.status).toBe(403);
    expect(adminVote.body.code).toBe('NOT_ELIGIBLE');
    // the owner is in Engineering, so may vote
    expect((await owner.put(`/polls/${p.id}/ballot`).send(answer)).status).toBe(
      201,
    );
  });

  it('GET ballot is 404 before voting', async () => {
    const fresh = await openPoll({ allowAnswerEdit: true });
    const res = await med.get(`/polls/${fresh.id}/ballot`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NO_BALLOT');
  });

  it('stops accepting votes at closesAt even before the worker closes it', async () => {
    await db.query(
      "UPDATE polls SET closes_at = now() - interval '1 second' WHERE id = $1",
      [p.id],
    );
    const res = await med.put(`/polls/${p.id}/ballot`).send({
      answers: [
        { elementId: p.single.id, optionIds: [p.single.options[0]!.id] },
      ],
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('POLL_CLOSED');
  });
});

describe('voting without answer edits', () => {
  let p: Poll;
  beforeAll(async () => {
    p = await openPoll({ allowAnswerEdit: false });
  });

  it('a burst of first votes from one person yields exactly one ballot', async () => {
    const answer = {
      answers: [
        { elementId: p.single.id, optionIds: [p.single.options[0]!.id] },
      ],
    };
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        med.put(`/polls/${p.id}/ballot`).send(answer),
      ),
    );
    const statuses = results.map((r) => r.status).sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(
      results.filter((r) => r.status === 409).map((r) => r.body.code),
    ).toEqual(Array(4).fill('ALREADY_VOTED'));

    const { rows } = await db.query(
      'SELECT count(*)::int AS n FROM ballots WHERE poll_id = $1',
      [p.id],
    );
    expect(rows[0].n).toBe(1);
  });

  it('myBallot says the answer is final', async () => {
    const detail = await med.get(`/polls/${p.id}`);
    expect(detail.body.myBallot).toEqual({ submitted: true, canEdit: false });
  });
});

describe('anonymity', () => {
  it('ballots hold no user reference, and keys differ per poll', async () => {
    const columns = await db.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'ballots' ORDER BY 1",
    );
    expect(columns.rows.map((r) => r.column_name)).toEqual([
      'faculty_code',
      'id',
      'poll_id',
      'student_year',
      'submitted_at',
      'voter_key',
    ]);

    // med voted in two polls above: two different keys
    const keys = await db.query(
      "SELECT DISTINCT encode(voter_key, 'hex') AS k FROM ballots WHERE faculty_code = '30'",
    );
    expect(keys.rowCount).toBe(2);
  });
});

describe('rate limit', () => {
  it('allows at most 20 ballot requests a minute, then 429 + Retry-After', async () => {
    const path = `/polls/${crypto.randomUUID()}/ballot`;
    let allowed = 0;
    let limited: Awaited<ReturnType<typeof arts.put>> | undefined;
    for (let i = 0; i < 25 && !limited; i++) {
      const res = await arts.put(path).send({ answers: [] });
      if (res.status === 429) limited = res;
      else allowed++;
    }
    // earlier tests in this file already spent some of arts' budget
    expect(allowed).toBeLessThanOrEqual(20);
    expect(limited?.body.code).toBe('RATE_LIMITED');
    expect(Number(limited?.headers['retry-after'])).toBeGreaterThan(0);
  });
});
