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
