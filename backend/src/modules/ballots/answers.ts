import { z } from 'zod';
import type { Problem } from '../polls/completeness.js';
import type { ElementRow } from '../polls/polls.repository.js';

export const ballotBodySchema = z.object({
  answers: z
    .array(
      z
        .object({
          elementId: z.uuid(),
          optionIds: z.array(z.uuid()).max(200).optional(),
          text: z.string().max(5000).optional(),
        })
        .refine((a) => (a.optionIds === undefined) !== (a.text === undefined), {
          message: 'send exactly one of optionIds or text',
        }),
    )
    .max(200),
});

export type BallotBody = z.infer<typeof ballotBodySchema>;

export interface NormalizedBallot {
  choices: { elementId: string; optionId: string }[];
  texts: { elementId: string; answer: string }[];
}

const CHOICE = new Set(['single_choice', 'multi_choice', 'dropdown']);

/**
 * Checks answers against the poll's questions and returns them normalized
 * (trimmed, empty answers dropped). Every problem is reported at once.
 */
export function checkAnswers(
  elements: ElementRow[],
  body: BallotBody,
): { problems: Problem[]; ballot: NormalizedBallot } {
  const problems: Problem[] = [];
  const ballot: NormalizedBallot = { choices: [], texts: [] };
  const byId = new Map(elements.map((e) => [e.id, e]));
  const answered = new Set<string>();

  body.answers.forEach((a, i) => {
    const at = `answers.${i}`;
    const el = byId.get(a.elementId);
    if (!el || (!CHOICE.has(el.type) && el.type !== 'text_question')) {
      problems.push({ path: `${at}.elementId`, message: 'ไม่มีคำถามนี้ในโพล' });
      return;
    }
    if (answered.has(el.id)) {
      problems.push({ path: `${at}.elementId`, message: 'ตอบคำถามเดิมซ้ำ' });
      return;
    }

    if (el.type === 'text_question') {
      if (a.text === undefined) {
        problems.push({ path: at, message: 'คำถามนี้ต้องตอบเป็นข้อความ' });
        return;
      }
      const text = a.text.trim();
      const max = (el.config as { maxLength?: number }).maxLength ?? 1000;
      if (text.length > max) {
        problems.push({
          path: `${at}.text`,
          message: `ยาวเกิน ${max} ตัวอักษร`,
        });
        return;
      }
      if (text) {
        answered.add(el.id);
        ballot.texts.push({ elementId: el.id, answer: text });
      }
      return;
    }

    if (a.optionIds === undefined) {
      problems.push({ path: at, message: 'คำถามนี้ต้องเลือกตัวเลือก' });
      return;
    }
    const ids = [...new Set(a.optionIds)];
    if (ids.length !== a.optionIds.length) {
      problems.push({ path: `${at}.optionIds`, message: 'เลือกตัวเลือกซ้ำ' });
      return;
    }
    const valid = new Set(el.options.map((o) => o.id));
    if (ids.some((id) => !valid.has(id))) {
      problems.push({ path: `${at}.optionIds`, message: 'ไม่มีตัวเลือกนี้' });
      return;
    }
    if (ids.length === 0) return; // unanswered; required check below

    if (el.type === 'multi_choice') {
      const cfg = el.config as { minSelect?: number; maxSelect?: number };
      const min = cfg.minSelect ?? 1;
      const max = cfg.maxSelect ?? el.options.length;
      if (ids.length < min || ids.length > max) {
        problems.push({
          path: `${at}.optionIds`,
          message: `เลือกได้ ${min}–${max} ข้อ`,
        });
        return;
      }
    } else if (ids.length > 1) {
      problems.push({ path: `${at}.optionIds`, message: 'เลือกได้ข้อเดียว' });
      return;
    }

    answered.add(el.id);
    for (const optionId of ids)
      ballot.choices.push({ elementId: el.id, optionId });
  });

  for (const el of elements) {
    if (el.isRequired && !answered.has(el.id)) {
      problems.push({ path: `elements.${el.id}`, message: 'ต้องตอบข้อนี้' });
    }
  }
  return { problems, ballot };
}
