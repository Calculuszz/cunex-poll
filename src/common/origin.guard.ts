import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import { AppError } from './errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// CSRF defence for cookie sessions: state-changing requests must come from our own
// web origin. Complements SameSite=Lax on the session cookie.
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowed: string;

  constructor(config: ConfigService<Env, true>) {
    this.allowed = new URL(config.get('APP_ORIGIN')).origin;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const origin = req.get('origin') ?? originOf(req.get('referer'));
    if (origin === this.allowed) return true;
    throw new AppError(
      'BAD_ORIGIN',
      HttpStatus.FORBIDDEN,
      'Request origin is not allowed',
    );
  }
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
