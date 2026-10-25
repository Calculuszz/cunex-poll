import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

// Serverless entry (Vercel): the Nest app is created once per instance and
// reused across requests. Use with JOBS_MODE=sweep: there is no worker.
let server: Promise<express.Express> | undefined;

async function createServer() {
  const instance = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(instance),
    { bufferLogs: true },
  );
  configureApp(app);
  await app.init();
  return instance;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  server ??= createServer().catch((err: unknown) => {
    server = undefined; // retry on the next request
    throw err;
  });
  (await server)(req, res);
}
