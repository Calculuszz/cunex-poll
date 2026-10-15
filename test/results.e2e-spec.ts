import { randomBytes } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type pg from 'pg';
import { as, createTestApp, loginAs } from './e2e-env.js';

let app: NestExpressApplication;
let db: pg.Client;
let owner: ReturnType<typeof as>;
let voter: ReturnType<typeof as>; // med-2566, faculty 30
let admin: ReturnType<typeof as>;

let pollId: string;
let questionId: string;
let optA: string;
let optB: string;
let textId: string;

beforeAll(async () => {
  ({ app, db } = await createTestApp());
  owner = as(app, await loginAs(app, 'eng-2567'));
  voter = as(app, await loginAs(app, 'med-2566'));
  admin = as(app, await loginAs(app, 'admin'));
  await loginAs(app, 'arts-2565'); // registers faculty 22 for the inserted ballots
  await db.query(
    "UPDATE users SET role = 'admin' WHERE id = (SELECT user_id FROM user_identities WHERE provider_subject = '100000000000000099')",
  );

  const { body } = await owner.post('/polls').send({
    title: 'ผลโหวต',
    closesAt: new Date(Date.now() + 86400_000).toISOString(),
    settings: { showResultsRealtime: false, listedPublicly: true },
    elements: [
      {
        type: 'single_choice',
        title: 'เลือก',
        options: [{ label: 'A' }, { label: 'B' }],
      },
      { type: 'text_question', title: 'ความเห็น' },
    ],
  });
  await owner.post(`/polls/${body.id}/submit`);
  const opened = await admin.post(`/admin/polls/${body.id}/approve`);
  pollId = body.id;
  questionId = opened.body.elements[0].id;
  [optA, optB] = opened.body.elements[0].options.map(
    (o: { id: string }) => o.id,
  );
  textId = opened.body.elements[1].id;

  // one real vote through the API
  const vote = await voter.put(`/polls/${pollId}/ballot`).send({
    answers: [
      { elementId: questionId, optionIds: [optB] },
      { elementId: textId, text: 'ชอบมาก' },
    ],
  });
  expect(vote.status).toBe(201);

  // 6 Engineering + 2 Arts voters, inserted directly (ballots carry no user)
  for (const [faculty, option, n] of [
    ['21', optA, 6],
    ['22', optB, 2],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const { rows } = await db.query(
        'INSERT INTO ballots (poll_id, voter_key, faculty_code) VALUES ($1, $2, $3) RETURNING id',
        [pollId, randomBytes(32), faculty],
      );
      await db.query(
        'INSERT INTO ballot_choices (ballot_id, poll_id, element_id, option_id) VALUES ($1, $2, $3, $4)',
        [rows[0].id, pollId, questionId, option],
      );
    }
  }
});

afterAll(async () => {
  await app?.close();
  await db?.end();
});

describe('results', () => {
  it('owner sees totals per option', async () => {
    const res = await owner.get(`/polls/${pollId}/results`);
    expect(res.status).toBe(200);
    expect(res.body.totalBallots).toBe(9);
    const q = res.body.elements.find(
      (e: { elementId: string }) => e.elementId === questionId,
    );
    expect(q.answered).toBe(9);
    expect(q.options).toEqual(
      expect.arrayContaining([
        { optionId: optA, count: 6 },
        { optionId: optB, count: 3 },
      ]),
    );
    const t = res.body.elements.find(
      (e: { elementId: string }) => e.elementId === textId,
    );
    expect(t.answered).toBe(1);
  });

  it('faculty breakdown hides groups smaller than k = 5', async () => {
    const res = await owner.get(`/polls/${pollId}/results?breakdown=faculty`);
    expect(res.body.breakdown.minGroupSize).toBe(5);
    expect(res.body.breakdown.groups).toEqual([
      {
        group: '21',
        total: 6,
        elements: [
          { elementId: questionId, options: [{ optionId: optA, count: 6 }] },
        ],
      },
      // Arts (2) + Medicine (1) = 3 < 5: no numbers at all
      { group: 'other', hidden: true },
    ]);
  });

  it('answers 304 when nothing changed', async () => {
    const first = await owner.get(`/polls/${pollId}/results`);
    const again = await owner
      .get(`/polls/${pollId}/results`)
      .set('If-None-Match', first.headers.etag);
    expect(again.status).toBe(304);
  });

  it('voters wait for the poll to close when live results are off', async () => {
    const hidden = await voter.get(`/polls/${pollId}/results`);
    expect(hidden.status).toBe(403);
    expect(hidden.body.code).toBe('RESULTS_HIDDEN');
  });

  it('free-text answers: owner only, no ids or times', async () => {
    const res = await owner.get(
      `/polls/${pollId}/results/text?elementId=${textId}`,
    );
    expect(res.body).toEqual({ items: [{ text: 'ชอบมาก' }], nextCursor: null });

    expect(
      (await voter.get(`/polls/${pollId}/results/text?elementId=${textId}`))
        .status,
    ).toBe(403);
    expect(
      (await owner.get(`/polls/${pollId}/results/text?elementId=${questionId}`))
        .status,
    ).toBe(404);
  });

  it('after closing, voters see the results', async () => {
    expect((await owner.post(`/polls/${pollId}/close`)).status).toBe(200);
    const res = await voter.get(`/polls/${pollId}/results`);
    expect(res.status).toBe(200);
    expect(res.body.totalBallots).toBe(9);
  });
});
