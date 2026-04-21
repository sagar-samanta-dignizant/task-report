import type { Task } from "../types/task";

const DRAFT_KEY = "app:draft";

export interface Draft {
  tasks: Task[];
  name: string;
  date: string;
  selectedProjects: string[];
  nextTask: string;
  bulletType: string;
  subIcon: string;
  savedAt: string; // ISO timestamp
}

export const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // quota — silently drop; draft is best-effort
  }
};

export const loadDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tasks)) return null;
    return parsed as Draft;
  } catch {
    return null;
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
};

// A draft is "empty" if there are no tasks with titles and no other meaningful
// content. We don't want to restore an empty draft from a prior save.
export const isDraftEmpty = (d: Draft): boolean => {
  const hasTitle = d.tasks.some((t) => t.title?.trim());
  const hasNext = !!d.nextTask?.trim();
  return !hasTitle && !hasNext;
};
