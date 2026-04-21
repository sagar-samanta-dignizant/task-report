import { newUid } from "./uid";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};
export const WEEKDAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"];
export const WEEKENDS: DayOfWeek[] = ["sat", "sun"];

export interface NotificationRule {
  id: string;
  enabled: boolean;
  label?: string;
  message: string;
  time: string; // "HH:mm" 24h
  days: DayOfWeek[];
}

const LIST_KEY = "app:notifications";
const FIRED_KEY = "app:notifications-fired"; // map { "<id>": "YYYY-MM-DD" }

export const createEmptyRule = (): NotificationRule => ({
  id: newUid(),
  enabled: true,
  label: "",
  message: "Time to wrap up your update.",
  time: "18:00",
  days: [...WEEKDAYS],
});

export const loadRules = (): NotificationRule[] => {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        typeof r.message === "string" &&
        typeof r.time === "string" &&
        Array.isArray(r.days)
    );
  } catch {
    return [];
  }
};

export const saveRules = (rules: NotificationRule[]) => {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(rules));
  } catch {
    // quota — drop silently
  }
};

const loadFiredMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveFiredMap = (m: Record<string, string>) => {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(m));
  } catch {
    // ignore
  }
};

// Convert a JS Date to our "mon"/"tue"/... key.
export const dayKeyFor = (d: Date): DayOfWeek => {
  // getDay(): 0=Sun, 1=Mon, ... 6=Sat
  const map: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[d.getDay()];
};

export const todayStamp = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Parse "HH:mm" into minutes-from-midnight. Returns -1 on invalid input.
const parseHHmm = (s: string): number => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return -1;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return -1;
  return h * 60 + mm;
};

// Given the current time + a rule, should it fire now?
// We fire at-most-once-per-day and only after the scheduled minute has arrived.
export const shouldFire = (
  rule: NotificationRule,
  now: Date,
  firedMap: Record<string, string>
): boolean => {
  if (!rule.enabled) return false;
  if (!rule.days.includes(dayKeyFor(now))) return false;
  const targetMin = parseHHmm(rule.time);
  if (targetMin < 0) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < targetMin) return false;
  const stamp = todayStamp(now);
  return firedMap[rule.id] !== stamp;
};

export const markFired = (ruleId: string, when = new Date()) => {
  const m = loadFiredMap();
  m[ruleId] = todayStamp(when);
  saveFiredMap(m);
};

export const getFiredMap = loadFiredMap;

// Request notification permission (user gesture required in modern browsers).
export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
};

export const fireNotification = (rule: NotificationRule) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(rule.label?.trim() || "Reminder", {
      body: rule.message,
      icon: "/test-1.png",
      tag: `rule-${rule.id}`,
    });
  } catch {
    // some browsers throw if called in unusual contexts — swallow
  }
};
