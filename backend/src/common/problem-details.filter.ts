import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Response } from 'express';
import { AppError } from './errors.js';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  [key: string]: unknown;
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
  503: 'UNAVAILABLE',
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const problem = this.toProblem(exception);
    if (problem.status >= 500) this.logger.error(exception);
    // A route may have set a cacheable Cache-Control before failing (@Header
    // is applied up front); errors must never be kept by a CDN or browser.
    res.setHeader('Cache-Control', 'no-store');
    if (typeof problem.retryAfterSeconds === 'number') {
      res.setHeader('Retry-After', String(problem.retryAfterSeconds));
    }
    res.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(exception: unknown): ProblemDetails {
    if (exception instanceof AppError) {
      const status = exception.getStatus();
      return {
        type: 'about:blank',
        title: STATUS_CODES[status] ?? 'Error',
        status,
        code: exception.code,
        detail: exception.message,
        ...exception.extra,
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      // Nest's built-in validation pipe puts the schema issues under `message`.
      const issues =
        typeof body === 'object' && body && 'message' in body
          ? body.message
          : undefined;
      return {
        type: 'about:blank',
        title: STATUS_CODES[status] ?? 'Error',
        status,
        code: CODE_BY_STATUS[status] ?? 'HTTP_ERROR',
        detail: exception.message,
        ...(Array.isArray(issues) ? { issues } : {}),
        // @nestjs/terminus readiness failures: per-dependency up/down
        ...(typeof body === 'object' && body && 'details' in body
          ? { checks: body.details }
          : {}),
      };
    }
    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      code: 'INTERNAL',
    };
  }
}
