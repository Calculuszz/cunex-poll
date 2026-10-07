import { HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';

// Shared by main.ts and the e2e tests so both run the same HTTP pipeline.
export function configureApp(app: NestExpressApplication) {
  app.useLogger(app.get(Logger));
  app.use(cookieParser());

  // Runs zod schemas passed as `@Body({ schema })` / `@Query({ schema })`.
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );
  app.setGlobalPrefix('api/v1', { exclude: ['healthz', 'readyz'] });
  app.set('trust proxy', 1); // behind the load balancer: real client IP for rate limits
  return app;
}
