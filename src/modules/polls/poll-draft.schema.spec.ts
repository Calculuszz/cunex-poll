import { pollDraftSchema } from './poll-draft.schema.js';

describe('pollDraftSchema', () => {
  it('accepts an empty draft and fills defaults', () => {
    const draft = pollDraftSchema.parse({});
    expect(draft).toMatchObject({
      title: '',
      audience: { type: 'public' },
      settings: {
        showResultsRealtime: false,
        allowAnswerEdit: false,
        listedPublicly: false,
      },
      elements: [],
    });
  });

  it('accepts every element type from the design', () => {
    const result = pollDraftSchema.safeParse({
      title: 'ธีมงาน',
      audience: {
        type: 'restricted',
        rules: [{ facultyCode: '21' }, { studentYear: 2567 }],
      },
      elements: [
        { type: 'text_question', title: 'ข้อเสนอแนะ' },
        {
          type: 'single_choice',
          title: 'อยากให้ธีมงานปีนี้เป็นแบบไหน',
          isRequired: true,
          options: [
            { label: 'ย้อนยุคสยาม' },
            {
              label: 'แสงสีร่วมสมัย',
              popup: { buttonText: 'ดู', title: 't', body: 'b' },
            },
          ],
        },
        {
          type: 'multi_choice',
          options: [{ label: 'a' }],
          config: { layout: 'grid', maxSelect: 2 },
        },
        { type: 'dropdown', options: [{ label: 'a' }] },
        {
          type: 'description',
          config: { sections: [{ heading: 'h', body: 'b' }] },
        },
        {
          type: 'image',
          config: {
            url: 'https://storage.example/pollcunex-images/images/6f1c1f9e-3b0e-4d8f-9a55-0d6a3c7f2b11.png',
            caption: 'c',
          },
        },
        {
          type: 'info_popup',
          config: { buttonText: 'อ่าน', title: 't', body: 'b' },
        },
        { type: 'accordion', config: { title: 't', body: 'b' } },
        { type: 'page_break' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown element type', () => {
    const result = pollDraftSchema.safeParse({ elements: [{ type: 'swipe' }] });
    expect(result.success).toBe(false);
  });

  it('strips isRequired from content elements instead of trusting it', () => {
    const draft = pollDraftSchema.parse({
      elements: [{ type: 'page_break', isRequired: true }],
    });
    expect(draft.elements[0]).not.toHaveProperty('isRequired');
  });

  it('rejects minSelect > maxSelect', () => {
    const result = pollDraftSchema.safeParse({
      elements: [
        { type: 'multi_choice', config: { minSelect: 3, maxSelect: 1 } },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an audience rule with neither faculty nor year', () => {
    const result = pollDraftSchema.safeParse({
      audience: { type: 'restricted', rules: [{}] },
    });
    expect(result.success).toBe(false);
  });

  it('trims text and enforces limits', () => {
    expect(pollDraftSchema.parse({ title: '  ธีม  ' }).title).toBe('ธีม');
    expect(pollDraftSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(
      false,
    );
  });
});
