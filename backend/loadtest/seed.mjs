// Load-test data for a STAGING database (never production).
// Creates N fake CUNEX students with ready-made sessions, one admin and one
// owner, then an open 3-page poll through the real API.
//
//   DATABASE_URL=<staging session pooler> API=https://<staging-api> \
//   ORIGIN=<staging APP_ORIGIN> node loadtest/seed.mjs 2000 out.json
//
// Sessions are inserted directly (sha256 of the cookie value, like
// SessionService) so the test does not depend on CUNEX logins.
import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import pg from 'pg';

const [count = '2000', out = 'loadtest-seed.json'] = process.argv.slice(2);
const { DATABASE_URL, API, ORIGIN } = process.env;
if (!DATABASE_URL || !API || !ORIGIN)
  throw new Error('DATABASE_URL, API and ORIGIN are required');
if (/rjoevhizsxpzunwpgeoc/.test(DATABASE_URL))
  throw new Error('refusing to seed production');

const FACULTIES = [
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
];
const YEARS = [2565, 2566, 2567, 2568, 2569];
const sid = () => randomBytes(32).toString('base64url');
const hash = (s) => createHash('sha256').update(s).digest();

const db = new pg.Client({ connectionString: DATABASE_URL });
await db.connect();

async function makeUsers(n, role = 'user') {
  const users = [];
  for (let start = 0; start < n; start += 500) {
    const batch = [];
    for (let i = start; i < Math.min(n, start + 500); i++) {
      batch.push({
        faculty: FACULTIES[i % FACULTIES.length],
        year: YEARS[i % YEARS.length],
        studentId: `${String(YEARS[i % YEARS.length]).slice(2)}9${String(i).padStart(5, '0')}${FACULTIES[i % FACULTIES.length]}`,
        sid: sid(),
      });
    }
    const values = batch
      .map(
        (_, j) =>
          `($${j * 4 + 1}, true, $${j * 4 + 2}::char(2), $${j * 4 + 3}::smallint, $${j * 4 + 4})`,
      )
      .join(',');
    const { rows } = await db.query(
      `INSERT INTO users (role, is_chula_verified, faculty_code, student_year, student_id)
       SELECT '${role}'::user_role, v.c, v.f, v.y, v.s FROM (VALUES ${values}) AS v(r, c, f, y, s)
       RETURNING id`,
      batch.flatMap((u) => [role, u.faculty, u.year, u.studentId]),
    );
    rows.forEach((r, j) => (batch[j].id = r.id));
    const sv = batch
      .map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2}, now() + interval '1 day')`)
      .join(',');
    await db.query(
      `INSERT INTO sessions (id_hash, user_id, expires_at) VALUES ${sv}`,
      batch.flatMap((u) => [hash(u.sid), u.id]),
    );
    users.push(...batch);
  }
  return users;
}

const [admin] = await makeUsers(1, 'admin');
const [owner] = await makeUsers(1);
const voters = await makeUsers(Number(count));
await db.end();

const call = async (who, method, path, body) => {
  const res = await fetch(`${API}/api/v1${path}`, {
    method,
    headers: {
      Cookie: `sid=${who.sid}`,
      Origin: ORIGIN,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(
      `${method} ${path} → ${res.status} ${JSON.stringify(json)}`,
    );
  return json;
};

const poll = await call(owner, 'POST', '/polls', {
  title: 'Load test poll',
  description: 'staging only',
  closesAt: new Date(Date.now() + 3 * 86400_000).toISOString(),
  audience: { type: 'chula' },
  settings: {
    showResultsRealtime: true,
    allowAnswerEdit: true,
    listedPublicly: true,
  },
  elements: [
    {
      type: 'single_choice',
      title: 'ชอบสีไหน',
      isRequired: true,
      options: [
        { label: 'แดง' },
        { label: 'เขียว' },
        { label: 'ฟ้า' },
        { label: 'ชมพู' },
      ],
    },
    { type: 'page_break' },
    {
      type: 'multi_choice',
      title: 'กิจกรรมที่สนใจ',
      config: { maxSelect: 2 },
      options: [{ label: 'ดนตรี' }, { label: 'กีฬา' }, { label: 'อาสา' }],
    },
    { type: 'page_break' },
    { type: 'text_question', title: 'ข้อเสนอแนะ' },
  ],
});
await call(owner, 'POST', `/polls/${poll.id}/submit`);
await call(admin, 'POST', `/admin/polls/${poll.id}/approve`);
const opened = await call(owner, 'POST', `/polls/${poll.id}/publish`, {
  now: true,
});

writeFileSync(
  out,
  JSON.stringify({
    api: API,
    origin: ORIGIN,
    pollId: poll.id,
    elements: opened.elements
      .filter((e) => e.type !== 'page_break')
      .map((e) => ({
        id: e.id,
        type: e.type,
        options: (e.options ?? []).map((o) => o.id),
      })),
    sids: voters.map((u) => u.sid),
  }),
);
console.log(`seeded ${voters.length} voters, poll ${poll.id} → ${out}`);
