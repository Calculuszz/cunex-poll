export interface GroupCounts {
  group: string;
  total: number;
  /** elementId → optionId → count */
  counts: Map<string, Map<string, number>>;
}

export type GroupView =
  | {
      group: string;
      total: number;
      elements: {
        elementId: string;
        options: { optionId: string; count: number }[];
      }[];
    }
  | { group: 'other'; hidden: true };

/**
 * Groups with fewer than `k` ballots are merged into "other", so a small
 * faculty or year can't be read off individually. If "other" is itself still
 * smaller than k, it is reported as hidden with no numbers at all.
 */
export function applyKAnonymity(groups: GroupCounts[], k: number): GroupView[] {
  const shown: GroupView[] = [];
  const other: GroupCounts = { group: 'other', total: 0, counts: new Map() };

  for (const g of groups) {
    if (g.total >= k && g.group !== 'other') {
      shown.push(toView(g));
      continue;
    }
    other.total += g.total;
    for (const [elementId, options] of g.counts) {
      const into = other.counts.get(elementId) ?? new Map<string, number>();
      for (const [optionId, n] of options) {
        into.set(optionId, (into.get(optionId) ?? 0) + n);
      }
      other.counts.set(elementId, into);
    }
  }

  if (other.total > 0) {
    shown.push(
      other.total >= k ? toView(other) : { group: 'other', hidden: true },
    );
  }
  return shown;
}

function toView(g: GroupCounts): GroupView {
  return {
    group: g.group,
    total: g.total,
    elements: [...g.counts].map(([elementId, options]) => ({
      elementId,
      options: [...options].map(([optionId, count]) => ({ optionId, count })),
    })),
  };
}
