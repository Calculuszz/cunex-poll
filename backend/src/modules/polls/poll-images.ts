import type { PollDraftInput } from './poll-draft.schema.js';

export interface ImageRef {
  /** Where the URL sits in the draft, e.g. `elements.2.options.0.imageUrl` */
  path: string;
  url: string;
}

/** Every image URL a draft uses: cover, image elements, popups, option images. */
export function imageRefs(draft: PollDraftInput): ImageRef[] {
  const refs: ImageRef[] = [];
  if (draft.coverImageUrl) {
    refs.push({ path: 'coverImageUrl', url: draft.coverImageUrl });
  }
  draft.elements.forEach((el, i) => {
    if (el.type === 'image') {
      refs.push({ path: `elements.${i}.config.url`, url: el.config.url });
    }
    if (el.type === 'info_popup' && el.config.imageUrl) {
      refs.push({
        path: `elements.${i}.config.imageUrl`,
        url: el.config.imageUrl,
      });
    }
    if ('options' in el) {
      el.options.forEach((o, j) => {
        if (o.imageUrl) {
          refs.push({
            path: `elements.${i}.options.${j}.imageUrl`,
            url: o.imageUrl,
          });
        }
      });
    }
  });
  return refs;
}
