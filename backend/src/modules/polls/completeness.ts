import { QUESTION_TYPES, type PollDraftInput } from './poll-draft.schema.js';

export interface Problem {
  path: string;
  message: string;
}

/**
 * Checks a draft is ready for review. Drafts may be saved half-done; this is
 * the gate before POST /polls/:id/submit. Returns every problem at once so the
 * editor can highlight all of them.
 */
export function findProblems(draft: PollDraftInput, now: Date): Problem[] {
  const problems: Problem[] = [];
  const add = (path: string, message: string) =>
    problems.push({ path, message });

  if (!draft.title) add('title', 'ต้องมีชื่อโพล');
  if (!draft.closesAt) {
    add('closesAt', 'ต้องกำหนดเวลาปิดโหวต');
  } else if (new Date(draft.closesAt) <= now) {
    add('closesAt', 'เวลาปิดโหวตต้องอยู่ในอนาคต');
  }

  const elements = draft.elements;
  if (!elements.some((e) => QUESTION_TYPES.has(e.type))) {
    add('elements', 'ต้องมีคำถามอย่างน้อย 1 ข้อ');
  }
  if (elements.at(0)?.type === 'page_break') {
    add('elements.0', 'ขึ้นหน้าใหม่ต้องไม่อยู่บนสุด');
  }
  if (elements.length > 0 && elements.at(-1)?.type === 'page_break') {
    add(`elements.${elements.length - 1}`, 'ขึ้นหน้าใหม่ต้องไม่อยู่ล่างสุด');
  }

  elements.forEach((e, i) => {
    const at = `elements.${i}`;
    if (e.type === 'page_break' && elements[i + 1]?.type === 'page_break') {
      add(at, 'ขึ้นหน้าใหม่ซ้อนกัน 2 ครั้ง');
    }
    if (QUESTION_TYPES.has(e.type) && 'title' in e && !e.title) {
      add(`${at}.title`, 'ต้องมีคำถาม');
    }
    if ('options' in e) {
      if (e.options.length < 2)
        add(`${at}.options`, 'ต้องมีตัวเลือกอย่างน้อย 2 ข้อ');
    }
    if (e.type === 'multi_choice') {
      const { minSelect, maxSelect } = e.config;
      if (minSelect !== undefined && minSelect > e.options.length) {
        add(`${at}.config.minSelect`, 'เลือกขั้นต่ำมากกว่าจำนวนตัวเลือก');
      }
      if (maxSelect !== undefined && maxSelect > e.options.length) {
        add(`${at}.config.maxSelect`, 'เลือกได้สูงสุดมากกว่าจำนวนตัวเลือก');
      }
    }
    if (e.type === 'description') {
      e.config.sections.forEach((s, j) => {
        if (!s.body) add(`${at}.config.sections.${j}.body`, 'ต้องมีเนื้อหา');
      });
    }
  });

  return problems;
}
