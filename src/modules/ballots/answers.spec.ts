import type { ElementRow } from '../polls/polls.repository.js';
import { checkAnswers } from './answers.js';

const opt = (id: string, elementId: string) => ({
  id,
  elementId,
  position: 0,
  label: id,
  description: null,
  imageId: null,
  popup: null,
});

const el = (
  id: string,
  type: ElementRow['type'],
  extra: Partial<ElementRow> = {},
): ElementRow => ({
  id,
  pollId: 'p',
  position: 0,
  type,
  title: id,
  isRequired: false,
  config: {},
  options: [],
  ...extra,
});

const E = {
  single: '00000000-0000-4000-8000-000000000001',
  multi: '00000000-0000-4000-8000-000000000002',
  text: '00000000-0000-4000-8000-000000000003',
  info: '00000000-0000-4000-8000-000000000004',
};
const O = {
  a: '10000000-0000-4000-8000-000000000001',
  b: '10000000-0000-4000-8000-000000000002',
  c: '10000000-0000-4000-8000-000000000003',
  x: '10000000-0000-4000-8000-000000000009',
};

const elements = [
  el(E.single, 'single_choice', {
    isRequired: true,
    options: [opt(O.a, E.single), opt(O.b, E.single)],
  }),
  el(E.multi, 'multi_choice', {
    config: { minSelect: 1, maxSelect: 2 },
    options: [opt(O.a, E.multi), opt(O.b, E.multi), opt(O.c, E.multi)],
  }),
  el(E.text, 'text_question', { config: { maxLength: 10 } }),
  el(E.info, 'info_popup'),
];

const paths = (answers: unknown[]) =>
  checkAnswers(elements, { answers } as never).problems.map((p) => p.path);

describe('checkAnswers', () => {
  it('accepts a valid ballot and normalizes it', () => {
    const { problems, ballot } = checkAnswers(elements, {
      answers: [
        { elementId: E.single, optionIds: [O.b] },
        { elementId: E.multi, optionIds: [O.a, O.c] },
        { elementId: E.text, text: '  ดีมาก  ' },
      ],
    });
    expect(problems).toEqual([]);
    expect(ballot.choices).toHaveLength(3);
    expect(ballot.texts).toEqual([{ elementId: E.text, answer: 'ดีมาก' }]);
  });

  it('requires required questions', () => {
    expect(paths([])).toEqual([`elements.${E.single}`]);
    expect(paths([{ elementId: E.single, optionIds: [] }])).toEqual([
      `elements.${E.single}`,
    ]);
  });

  it('rejects unknown elements, content elements and duplicates', () => {
    expect(
      paths([
        { elementId: E.single, optionIds: [O.a] },
        { elementId: E.info, text: 'x' },
        { elementId: E.single, optionIds: [O.b] },
      ]),
    ).toEqual(['answers.1.elementId', 'answers.2.elementId']);
  });

  it('enforces option ownership and selection counts', () => {
    expect(
      paths([
        { elementId: E.single, optionIds: [O.a, O.b] },
        { elementId: E.multi, optionIds: [O.a, O.b, O.c] },
      ]),
    ).toEqual([
      'answers.0.optionIds',
      'answers.1.optionIds',
      `elements.${E.single}`,
    ]);
    expect(
      paths([
        { elementId: E.single, optionIds: [O.x] },
        { elementId: E.multi, optionIds: [O.a, O.a] },
      ]),
    ).toEqual([
      'answers.0.optionIds',
      'answers.1.optionIds',
      `elements.${E.single}`,
    ]);
  });

  it('checks answer kind and text length', () => {
    expect(
      paths([
        { elementId: E.single, text: 'a' },
        { elementId: E.text, text: 'x'.repeat(11) },
      ]),
    ).toEqual(['answers.0', 'answers.1.text', `elements.${E.single}`]);
  });
});
