import { z } from 'zod';

// Request schema for POST /polls and PUT /polls/:id (see docs/api-endpoints.md §4).
// Drafts may be incomplete; `submit` runs the stricter completeness checks.

const text = (max: number) => z.string().trim().max(max);

// Optional fields accept null as well as a missing key (the web app sends
// null for empty inputs); both are stored as "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  schema.nullish().transform((v) => v ?? undefined);

// A publicUrl from POST /images/uploads; the API checks it points into our bucket.
const imageUrl = z.url().max(500);

// buttonText left out → the web app shows its default label.
const popupSchema = z.object({
  buttonText: optional(text(50)),
  title: text(200).min(1),
  body: text(5000).min(1),
});

const optionSchema = z.object({
  label: text(300).min(1),
  description: text(1000).nullish(),
  imageUrl: imageUrl.nullish(),
  imageAlt: text(300).nullish(),
  popup: popupSchema.nullish(),
});

const layout = z.enum(['list', 'grid']).default('list');
const title = text(500)
  .nullish()
  .transform((v) => v ?? '');
const isRequired = z
  .boolean()
  .nullish()
  .transform((v) => v ?? false);

const textQuestion = z.object({
  type: z.literal('text_question'),
  title,
  isRequired,
  config: z
    .object({
      placeholder: optional(text(200)),
      maxLength: z
        .int()
        .min(1)
        .max(5000)
        .nullish()
        .transform((v) => v ?? 1000),
    })
    .prefault({}),
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
        minSelect: optional(z.int().min(1)),
        maxSelect: optional(z.int().min(1)),
      })
      .prefault({}),
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
      .array(z.object({ heading: optional(text(200)), body: text(5000) }))
      .min(1)
      .max(20),
  }),
});

const image = z.object({
  type: z.literal('image'),
  title,
  config: z.object({
    url: imageUrl,
    alt: optional(text(300)),
    caption: optional(text(300)),
  }),
});

const infoPopup = z.object({
  type: z.literal('info_popup'),
  title,
  config: popupSchema.extend({ imageUrl: optional(imageUrl) }),
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

// public = anyone logged in · chula = any CUNEX-verified user
// restricted = CUNEX-verified users matching a faculty/entry-year rule
const audienceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('public') }),
  z.object({ type: z.literal('chula') }),
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
  // null = voting starts as soon as the owner publishes
  opensAt: z.iso.datetime({ offset: true }).nullish(),
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
