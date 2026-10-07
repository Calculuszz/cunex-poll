import type { User } from '../users/users.repository.js';

export interface AudienceRule {
  facultyCode: string | null;
  studentYear: number | null;
}

/**
 * Who may answer a poll. Public: anyone logged in. Restricted: CUNEX-verified
 * users matching at least one rule; inside a rule every set field must match.
 * Must stay in sync with `eligibleFor()` in polls.repository.ts (SQL version).
 */
export function isEligible(
  audience: 'public' | 'restricted',
  rules: AudienceRule[],
  user: Pick<User, 'isChulaVerified' | 'facultyCode' | 'studentYear'>,
): boolean {
  if (audience === 'public') return true;
  if (!user.isChulaVerified) return false;
  return rules.some(
    (r) =>
      (r.facultyCode === null || r.facultyCode === user.facultyCode) &&
      (r.studentYear === null || r.studentYear === user.studentYear),
  );
}
