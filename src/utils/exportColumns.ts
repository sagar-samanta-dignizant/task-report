import type { Report, Task } from "../types/task";

export type ExportColumnKey = "date" | "id" | "task" | "status" | "time" | "project";

export interface ExportColumn {
  key: ExportColumnKey;
  label: string;
  toggleKey: keyof {
    showID: boolean;
    showDate: boolean;
    showStatus: boolean;
    showHours: boolean;
    showProject: boolean;
  } | null;
  widthMm?: number; // PDF hint
}

export const ALL_COLUMNS: ExportColumn[] = [
  { key: "date", label: "Date", toggleKey: "showDate", widthMm: 26 },
  { key: "id", label: "ID", toggleKey: "showID", widthMm: 22 },
  { key: "task", label: "Task", toggleKey: null }, // always on
  { key: "status", label: "Status", toggleKey: "showStatus", widthMm: 28 },
  { key: "time", label: "Time", toggleKey: "showHours", widthMm: 24 },
  { key: "project", label: "Project", toggleKey: "showProject", widthMm: 32 },
];

export const DEFAULT_COLUMN_ORDER: ExportColumnKey[] = [
  "date",
  "id",
  "task",
  "status",
  "time",
  "project",
];

// Resolve the active column order from stored settings, falling back to default
// and ensuring every known column is represented exactly once.
export const resolveColumnOrder = (stored?: string[]): ExportColumnKey[] => {
  const known = new Set<ExportColumnKey>(DEFAULT_COLUMN_ORDER);
  const out: ExportColumnKey[] = [];
  if (Array.isArray(stored)) {
    for (const key of stored) {
      if (known.has(key as ExportColumnKey) && !out.includes(key as ExportColumnKey)) {
        out.push(key as ExportColumnKey);
      }
    }
  }
  for (const key of DEFAULT_COLUMN_ORDER) {
    if (!out.includes(key)) out.push(key);
  }
  return out;
};

// Given a column list + toggle settings, return only the columns the user has
// enabled. `task` is always enabled (you can't export a report without task titles).
export const filterEnabledColumns = (
  order: ExportColumnKey[],
  toggles: Record<string, boolean>
): ExportColumn[] =>
  order
    .map((key) => ALL_COLUMNS.find((c) => c.key === key)!)
    .filter((col) => col.toggleKey == null || toggles[col.toggleKey] === true);

const formatDateDMY = (yyyyMmDd: string): string => {
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}/${m}/${y}`;
};

const timeCell = (h: string | number, m: string | number) =>
  `${h || 0}h ${m || 0}m`;

// Build one row per task (and optionally per subtask), keyed by column.
export const buildRows = (
  report: Report,
  opts: { includeSubtasks: boolean; includeNextTask: boolean }
): Record<ExportColumnKey, string>[] => {
  const rows: Record<ExportColumnKey, string>[] = [];
  const tasks = report.tasks || [];
  const projectLabel = (report.selectedProjects || []).join(" & ");
  let firstInReport = true;

  const push = (task: Task, isSubtask: boolean, parentProject: string) => {
    rows.push({
      date: firstInReport ? formatDateDMY(report.date) : "",
      id: String(task.taskId || ""),
      task: isSubtask ? `  ↳ ${task.title || ""}` : task.title || "",
      status: String(task.status || ""),
      time: timeCell(task.hours, task.minutes),
      project: firstInReport ? parentProject : "",
    });
    firstInReport = false;
  };

  tasks.forEach((task) => {
    push(task, false, projectLabel);
    if (opts.includeSubtasks && task.subtasks?.length) {
      task.subtasks.forEach((s) => push(s as Task, true, projectLabel));
    }
  });

  if (opts.includeNextTask && report.nextTask?.trim()) {
    rows.push({
      date: "",
      id: "",
      task: `Next: ${report.nextTask.trim()}`,
      status: "",
      time: "",
      project: "",
    });
  }

  return rows;
};

// CSV escape — wrap in quotes if the field contains ", comma, or newline.
const csvEscape = (s: string) => {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const rowsToCsv = (
  rows: Record<ExportColumnKey, string>[],
  columns: ExportColumn[]
): string => {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const body = rows
    .map((r) => columns.map((c) => csvEscape(r[c.key] || "")).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
};
