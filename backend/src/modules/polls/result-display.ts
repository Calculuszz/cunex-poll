import { z } from 'zod';
import type { PollRow } from './polls.repository.js';

/**
 * What voters see of the results ("เผยแพร่ผล"), set by the owner once the
 * poll is open. Owner and admins always see everything. The API applies it
 * (filters questions, drops hidden numbers); the views are only a hint for
 * how the web app draws the charts.
 */
export const resultDisplaySchema = z.object({
  published: z.boolean(),
  /** Choice questions voters see; null = all of them. */
  elementIds: z.array(z.uuid()).max(200).nullable(),
  views: z
    .array(z.enum(['list', 'pie', 'bar']))
    .min(1)
    .max(3)
    .transform((v) => [...new Set(v)]),
  showCount: z.boolean(),
  showPercent: z.boolean(),
  showTotal: z.boolean(),
});

export type ResultDisplay = z.infer<typeof resultDisplaySchema>;

export const DEFAULT_RESULT_DISPLAY: ResultDisplay = {
  published: true,
  elementIds: null,
  views: ['list'],
  showCount: true,
  showPercent: true,
  showTotal: true,
};

export function resultDisplayOf(poll: Pick<PollRow, 'resultDisplay'>) {
  if (poll.resultDisplay === null) return DEFAULT_RESULT_DISPLAY;
  const parsed = resultDisplaySchema.safeParse(poll.resultDisplay);
  return parsed.success ? parsed.data : DEFAULT_RESULT_DISPLAY;
}
