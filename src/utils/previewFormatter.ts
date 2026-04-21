import { getBullet } from "./icon.utils";
import { reverseDate } from "./dateUtils";
import type {
  Report,
  Subtask,
  Task,
  PreviewSettings,
  PreviewFormat,
  GenerateSettings,
} from "../types/task";

export const formatTaskTime = (
  hours: string | number,
  minutes: string | number,
  subtasks?: Subtask[]
): string => {
  if (subtasks && subtasks.length > 0) {
    const totals = subtasks.reduce(
      (sum, s) => ({
        hours: sum.hours + (parseInt(s.hours as string, 10) || 0),
        minutes: sum.minutes + (parseInt(s.minutes as string, 10) || 0),
      }),
      { hours: 0, minutes: 0 }
    );
    const m = totals.minutes % 60;
    const h = totals.hours + Math.floor(totals.minutes / 60);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(" ").trim();
  }
  const h = parseInt(hours as string, 10) || 0;
  const m = parseInt(minutes as string, 10) || 0;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(" ").trim();
};

interface FormatOptions {
  report: Omit<Report, "bulletType" | "subIcon"> & {
    bulletType: string;
    subIcon: string;
  };
  previewSettings: PreviewSettings;
  generateSettings: GenerateSettings;
  format?: PreviewFormat;
}

// Style decorators per format. Everything else (date header, project line,
// closing, spacing, visibility filters) is shared across all three formats.
const decorate = (format: PreviewFormat) => {
  switch (format) {
    case "markdown":
      return {
        title: (t: string) => `**${t}**`,
        status: (s: string) => ` *(${s})*`,
        time: (t: string) => ` · ${t}`,
      };
    case "slack":
      return {
        title: (t: string) => `*${t}*`,
        status: (s: string) => ` _(${s})_`,
        time: (t: string) => ` · ${t}`,
      };
    case "plain":
    default:
      return {
        title: (t: string) => t,
        status: (s: string) => ` (${s})`,
        time: (t: string) => ` (${t})`,
      };
  }
};

export const formatPreview = ({
  report,
  previewSettings,
  generateSettings,
  format = "plain",
}: FormatOptions): string => {
  const { tasks, selectedProjects, date, name, nextTask, bulletType, subIcon } =
    report;

  const taskGap = generateSettings.taskGap || 1;
  const subtaskGap = generateSettings.subtaskGap || 1;
  const workUpdateText = generateSettings.workUpdateText || "Today's work update -";
  const closingText = generateSettings.closingText || "Thanks & regards";

  const lineAfterWorkUpdate = previewSettings.allowLineAfterWorkUpdate
    ? "-".repeat(previewSettings.lineAfterWorkUpdate || 3)
    : "";
  const lineAfterProject = previewSettings.allowLineAfterProject
    ? "-".repeat(previewSettings.lineAfterProject || 3)
    : "";
  const lineAfterNextTask = previewSettings.allowLineAfterNextTask
    ? "-".repeat(previewSettings.lineAfterNextTask || 3)
    : "";
  const lineBeforeClosingText = previewSettings.allowLineBeforeClosingText
    ? "-".repeat(previewSettings.lineBeforeClosingText || 3)
    : "";

  const deco = decorate(format);
  // Markdown + Slack use a stable bullet so the output parses predictably.
  // Plain keeps the legacy behaviour: top-level tasks use the chosen bullet,
  // subtask bullets come from per-task `task.icon` injection inside formatLine.
  const taskBullet = (index: number): string => {
    if (format === "markdown") return "- ";
    if (format === "slack") return "• ";
    return getBullet(bulletType, index);
  };
  const subtaskBulletPrefix = (): string => {
    if (format === "markdown") return "  - ";
    if (format === "slack") return "  • ";
    return ""; // plain: legacy — per-task icon handled in formatLine
  };

  const formatLine = (task: Task | Subtask, index: number, isSubtask = false) => {
    let line = "";
    if (previewSettings.showID && task.taskId) {
      line += `ID : ${String(task.taskId).trim()} `;
    }
    // In Plain mode, preserve the legacy behaviour where an individual task
    // can override its rendered icon. Markdown/Slack ignore per-task icons.
    if (format === "plain" && task.icon) {
      const icon = isSubtask ? getBullet(subIcon, index) : task.icon;
      line += `  ${icon}`;
    }
    line += deco.title(task.title.trim());
    const subs = (task as Task).subtasks;
    if (
      previewSettings.showStatus &&
      task?.status?.trim() &&
      !(previewSettings.hideParentTaskStatus && (subs?.length ?? 0) > 0)
    ) {
      line += deco.status(task.status.trim());
    }
    if (
      previewSettings.showHours &&
      !(previewSettings.hideParentTaskTime && (subs?.length ?? 0) > 0)
    ) {
      const taskTime = formatTaskTime(task.hours, task.minutes, subs);
      if (taskTime) line += deco.time(taskTime);
    }
    return line;
  };

  const formatTasks = (list: Task[], level = 0): string =>
    list
      .filter((t) => t.view !== false)
      .map((task, index) => {
        const indent = "  ".repeat(level);
        let line = `${indent}${taskBullet(index)}${formatLine(task, index)}`;
        if (previewSettings.allowSubtask && task.subtasks && task.subtasks.length > 0) {
          const filtered = task.subtasks.filter(
            (s) => s.title.trim() && s.view !== false
          );
          if (filtered.length > 0) {
            const subPrefix = subtaskBulletPrefix();
            line += `\n${filtered
              .map((s, i) => `${subPrefix}${formatLine(s, i, true)}`)
              .join("\n".repeat(subtaskGap))}`;
          }
        }
        return line;
      })
      .join("\n".repeat(taskGap));

  const visibleTasks = tasks.filter((t) => t.title.trim() && t.view !== false);

  const lines = [
    `${workUpdateText}${previewSettings.showDate ? " " + reverseDate(date) : ""}`,
    lineAfterWorkUpdate,
    previewSettings.showProject
      ? `Project : ${
          selectedProjects.map((p) => p.trim()).join(" & ") || "Not Selected"
        }`
      : "",
    previewSettings.allowLineAfterProject ? lineAfterProject : "",
    !previewSettings.allowLineAfterProject ? "" : "",
    formatTasks(visibleTasks),
    previewSettings.showNextTask && nextTask?.trim()
      ? `\nNext's Tasks\n${lineAfterNextTask}\n=> ${nextTask.trim()}`
      : "",
    lineBeforeClosingText,
    closingText,
    (name || "").trim(),
  ]
    .filter((line, idx) => {
      if (idx === 4 && !previewSettings.allowLineAfterProject) return true;
      return line && line.trim() !== "";
    })
    .join("\n");

  return lines;
};
