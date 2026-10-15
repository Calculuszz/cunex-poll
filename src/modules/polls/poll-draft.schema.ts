import { z } from 'zod';

// Request schema for POST /polls and PUT /polls/:id (see docs/api-endpoints.md §4).
// Drafts may be incomplete; `submit` runs the stricter completeness checks.

const text = (max: number) => z.string().trim().max(max);

const popupSchema = z.object({
  buttonText: text(50).min(1),
  title: text(200).min(1),
  body: text(5000).min(1),
});

// A publicUrl from POST /images/uploads; the API checks it points into our bucket.
const imageUrl = z.url().max(500);

const optionSchema = z.object({
  label: text(300).min(1),
  description: text(1000).nullish(),
  imageUrl: imageUrl.nullish(),
  popup: popupSchema.nullish(),
});

const layout = z.enum(['list', 'grid']).default('list');
const title = text(500).default('');
const isRequired = z.boolean().default(false);

const textQuestion = z.object({
  type: z.literal('text_question'),
  title,
  isRequired,
  config: z
    .object({
      placeholder: text(200).optional(),
      maxLength: z.int().min(1).max(5000).default(1000),
    })
    .default({ maxLength: 1000 }),
});

const singleChoice = z.object({
  type: z.literal('single_choice'),
  title,
  isRequired,
  config: z.object({ layout }).default({ layout: 'list' }),
  options: z.array(optionSchema).max(50).default([]),
});

const multiChoice = z
  .object({
    type: z.literal('multi_choice'),
    title,
    isRequired,
    config: z
      .object({
        layout,
        minSelect: z.int().min(1).optional(),
        maxSelect: z.int().min(1).optional(),
      })
      .default({ layout: 'list' }),
    options: z.array(optionSchema).max(50).default([]),
  })
  .refine(
    (e) =>
      e.config.minSelect === undefined ||
      e.config.maxSelect === undefined ||
      e.config.minSelect <= e.config.maxSelect,
    {
      message: 'minSelect must be <= maxSelect',
      path: ['config', 'minSelect'],
    },
  );

const dropdown = z.object({
  type: z.literal('dropdown'),
  title,
  isRequired,
  config: z.object({}).default({}),
  options: z.array(optionSchema).max(200).default([]),
});

const description = z.object({
  type: z.literal('description'),
  title,
  config: z.object({
    showHeading: z.boolean().default(true),
    sections: z
      .array(z.object({ heading: text(200).optional(), body: text(5000) }))
      .min(1)
      .max(20),
  }),
});

const image = z.object({
  type: z.literal('image'),
  title,
  config: z.object({ url: imageUrl, caption: text(300).optional() }),
});

const infoPopup = z.object({
  type: z.literal('info_popup'),
  title,
  config: popupSchema,
});

const accordion = z.object({
  type: z.literal('accordion'),
  title,
  config: z.object({ title: text(200).min(1), body: text(5000).min(1) }),
});

const pageBreak = z.object({
  type: z.literal('page_break'),
  config: z.object({}).default({}),
});

export const elementSchema = z.discriminatedUnion('type', [
  textQuestion,
  singleChoice,
  multiChoice,
  dropdown,
  description,
  image,
  infoPopup,
  accordion,
  pageBreak,
]);

export type ElementInput = z.infer<typeof elementSchema>;
export type ElementType = ElementInput['type'];

export const QUESTION_TYPES = new Set<ElementType>([
  'text_question',
  'single_choice',
  'multi_choice',
  'dropdown',
]);

const audienceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('public') }),
  z.object({
    type: z.literal('restricted'),
    rules: z
      .array(
        z
          .object({
            facultyCode: z
              .string()
              .regex(/^\d{2}$/)
              .nullish(),
            studentYear: z.int().min(2400).max(2700).nullish(),
          })
          .refine((r) => r.facultyCode != null || r.studentYear != null, {
            message: 'a rule needs facultyCode or studentYear',
          }),
      )
      .min(1)
      .max(100),
  }),
]);

export const pollDraftSchema = z.object({
  title: text(200).default(''),
  description: text(5000).default(''),
  coverImageUrl: imageUrl.nullish(),
  closesAt: z.iso.datetime({ offset: true }).nullish(),
  audience: audienceSchema.default({ type: 'public' }),
  settings: z
    .object({
      showResultsRealtime: z.boolean().default(false),
      allowAnswerEdit: z.boolean().default(false),
      listedPublicly: z.boolean().default(false),
    })
    .default({
      showResultsRealtime: false,
      allowAnswerEdit: false,
      listedPublicly: false,
    }),
  elements: z.array(elementSchema).max(200).default([]),
});

export type PollDraftInput = z.infer<typeof pollDraftSchema>;
