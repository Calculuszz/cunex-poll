import { HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  // Runs zod schemas passed as `@Body({ schema })` / `@Param(..., { schema })`.
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.setGlobalPrefix('api/v1', { exclude: ['healthz', 'readyz'] });
  app.set('trust proxy', 1); // behind the load balancer: real client IP for rate limits
  app.enableShutdownHooks();

  const config = app.get(ConfigService<Env, true>);
  await app.listen(config.get('PORT'));
}

await bootstrap();
