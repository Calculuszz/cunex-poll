import type { User } from '../users/users.repository.js';
import { isEligible } from './eligibility.js';
import type { PollAggregate, PollRow } from './polls.repository.js';

const isStaff = (poll: PollRow, user: User) =>
  poll.ownerId === user.id || user.role === 'admin';

/**
 * Owner and admins see every status; everyone else only published polls they
 * may answer. Callers answer 404 (not 403) when this is false, so poll ids
 * can't be probed.
 */
export function canSeePoll(agg: PollAggregate, user: User): boolean {
  if (isStaff(agg.poll, user)) return true;
  const published = agg.poll.status === 'open' || agg.poll.status === 'closed';
  return published && isEligible(agg.poll.audience, agg.rules, user);
}

/** Owner/admin always; voters once closed, or live if the owner allows it. */
export function canViewResults(poll: PollRow, user: User): boolean {
  return (
    isStaff(poll, user) ||
    poll.status === 'closed' ||
    (poll.status === 'open' && poll.showResultsRealtime)
  );
}

/** Voting is open: status open and the deadline not yet reached. */
export function isAcceptingVotes(poll: PollRow, now = new Date()): boolean {
  return poll.status === 'open' && !!poll.closesAt && poll.closesAt > now;
}
