import { createHmac } from 'node:crypto';

/**
 * Pseudonymous ballot key: the same user always gets the same key for a poll
 * (so they can edit their answer and can't vote twice), but the key can't be
 * turned back into a user without the pepper, which never goes in the DB.
 * Keys differ per poll, so ballots can't be linked across polls either.
 */
export function voterKey(pepper: string, pollId: string, userId: string) {
  return createHmac('sha256', pepper).update(`${pollId}:${userId}`).digest();
}
