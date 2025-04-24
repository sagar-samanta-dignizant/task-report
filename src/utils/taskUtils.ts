/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getBullet } from "./icon.utils";
import moment from "moment";

interface Task {
  id: number;
  taskId: string | number;
  title: string;
  hours: string | number;
  minutes: string | number; // Add minutes field
  status: string;
}
export const calculateRemainingTime = (
  tasks: Task[],
  workingTimeLimit: number
) => {
  const totalTaskTime = tasks.reduce((sum, task) => {
    const taskHours = parseFloat(task.hours as string) || 0;
    const taskMinutes = (parseFloat(task.minutes as string) || 0) / 60; // Convert minutes to hours
    return sum + taskHours + taskMinutes;
  }, 0);
  return workingTimeLimit - totalTaskTime;
};

export const formatRemainingTime = (remainingTime: number) => {
  const hours = Math.floor(remainingTime);
  const minutes = Math.round((remainingTime - hours) * 60);
  return `${hours}h and ${minutes}m`;
};

export const formatTaskTime = (
  hours: string | number,
  minutes: string | number
) => {
  const h = parseInt(hours as string) || 0;
  const m = parseInt(minutes as string) || 0;
  let timeString = "";
  if (h > 0) timeString += `${h}h`; // Only include hours if greater than 0
  if (m > 0) timeString += ` ${m}min`; // Only include minutes if greater than 0
  return timeString.trim(); // Remove any leading/trailing spaces
};

export const getFormattedPreview = (
  tasks: Task[],
  settings: any,
  date: string,
  selectedProjects: string[],
  nextTaskValue: string,
  name: string,
  bulletType: string
) => {
  const formatLine = (task: Task, _: number) => {
    let line = "";
    if (settings.showID && task.taskId) {
      line += `ID: ${task.taskId.toString().trim()} - `; // Trim Task ID
    }
    line += task.title.trim(); // Trim Title
    if (settings.showStatus && task?.status)
      line += ` (${task?.status.trim()})`; // Trim Status
    if (settings.showHours) {
      const taskTime = formatTaskTime(task.hours, task.minutes);
      if (taskTime) line += ` (${taskTime})`; // Only include time if it's not empty
    }
    return line;
  };

  const formatTasks = (tasks: Task[]) =>
    tasks
      .map(
        (task, index) =>
          `${getBullet(bulletType, index)}${formatLine(task, index)}`
      )
      .join("\n");

  return `Today's work update - ${
    settings.showDate ? moment(date).format("YYYY-MM-DD") || "YYYY-MM-DD" : ""
  }

${
  settings.showProject
    ? `Project : ${
        selectedProjects.map((p) => p.trim()).join(" & ") || "Not Selected"
      }\n---------------------\n`
    : ""
}${formatTasks(tasks)}${
    settings.showNextTask && nextTaskValue.trim()
      ? `\nNext's Tasks\n---------------------\n=> ${nextTaskValue.trim()}`
      : ""
  }

Thanks & regards
${name.trim()}`;
};
