import { getAllReports } from "./reportsStore";

export interface TitleHistoryEntry {
  title: string;
  count: number;
}

// Build a de-duplicated, usage-ranked list of task + subtask titles from every
// saved report. Case-insensitive grouping, keeping the most common casing.
export const computeTitleHistory = (): TitleHistoryEntry[] => {
  const reports = getAllReports();
  // Map<lowercased, { count, variants: Map<casing, count> }>
  const groups = new Map<string, { count: number; variants: Map<string, number> }>();

  const bump = (rawTitle: string | undefined) => {
    if (!rawTitle) return;
    const trimmed = rawTitle.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    let g = groups.get(key);
    if (!g) {
      g = { count: 0, variants: new Map() };
      groups.set(key, g);
    }
    g.count += 1;
    g.variants.set(trimmed, (g.variants.get(trimmed) || 0) + 1);
  };

  for (const { data } of reports) {
    for (const task of data.tasks || []) {
      bump(task.title);
      for (const sub of task.subtasks || []) {
        bump(sub.title);
      }
    }
  }

  const entries: TitleHistoryEntry[] = [];
  for (const [, g] of groups) {
    let best = "";
    let bestCount = -1;
    for (const [casing, c] of g.variants) {
      if (c > bestCount) {
        best = casing;
        bestCount = c;
      }
    }
    entries.push({ title: best, count: g.count });
  }

  entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.title.localeCompare(b.title);
  });

  return entries;
};
