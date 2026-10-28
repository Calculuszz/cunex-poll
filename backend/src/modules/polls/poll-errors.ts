import { HttpStatus } from '@nestjs/common';
import { AppError } from '../../common/errors.js';
import type { PollStatus } from '../../infra/database/db.js';

export const pollNotFound = () =>
  new AppError('POLL_NOT_FOUND', HttpStatus.NOT_FOUND, 'Poll not found');

/** The action isn't allowed in the poll's current status. */
export const pollLocked = (status: PollStatus) =>
  new AppError('POLL_LOCKED', HttpStatus.CONFLICT, `Poll is ${status}`, {
    pollStatus: status,
  });

/** Opening a poll whose own deadline already went by helps nobody. */
export const closesAtPassed = () =>
  new AppError(
    'CLOSES_AT_PASSED',
    HttpStatus.UNPROCESSABLE_ENTITY,
    'The poll closing time has already passed; move closesAt first',
  );

/** The opening time picked when publishing is in the past or after closesAt. */
export const invalidOpensAt = (message: string) =>
  new AppError(
    'INVALID_OPENS_AT',
    HttpStatus.UNPROCESSABLE_ENTITY,
    'opensAt must be in the future and before closesAt',
    { problems: [{ path: 'opensAt', message }] },
  );
