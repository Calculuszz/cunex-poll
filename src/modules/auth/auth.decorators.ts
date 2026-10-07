import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../users/users.repository.js';

export const IS_PUBLIC = 'auth:public';
export const REQUIRED_ROLE = 'auth:role';

/** Route needs no session. Everything else requires one by default. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Route needs a session whose user has this role. */
export const RequireRole = (role: User['role']) =>
  SetMetadata(REQUIRED_ROLE, role);

export type AuthedRequest = Request & { user: User };

/** The logged-in user, loaded fresh from the DB by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
