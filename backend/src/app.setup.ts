import { HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { z } from 'zod';
import { AppError } from './common/errors.js';

// Schema messages go straight to users, so they are in Thai.
z.config(z.locales.th());

// Shared by main.ts and the e2e tests so both run the same HTTP pipeline.
export function configureApp(app: NestExpressApplication) {
  app.useLogger(app.get(Logger));
  app.use(cookieParser());

  // Runs zod schemas passed as `@Body({ schema })` / `@Query({ schema })`.
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      // Same { path, message } shape as POLL_INCOMPLETE so the editor can
      // point at the field; path is dot-separated (elements.2.options.0.label).
      exceptionFactory: (issues) =>
        new AppError(
          'UNPROCESSABLE',
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Invalid request body',
          {
            problems: issues.map((i) => ({
              path: (i.path ?? [])
                .map((k) => String(typeof k === 'object' ? k.key : k))
                .join('.'),
              message: i.message,
            })),
          },
        ),
    }),
  );
  app.setGlobalPrefix('api/v1', { exclude: ['healthz', 'readyz'] });
  app.set('trust proxy', 1); // behind the load balancer: real client IP for rate limits
  return app;
}
