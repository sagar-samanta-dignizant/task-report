export type StatusKind = "success" | "info" | "warning" | "danger" | "muted";

export interface StatusPalette {
  kind: StatusKind;
  bg: string;
  text: string;
  border: string;
}

const PALETTES: Record<StatusKind, StatusPalette> = {
  success: {
    kind: "success",
    bg: "var(--status-success-bg)",
    text: "var(--status-success-text)",
    border: "var(--status-success-border)",
  },
  info: {
    kind: "info",
    bg: "var(--status-info-bg)",
    text: "var(--status-info-text)",
    border: "var(--status-info-border)",
  },
  warning: {
    kind: "warning",
    bg: "var(--status-warning-bg)",
    text: "var(--status-warning-text)",
    border: "var(--status-warning-border)",
  },
  danger: {
    kind: "danger",
    bg: "var(--status-danger-bg)",
    text: "var(--status-danger-text)",
    border: "var(--status-danger-border)",
  },
  muted: {
    kind: "muted",
    bg: "var(--status-muted-bg)",
    text: "var(--status-muted-text)",
    border: "var(--status-muted-border)",
  },
};

const STATUS_KIND: Record<string, StatusKind> = {
  Completed: "success",
  Fixed: "success",
  "In Progress": "info",
  "In Review": "warning",
  "In Testing": "warning",
  "In Design": "warning",
  Hold: "muted",
  None: "muted",
  "Not Fixed": "danger",
  "Reported Issue": "danger",
};

export const getStatusPalette = (status: string | undefined | null): StatusPalette => {
  if (!status) return PALETTES.muted;
  const kind = STATUS_KIND[status] ?? "muted";
  return PALETTES[kind];
};
