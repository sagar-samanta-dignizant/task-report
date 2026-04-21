import { useEffect, useMemo, useState } from "react";
import { App as AntdApp, Button, Input, Popconfirm, TimePicker, Tooltip } from "antd";
import {
  BellOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  StopOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import {
  createEmptyRule,
  DAY_LABELS,
  DAY_ORDER,
  fireNotification,
  loadRules,
  requestPermission,
  saveRules,
  WEEKDAYS,
  WEEKENDS,
  type DayOfWeek,
  type NotificationRule,
} from "../../utils/notificationsStore";
import "./NotificationsSettings.css";

dayjs.extend(customParseFormat);

const arraysEq = (a: DayOfWeek[], b: DayOfWeek[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

const nextFireDescription = (rule: NotificationRule): string => {
  if (!rule.enabled) return "Disabled";
  if (rule.days.length === 0) return "No days selected";
  const now = dayjs();
  const [h, m] = rule.time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "Invalid time";
  // Starting today, look ahead up to 7 days for the next matching day
  for (let i = 0; i < 7; i++) {
    const candidate = now.add(i, "day").hour(h).minute(m).second(0);
    const dayMap: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const dayKey = dayMap[candidate.day()];
    if (!rule.days.includes(dayKey)) continue;
    if (i === 0 && candidate.isBefore(now)) continue;
    if (i === 0) return `Today at ${candidate.format("h:mm A")}`;
    if (i === 1) return `Tomorrow at ${candidate.format("h:mm A")}`;
    return `${candidate.format("dddd")} at ${candidate.format("h:mm A")}`;
  }
  return "Never";
};

export const NotificationsSettings = () => {
  const { message } = AntdApp.useApp();
  const [rules, setRules] = useState<NotificationRule[]>(() => loadRules());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification === "undefined" ? "denied" : Notification.permission
  );

  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  const updateRule = (id: string, patch: Partial<NotificationRule>) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRule = () => setRules((rs) => [...rs, createEmptyRule()]);
  const deleteRule = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

  const requestPerm = async () => {
    const result = await requestPermission();
    setPermission(result);
    if (result === "granted") message.success("Notifications enabled");
    else if (result === "denied") message.error("Notifications blocked in this browser");
  };

  const testRule = (rule: NotificationRule) => {
    if (permission !== "granted") {
      message.warning("Enable browser notifications first");
      return;
    }
    fireNotification({ ...rule, label: rule.label || "Test" });
    message.success("Test notification sent");
  };

  const toggleDay = (id: string, day: DayOfWeek) =>
    setRules((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              days: r.days.includes(day)
                ? r.days.filter((d) => d !== day)
                : [...r.days, day],
            }
          : r
      )
    );

  const setPreset = (id: string, preset: "all" | "weekdays" | "weekends") =>
    setRules((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        if (preset === "all") return { ...r, days: [...DAY_ORDER] };
        if (preset === "weekdays") return { ...r, days: [...WEEKDAYS] };
        return { ...r, days: [...WEEKENDS] };
      })
    );

  const activePreset = (r: NotificationRule): string => {
    if (arraysEq(r.days, DAY_ORDER)) return "all";
    if (arraysEq(r.days, WEEKDAYS)) return "weekdays";
    if (arraysEq(r.days, WEEKENDS)) return "weekends";
    return "custom";
  };

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules]);

  return (
    <div className="notifications-settings">
      <div className="notifications-permission">
        {permission === "granted" ? (
          <span className="notifications-permission-ok">
            <CheckCircleFilled /> Browser notifications are enabled
            {enabledCount > 0 && (
              <span className="notifications-permission-muted">
                {" · "}
                {enabledCount} active reminder{enabledCount === 1 ? "" : "s"}
              </span>
            )}
          </span>
        ) : permission === "denied" ? (
          <span className="notifications-permission-bad">
            <StopOutlined /> Notifications are blocked. Update your browser's site
            settings to allow them.
          </span>
        ) : (
          <>
            <span className="notifications-permission-warn">
              <ExclamationCircleFilled /> Browser permission not granted yet. Reminders
              won't fire until you enable them.
            </span>
            <Button type="primary" icon={<BellOutlined />} onClick={requestPerm}>
              Enable notifications
            </Button>
          </>
        )}
      </div>

      <div className="reminder-list">
        {rules.length === 0 && (
          <div className="reminder-empty">
            <BellOutlined className="reminder-empty-icon" />
            <div className="reminder-empty-title">No reminders yet</div>
            <div className="reminder-empty-sub">
              Add one to get a nudge at a specific time of day.
            </div>
          </div>
        )}

        {rules.map((rule) => {
          const preset = activePreset(rule);
          return (
            <div
              key={rule.id}
              className={`reminder-card ${rule.enabled ? "on" : "off"}`}
            >
              {/* Header */}
              <div className="reminder-head">
                <button
                  type="button"
                  className={`reminder-toggle ${rule.enabled ? "on" : ""}`}
                  onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                  aria-pressed={rule.enabled}
                  title={rule.enabled ? "Disable" : "Enable"}
                >
                  <BellOutlined />
                </button>

                <div className="reminder-head-text">
                  <Input
                    placeholder="Label (optional) — e.g. End of day"
                    value={rule.label || ""}
                    onChange={(e) => updateRule(rule.id, { label: e.target.value })}
                    className="reminder-label-input"
                    variant="borderless"
                  />
                  <div className="reminder-next">{nextFireDescription(rule)}</div>
                </div>

                <div className="reminder-head-actions">
                  <Tooltip title="Send test notification">
                    <Button icon={<SendOutlined />} onClick={() => testRule(rule)} />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this reminder?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                    onConfirm={() => deleteRule(rule.id)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>

              {/* Body */}
              <div className="reminder-body">
                <div className="reminder-field">
                  <span className="reminder-field-label">Message</span>
                  <Input.TextArea
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    value={rule.message}
                    onChange={(e) => updateRule(rule.id, { message: e.target.value })}
                    placeholder="What should the reminder say?"
                  />
                </div>

                <div className="reminder-when">
                  <div className="reminder-field reminder-field-time">
                    <span className="reminder-field-label">Time</span>
                    <TimePicker
                      format="HH:mm"
                      value={dayjs(rule.time, "HH:mm")}
                      onChange={(v) =>
                        v && updateRule(rule.id, { time: v.format("HH:mm") })
                      }
                      allowClear={false}
                      minuteStep={5}
                      className="reminder-time"
                    />
                  </div>

                  <div className="reminder-field reminder-field-days">
                    <span className="reminder-field-label">
                      Days
                      <span className="reminder-day-summary">
                        {rule.days.length === 7
                          ? "Every day"
                          : rule.days.length === 0
                          ? "None"
                          : `${rule.days.length} per week`}
                      </span>
                    </span>
                    <div className="day-picker">
                      <div className="day-chips">
                        {DAY_ORDER.map((d) => {
                          const on = rule.days.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              className={`day-chip ${on ? "on" : ""}`}
                              onClick={() => toggleDay(rule.id, d)}
                              aria-pressed={on}
                            >
                              {DAY_LABELS[d]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="day-presets">
                        <button
                          type="button"
                          className={`preset-chip ${preset === "all" ? "active" : ""}`}
                          onClick={() => setPreset(rule.id, "all")}
                        >
                          Every day
                        </button>
                        <button
                          type="button"
                          className={`preset-chip ${preset === "weekdays" ? "active" : ""}`}
                          onClick={() => setPreset(rule.id, "weekdays")}
                        >
                          Weekdays
                        </button>
                        <button
                          type="button"
                          className={`preset-chip ${preset === "weekends" ? "active" : ""}`}
                          onClick={() => setPreset(rule.id, "weekends")}
                        >
                          Weekends
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addRule}
        className="reminder-add-btn"
        block
      >
        Add reminder
      </Button>
    </div>
  );
};

export default NotificationsSettings;
