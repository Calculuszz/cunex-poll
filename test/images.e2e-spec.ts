import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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
let worker: INestApplicationContext;
let db: pg.Client;
let me: ReturnType<typeof as>;
let other: ReturnType<typeof as>;

beforeAll(async () => {
  ({ app, db } = await createTestApp());
  const { WorkerModule } = await import('../src/worker.module.js');
  worker = await NestFactory.createApplicationContext(WorkerModule, {
    logger: false,
  });
  me = as(app, await loginAs(app, 'eng-2567'));
  other = as(app, await loginAs(app, 'med-2566'));
});

afterAll(async () => {
  await worker?.close();
  await app?.close();
  await db?.end();
});

async function upload(
  as: ReturnType<typeof import('./e2e-env.js').as>,
  declared: { mimeType: string; byteSize: number },
  body: Buffer,
) {
  const start = await as.post('/images/uploads').send(declared);
  expect(start.status).toBe(201);
  const put = await fetch(start.body.upload.url, {
    method: 'PUT',
    headers: start.body.upload.headers,
    body: new Uint8Array(body),
  });
  return { imageId: start.body.imageId as string, putStatus: put.status };
}

describe('direct upload', () => {
  it('upload → complete → ready, served from storage', async () => {
    const { imageId, putStatus } = await upload(
      me,
      { mimeType: 'image/png', byteSize: PNG.length },
      PNG,
    );
    expect(putStatus).toBe(200);

    const done = await me.post(`/images/${imageId}/complete`);
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({ status: 'ready', mimeType: 'image/png' });

    const served = await fetch(done.body.url);
    expect(Buffer.from(await served.arrayBuffer()).equals(PNG)).toBe(true);
  });

  it('storage refuses a body bigger than declared', async () => {
    const { imageId, putStatus } = await upload(
      me,
      { mimeType: 'image/png', byteSize: 10 },
      PNG,
    );
    expect(putStatus).toBeGreaterThanOrEqual(400);
    const done = await me.post(`/images/${imageId}/complete`);
    expect(done.status).toBe(409);
    expect(done.body.code).toBe('UPLOAD_NOT_FOUND');
  });

  it('a non-image renamed as PNG is rejected on complete', async () => {
    const { imageId } = await upload(
      me,
      { mimeType: 'image/png', byteSize: NOT_AN_IMAGE.length },
      NOT_AN_IMAGE,
    );
    const done = await me.post(`/images/${imageId}/complete`);
    expect(done.status).toBe(422);
    expect(done.body.code).toBe('INVALID_IMAGE_FILE');
    expect((await me.get(`/images/${imageId}`)).body.status).toBe('failed');
  });

  it('rejects oversized declarations and unknown types', async () => {
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

describe('using images in polls', () => {
  let imageId: string;
  beforeAll(async () => {
    ({ imageId } = await upload(
      me,
      { mimeType: 'image/png', byteSize: PNG.length },
      PNG,
    ));
    await me.post(`/images/${imageId}/complete`);
  });

  it('poll detail carries a URL for each image it uses', async () => {
    const res = await me.post('/polls').send({
      title: 'มีรูป',
      coverImageId: imageId,
      elements: [{ type: 'image', config: { imageId, caption: 'ภาพประกอบ' } }],
    });
    expect(res.status).toBe(201);
    expect(Object.keys(res.body.imageUrls)).toEqual([imageId]);
  });

  it('images are private to their owner', async () => {
    expect((await other.get(`/images/${imageId}`)).status).toBe(404);
    const res = await other
      .post('/polls')
      .send({ title: 'ขโมยรูป', coverImageId: imageId });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_IMAGE');
  });
});

describe('import from URL', () => {
  it('rejects non-https URLs up front', async () => {
    const res = await me
      .post('/images/import')
      .send({ url: 'http://example.com/a.png' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_URL');
  });

  it('the worker refuses hosts that resolve to our own network', async () => {
    const res = await me
      .post('/images/import')
      .send({ url: 'https://localhost/a.png' });
    expect(res.status).toBe(202);

    let status = 'pending';
    for (let i = 0; i < 50 && status === 'pending'; i++) {
      await new Promise((r) => setTimeout(r, 200));
      status = (await me.get(`/images/${res.body.imageId}`)).body.status;
    }
    expect(status).toBe('failed');
  });
});
