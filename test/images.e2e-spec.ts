import type { NestExpressApplication } from '@nestjs/platform-express';
import type pg from 'pg';
import { as, createTestApp, loginAs } from './e2e-env.js';

// 1×1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const NOT_AN_IMAGE = Buffer.from('<svg onload="alert(1)"></svg>      ');

let app: NestExpressApplication;
let db: pg.Client;
let me: ReturnType<typeof as>;

beforeAll(async () => {
  ({ app, db } = await createTestApp());
  me = as(app, await loginAs(app, 'eng-2567'));
});

afterAll(async () => {
  await app?.close();
  await db?.end();
});

interface Slot {
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  publicUrl: string;
}

async function slot(mimeType: string, byteSize: number): Promise<Slot> {
  const res = await me.post('/images/uploads').send({ mimeType, byteSize });
  expect(res.status).toBe(201);
  return res.body as Slot;
}

const put = (s: Slot, body: Buffer) =>
  fetch(s.uploadUrl, {
    method: 'PUT',
    headers: s.uploadHeaders,
    body: new Uint8Array(body),
  });

/** A draft that passes every other submit check, using `url` as its image. */
const draftWith = (url: string) => ({
  title: 'มีรูป',
  closesAt: new Date(Date.now() + 86400_000).toISOString(),
  elements: [
    {
      type: 'image',
      config: { url, alt: 'โปสเตอร์งาน', caption: 'ภาพประกอบ' },
    },
    {
      type: 'single_choice',
      title: 'เลือก',
      options: [
        { label: 'a', imageUrl: url, imageAlt: 'รูปตัวเลือก a' },
        { label: 'b' },
      ],
    },
    {
      type: 'info_popup',
      config: { title: 'รายละเอียด', body: 'อ่านก่อนตอบ', imageUrl: url },
    },
  ],
});

describe('upload slot', () => {
  it('returns an upload URL and a permanent public URL', async () => {
    const s = await slot('image/png', PNG.length);
    expect(s.publicUrl).toMatch(/\/images\/[0-9a-f-]{36}\.png$/);
    expect(s.uploadHeaders).toEqual({ 'Content-Type': 'image/png' });

    expect((await put(s, PNG)).status).toBe(200);
    // public read, no signature needed
    const served = await fetch(s.publicUrl);
    expect(served.status).toBe(200);
    expect(Buffer.from(await served.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it('storage refuses a body other than the declared size', async () => {
    const s = await slot('image/png', 10);
    expect((await put(s, PNG)).status).toBeGreaterThanOrEqual(400);
  });

  it('rejects oversized declarations and non-image types', async () => {
    const big = await me
      .post('/images/uploads')
      .send({ mimeType: 'image/png', byteSize: 50 * 1024 * 1024 });
    expect(big.status).toBe(422);
    expect(big.body.code).toBe('IMAGE_TOO_LARGE');

    const svg = await me
      .post('/images/uploads')
      .send({ mimeType: 'image/svg+xml', byteSize: 100 });
    expect(svg.status).toBe(422);
  });
});

describe('images in a poll', () => {
  it('a real uploaded image passes submit', async () => {
    const s = await slot('image/png', PNG.length);
    await put(s, PNG);
    const { body } = await me.post('/polls').send(draftWith(s.publicUrl));
    expect(body.elements[0].config).toMatchObject({
      url: s.publicUrl,
      alt: 'โปสเตอร์งาน',
    });
    expect(body.elements[1].options[0]).toMatchObject({
      imageUrl: s.publicUrl,
      imageAlt: 'รูปตัวเลือก a',
    });
    expect(body.elements[2].config.imageUrl).toBe(s.publicUrl);

    const submit = await me.post(`/polls/${body.id}/submit`);
    expect(submit.status).toBe(200);
  });

  it('submit catches a slot that was never uploaded, or a fake image', async () => {
    const never = await slot('image/png', PNG.length);
    const fake = await slot('image/png', NOT_AN_IMAGE.length);
    expect((await put(fake, NOT_AN_IMAGE)).status).toBe(200);

    const { body } = await me.post('/polls').send({
      ...draftWith(never.publicUrl),
      coverImageUrl: fake.publicUrl,
    });
    expect(body.id).toBeTruthy();

    const submit = await me.post(`/polls/${body.id}/submit`);
    expect(submit.status).toBe(422);
    expect(submit.body.code).toBe('POLL_INCOMPLETE');
    expect(
      submit.body.problems.map((p: { path: string }) => p.path).sort(),
    ).toEqual(
      [
        'coverImageUrl',
        'elements.0.config.url',
        'elements.1.options.0.imageUrl',
        'elements.2.config.imageUrl',
      ].sort(),
    );
  });

  it('URLs outside our bucket are refused on save', async () => {
    const res = await me
      .post('/polls')
      .send(draftWith('https://images.example.com/cat.png'));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_IMAGE_URL');
  });
});
