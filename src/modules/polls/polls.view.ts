import { type PollDraftInput, pollDraftSchema } from './poll-draft.schema.js';
import type { PollAggregate, PollRow } from './polls.repository.js';

export interface MyBallot {
  submitted: boolean;
  canEdit: boolean;
}

export interface PollSummary {
  id: string;
  status: PollRow['status'];
  title: string;
  description: string;
  coverImageUrl: string | null;
  audience: PollRow['audience'];
  closesAt: Date | null;
  openedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  myBallot?: MyBallot;
}

export function toSummary(p: PollRow, myBallot?: MyBallot): PollSummary {
  return {
    id: p.id,
    status: p.status,
    title: p.title,
    description: p.description,
    coverImageUrl: p.coverImageUrl,
    audience: p.audience,
    closesAt: p.closesAt,
    openedAt: p.openedAt,
    closedAt: p.closedAt,
    createdAt: p.createdAt,
    ...(myBallot ? { myBallot } : {}),
  };
}

export function toDetail(
  agg: PollAggregate,
  ctx: {
    isOwner: boolean;
    canSeeReviews: boolean;
    myBallot: MyBallot;
    canViewResults: boolean;
  },
) {
  const { poll } = agg;
  return {
    id: poll.id,
    status: poll.status,
    version: poll.version,
    title: poll.title,
    description: poll.description,
    coverImageUrl: poll.coverImageUrl,
    closesAt: poll.closesAt,
    submittedAt: poll.submittedAt,
    openedAt: poll.openedAt,
    closedAt: poll.closedAt,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    audience:
      poll.audience === 'public'
        ? { type: 'public' as const }
        : { type: 'restricted' as const, rules: agg.rules },
    settings: {
      showResultsRealtime: poll.showResultsRealtime,
      allowAnswerEdit: poll.allowAnswerEdit,
      listedPublicly: poll.listedPublicly,
    },
    shareUrl: poll.shareUrl,
    elements: agg.elements.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      isRequired: e.isRequired,
      config: e.config,
      ...(hasOptions(e.type)
        ? {
            options: e.options.map((o) => ({
              id: o.id,
              label: o.label,
              description: o.description,
              imageUrl: o.imageUrl,
              popup: o.popup,
            })),
          }
        : {}),
    })),
    isOwner: ctx.isOwner,
    myBallot: ctx.myBallot,
    canViewResults: ctx.canViewResults,
    ...(ctx.canSeeReviews ? { reviews: agg.reviews } : {}),
  };
}

/** Stored poll → the same shape the editor sends, re-validated by the schema. */
export function toDraftInput(agg: PollAggregate): PollDraftInput {
  const { poll } = agg;
  return pollDraftSchema.parse({
    title: poll.title,
    description: poll.description,
    coverImageUrl: poll.coverImageUrl,
    closesAt: poll.closesAt?.toISOString() ?? null,
    audience:
      poll.audience === 'public'
        ? { type: 'public' }
        : { type: 'restricted', rules: agg.rules },
    settings: {
      showResultsRealtime: poll.showResultsRealtime,
      allowAnswerEdit: poll.allowAnswerEdit,
      listedPublicly: poll.listedPublicly,
    },
    elements: agg.elements.map((e) => ({
      type: e.type,
      title: e.title,
      isRequired: e.isRequired,
      config: e.config,
      ...(hasOptions(e.type)
        ? {
            options: e.options.map((o) => ({
              label: o.label,
              description: o.description,
              imageUrl: o.imageUrl,
              popup: o.popup,
            })),
          }
        : {}),
    })),
  });
}

function hasOptions(type: string) {
  return (
    type === 'single_choice' || type === 'multi_choice' || type === 'dropdown'
  );
}
