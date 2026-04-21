import type { Task, TaskTemplate } from "../types/task";
import { newUid } from "./uid";

const KEY = "app:templates";

export const loadTemplates = (): TaskTemplate[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is TaskTemplate =>
        t &&
        typeof t.id === "string" &&
        typeof t.name === "string" &&
        Array.isArray(t.tasks)
    );
  } catch {
    return [];
  }
};

export const saveTemplates = (list: TaskTemplate[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // quota — drop silently; the UI can still show the in-memory list
  }
};

export const addTemplate = (t: TaskTemplate): TaskTemplate[] => {
  const next = [...loadTemplates(), t];
  saveTemplates(next);
  return next;
};

export const deleteTemplate = (id: string): TaskTemplate[] => {
  const next = loadTemplates().filter((t) => t.id !== id);
  saveTemplates(next);
  return next;
};

export const renameTemplate = (id: string, name: string): TaskTemplate[] => {
  const next = loadTemplates().map((t) => (t.id === id ? { ...t, name } : t));
  saveTemplates(next);
  return next;
};

export const duplicateTemplate = (id: string): TaskTemplate[] => {
  const list = loadTemplates();
  const src = list.find((t) => t.id === id);
  if (!src) return list;
  const copy: TaskTemplate = {
    ...src,
    id: newUid(),
    name: `${src.name} (copy)`,
    createdAt: new Date().toISOString(),
  };
  const next = [...list, copy];
  saveTemplates(next);
  return next;
};

export const getTemplate = (id: string): TaskTemplate | undefined =>
  loadTemplates().find((t) => t.id === id);

interface CaptureInput {
  tasks: Task[];
  selectedProjects?: string[];
  bulletType?: string;
  subIcon?: string;
}

// Take the current form and turn it into a template. Drops tasks with empty
// titles and strips any date-specific values (view toggle, hours) — actually,
// we keep hours/minutes so common "3h design / 2h review" patterns survive.
export const captureTemplate = (
  name: string,
  input: CaptureInput
): TaskTemplate => {
  const cleanTasks: Task[] = input.tasks
    .filter((t) => t.title?.trim())
    .map((t) => ({
      uid: newUid(),
      taskId: t.taskId?.toString().trim() || "",
      title: t.title.trim(),
      hours: t.hours,
      minutes: t.minutes,
      status: t.status,
      icon: t.icon,
      view: true,
      subtasks: t.subtasks
        ?.filter((s) => s.title?.trim())
        .map((s) => ({
          uid: newUid(),
          taskId: s.taskId?.toString().trim() || "",
          title: s.title.trim(),
          hours: s.hours,
          minutes: s.minutes,
          status: s.status,
          icon: s.icon,
          view: true,
        })),
    }));

  return {
    id: newUid(),
    name: name.trim() || "Untitled template",
    createdAt: new Date().toISOString(),
    tasks: cleanTasks,
    selectedProjects: input.selectedProjects,
    bulletType: input.bulletType,
    subIcon: input.subIcon,
  };
};
