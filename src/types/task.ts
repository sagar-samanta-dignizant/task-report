export interface Subtask {
  uid?: string;
  taskId?: string;
  title: string;
  hours: string | number;
  minutes: string | number;
  status: string;
  icon?: string;
  view?: boolean;
}

export interface Task extends Subtask {
  subtasks?: Subtask[];
}

export interface TaskSettings {
  allowSubtask: boolean;
  showHours: boolean;
  showStatus: boolean;
  showDate: boolean;
  showID: boolean;
  showNextTask: boolean;
  showProject: boolean;
}

export interface PreviewSettings extends TaskSettings {
  hideParentTaskTime?: boolean;
  hideParentTaskStatus?: boolean;
  allowLineAfterWorkUpdate?: boolean;
  lineAfterWorkUpdate?: number;
  allowLineAfterProject?: boolean;
  lineAfterProject?: number;
  allowLineAfterNextTask?: boolean;
  lineAfterNextTask?: number;
  allowLineBeforeClosingText?: boolean;
  lineBeforeClosingText?: number;
}

export interface GenerateSettings {
  taskGap?: number;
  subtaskGap?: number;
  workUpdateText?: string;
  closingText?: string;
  notificationTime?: string;
  draftEnabled?: boolean;
  titleSuggestionsEnabled?: boolean;
}

export interface AllSettings {
  taskSettings: TaskSettings;
  previewSettings: PreviewSettings;
  exportSettings: TaskSettings;
  generateSettings: GenerateSettings;
}

export interface Report {
  date: string;
  tasks: Task[];
  selectedProjects: string[];
  name?: string;
  nextTask?: string;
  bulletType: string;
  subIcon: string;
}

export type PreviewFormat = "plain" | "markdown" | "slack";

export interface TaskTemplate {
  id: string;
  name: string;
  createdAt: string;
  tasks: Task[];
  selectedProjects?: string[];
  bulletType?: string;
  subIcon?: string;
}
