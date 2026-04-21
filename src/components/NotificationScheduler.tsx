import { useEffect } from "react";
import {
  fireNotification,
  getFiredMap,
  loadRules,
  markFired,
  shouldFire,
} from "../utils/notificationsStore";

/**
 * Invisible component that runs in the background while the app is open.
 * Every minute (and whenever the tab becomes visible) it iterates all enabled
 * notification rules and fires those whose time has arrived today. Each rule
 * is fired at-most-once-per-day via a persisted map keyed by YYYY-MM-DD.
 */
export const NotificationScheduler = () => {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      const rules = loadRules();
      if (rules.length === 0) return;
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const now = new Date();
      const fired = getFiredMap();
      for (const rule of rules) {
        if (shouldFire(rule, now, fired)) {
          fireNotification(rule);
          markFired(rule.id, now);
        }
      }
    };

    tick(); // check once at mount in case we missed the minute boundary
    const interval = window.setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
};

export default NotificationScheduler;
