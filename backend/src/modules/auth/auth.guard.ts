import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppError } from '../../common/errors.js';
import {
  type AuthedRequest,
  IS_PUBLIC,
  REQUIRED_ROLE,
} from './auth.decorators.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

// Global: every route needs a session unless marked @Public(). The user is read
// from the DB with the session on each request, so a revoked admin loses
// access immediately.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = await this.sessions.userFor(
      req.cookies?.[SESSION_COOKIE] as string | undefined,
    );
    if (!user) {
      throw new AppError(
        'UNAUTHENTICATED',
        HttpStatus.UNAUTHORIZED,
        'Login required',
      );
    }
    (req as AuthedRequest).user = user;

    const role = this.reflector.getAllAndOverride<string>(
      REQUIRED_ROLE,
      targets,
    );
    if (role && user.role !== role) {
      throw new AppError('FORBIDDEN', HttpStatus.FORBIDDEN, `Requires ${role}`);
    }
    return true;
  }
}
