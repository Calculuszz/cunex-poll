import { findProblems } from './completeness.js';
import { pollDraftSchema } from './poll-draft.schema.js';

const now = new Date('2026-10-07T00:00:00Z');

const ready = {
  title: 'ธีมงาน',
  closesAt: '2026-10-20T10:00:00+07:00',
  elements: [
    {
      type: 'single_choice',
      title: 'อยากให้ธีมงานปีนี้เป็นแบบไหน',
      options: [{ label: 'ย้อนยุคสยาม' }, { label: 'แสงสีร่วมสมัย' }],
    },
    { type: 'page_break' },
    { type: 'text_question', title: 'ข้อเสนอแนะ' },
  ],
};

const paths = (input: unknown) =>
  findProblems(pollDraftSchema.parse(input), now).map((p) => p.path);

describe('findProblems', () => {
  it('passes a complete draft', () => {
    expect(paths(ready)).toEqual([]);
  });

  it('reports every missing piece of an empty draft', () => {
    expect(paths({})).toEqual(['title', 'closesAt', 'elements']);
  });

  it('rejects a closing time in the past', () => {
    expect(paths({ ...ready, closesAt: '2026-10-01T00:00:00Z' })).toEqual([
      'closesAt',
    ]);
  });

  it('checks questions and options', () => {
    expect(
      paths({
        ...ready,
        elements: [
          { type: 'single_choice', title: '', options: [{ label: 'a' }] },
          {
            type: 'multi_choice',
            title: 'q',
            options: [{ label: 'a' }, { label: 'b' }],
            config: { minSelect: 3 },
          },
        ],
      }),
    ).toEqual([
      'elements.0.title',
      'elements.0.options',
      'elements.1.config.minSelect',
    ]);
  });

  it('rejects page breaks at the edges or doubled', () => {
    expect(
      paths({
        ...ready,
        elements: [
          { type: 'page_break' },
          { type: 'text_question', title: 'q' },
          { type: 'page_break' },
          { type: 'page_break' },
        ],
      }),
    ).toEqual(['elements.0', 'elements.3', 'elements.2']);
  });
});
