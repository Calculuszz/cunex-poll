import { isEligible } from './eligibility.js';

const eng2567 = {
  isChulaVerified: true,
  facultyCode: '21',
  studentYear: 2567,
};

describe('isEligible', () => {
  it('lets anyone answer a public poll', () => {
    expect(
      isEligible('public', [], {
        isChulaVerified: false,
        facultyCode: null,
        studentYear: null,
      }),
    ).toBe(true);
  });

  it('matches faculty-only, year-only and faculty+year rules', () => {
    expect(
      isEligible(
        'restricted',
        [{ facultyCode: '21', studentYear: null }],
        eng2567,
      ),
    ).toBe(true);
    expect(
      isEligible(
        'restricted',
        [{ facultyCode: null, studentYear: 2567 }],
        eng2567,
      ),
    ).toBe(true);
    expect(
      isEligible(
        'restricted',
        [{ facultyCode: '21', studentYear: 2566 }],
        eng2567,
      ),
    ).toBe(false);
  });

  it('ORs rules together', () => {
    expect(
      isEligible(
        'restricted',
        [
          { facultyCode: '30', studentYear: null },
          { facultyCode: '21', studentYear: 2567 },
        ],
        eng2567,
      ),
    ).toBe(true);
  });

  it('never lets Google/Email users into restricted polls', () => {
    expect(
      isEligible('restricted', [{ facultyCode: null, studentYear: 2567 }], {
        ...eng2567,
        isChulaVerified: false,
      }),
    ).toBe(false);
  });
});
