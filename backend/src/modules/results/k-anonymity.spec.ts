import { applyKAnonymity, type GroupCounts } from './k-anonymity.js';

const g = (group: string, total: number, aCount = total): GroupCounts => ({
  group,
  total,
  counts: new Map([['q', new Map([['a', aCount]])]]),
});

describe('applyKAnonymity', () => {
  it('shows groups at or above k as they are', () => {
    expect(applyKAnonymity([g('21', 5), g('30', 9)], 5)).toEqual([
      {
        group: '21',
        total: 5,
        elements: [{ elementId: 'q', options: [{ optionId: 'a', count: 5 }] }],
      },
      {
        group: '30',
        total: 9,
        elements: [{ elementId: 'q', options: [{ optionId: 'a', count: 9 }] }],
      },
    ]);
  });

  it('merges small groups into "other" when the merge reaches k', () => {
    const out = applyKAnonymity([g('21', 10), g('22', 3), g('23', 2)], 5);
    expect(out[1]).toEqual({
      group: 'other',
      total: 5,
      elements: [{ elementId: 'q', options: [{ optionId: 'a', count: 5 }] }],
    });
  });

  it('hides "other" entirely when even the merge is below k', () => {
    const out = applyKAnonymity([g('21', 10), g('22', 1), g('23', 2)], 5);
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ group: 'other', hidden: true });
  });
});
