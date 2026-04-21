import type { Report } from "../types/task";

const INDEX_KEY = "reports:index";
const keyFor = (date: string) => `reports:${date}`;
const LEGACY_KEY = "reports";

const readIndex = (): string[] => {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeIndex = (dates: string[]) => {
  localStorage.setItem(INDEX_KEY, JSON.stringify(dates));
};

let migrated = false;
const migrateLegacy = () => {
  if (migrated) return;
  migrated = true;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    const existing = new Set(readIndex());
    const newDates: string[] = [];
    for (const [date, data] of Object.entries(parsed)) {
      if (existing.has(date)) continue;
      try {
        localStorage.setItem(keyFor(date), JSON.stringify(data));
        newDates.push(date);
      } catch {
        // quota — stop migrating but keep legacy blob intact
        return;
      }
    }
    if (newDates.length > 0) {
      writeIndex([...Array.from(existing), ...newDates]);
    }
    // keep legacy key as a backup until the user confirms everything looks good
  } catch {
    // ignore
  }
};

export const listReportDates = (): string[] => {
  migrateLegacy();
  const index = readIndex();
  // verify each key still exists (defensive against manual edits)
  return index.filter((d) => localStorage.getItem(keyFor(d)) != null);
};

export const getReport = (date: string): Report | null => {
  migrateLegacy();
  try {
    const raw = localStorage.getItem(keyFor(date));
    if (!raw) return null;
    return JSON.parse(raw) as Report;
  } catch {
    return null;
  }
};

export const getAllReports = (): Array<{ date: string; data: Report }> => {
  const dates = listReportDates();
  const out: Array<{ date: string; data: Report }> = [];
  for (const d of dates) {
    const r = getReport(d);
    if (r) out.push({ date: d, data: r });
  }
  return out;
};

export class QuotaError extends Error {
  constructor() {
    super("Storage quota exceeded. Delete old reports or reduce profile picture size.");
    this.name = "QuotaError";
  }
}

export const saveReport = (date: string, report: Report) => {
  try {
    localStorage.setItem(keyFor(date), JSON.stringify(report));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw new QuotaError();
    }
    throw err;
  }
  const index = readIndex();
  if (!index.includes(date)) writeIndex([...index, date]);
};

export const deleteReport = (date: string) => {
  localStorage.removeItem(keyFor(date));
  const index = readIndex();
  const next = index.filter((d) => d !== date);
  if (next.length !== index.length) writeIndex(next);
};

export const reportExists = (date: string): boolean => {
  return localStorage.getItem(keyFor(date)) != null;
};

export const importReports = (
  entries: Array<{ date: string; data: Report }>,
  overwrite: boolean
): { imported: number; skipped: number } => {
  let imported = 0;
  let skipped = 0;
  for (const { date, data } of entries) {
    if (!overwrite && reportExists(date)) {
      skipped++;
      continue;
    }
    saveReport(date, data);
    imported++;
  }
  return { imported, skipped };
};
