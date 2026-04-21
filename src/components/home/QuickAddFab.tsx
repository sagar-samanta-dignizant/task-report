import { useEffect, useRef, useState } from "react";
import { Button, Input, Modal, Select, Tooltip, type InputRef } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { Task, TaskSettings } from "../../types/task";
import { ALL_STATUS_OPTIONS } from "../../constant/task.constant";
import "./QuickAddFab.css";

export interface QuickAddPayload {
  title: string;
  taskId?: string;
  hours: string | number;
  minutes: string | number;
  status: string;
}

interface Props {
  settings: TaskSettings;
  onAdd: (payload: QuickAddPayload) => void;
  onOpenHome: () => void;
  showFab: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHome: boolean; // is the user already on Home?
}

export const QuickAddFab = ({
  settings,
  onAdd,
  onOpenHome,
  showFab,
  open,
  onOpenChange,
  onHome,
}: Props) => {
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [status, setStatus] = useState<string>("Completed");
  const titleRef = useRef<InputRef>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setTaskId("");
      setHours("");
      setMinutes("");
      setStatus("Completed");
      return;
    }
    // Antd Modal mounts + animates in; focus after the frame so the cursor
    // lands inside the title input reliably.
    const handle = window.setTimeout(() => {
      titleRef.current?.focus({ cursor: "end" });
    }, 80);
    return () => window.clearTimeout(handle);
  }, [open]);

  const canSubmit = title.trim().length > 0;
  const submittingRef = useRef(false);

  const submit = () => {
    if (submittingRef.current) return;
    if (!canSubmit) return;
    submittingRef.current = true;
    onAdd({
      title: title.trim(),
      taskId: taskId.trim() || undefined,
      hours: hours === "" ? "" : Math.max(0, Math.min(23, parseInt(hours, 10) || 0)),
      minutes: minutes === "" ? "" : Math.max(0, Math.min(59, parseInt(minutes, 10) || 0)),
      status,
    });
    onOpenChange(false);
    // Re-enable on next tick so a subsequent modal open can submit again
    window.setTimeout(() => {
      submittingRef.current = false;
    }, 150);
  };

  return (
    <>
      {showFab && (
        <Tooltip title="Quick add task (Ctrl+Shift+A)" placement="left">
          <button
            type="button"
            className="quick-add-fab"
            onClick={() => onOpenChange(true)}
            aria-label="Quick add task"
          >
            <PlusOutlined />
          </button>
        </Tooltip>
      )}

      <Modal
        open={open}
        onCancel={() => onOpenChange(false)}
        title="Quick add task"
        centered
        width={520}
        footer={[
          !onHome && (
            <Button key="home" type="link" onClick={onOpenHome}>
              Open Home →
            </Button>
          ),
          <Button key="cancel" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>,
          <Button
            key="add"
            type="primary"
            onClick={submit}
            disabled={!canSubmit}
            icon={<PlusOutlined />}
          >
            Add task
          </Button>,
        ]}
      >
        <div className="quick-add-body">
          <Input
            ref={titleRef}
            size="large"
            placeholder="What did you work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={(e) => {
              // Prevent the event from bubbling — otherwise the Modal's own
              // key handling (or antd's internal ones) can re-trigger submit.
              e.preventDefault();
              e.stopPropagation();
              submit();
            }}
            spellCheck
          />
          <div className="quick-add-row">
            {settings.showID && (
              <div className="quick-add-field">
                <label>ID</label>
                <Input
                  placeholder="Task ID"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                />
              </div>
            )}
            {settings.showHours && (
              <>
                <div className="quick-add-field quick-add-field-time">
                  <label>Hours</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    min={0}
                    max={23}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
                <div className="quick-add-field quick-add-field-time">
                  <label>Minutes</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    min={0}
                    max={59}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              </>
            )}
            {settings.showStatus && (
              <div className="quick-add-field quick-add-field-status">
                <label>Status</label>
                <Select
                  value={status}
                  onChange={(v) => setStatus((v as string) || "Completed")}
                  style={{ width: "100%" }}
                >
                  {ALL_STATUS_OPTIONS.map((s) => (
                    <Select.Option key={s} value={s === "None" ? null : s}>
                      {s}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <div className="quick-add-hint">
            {onHome
              ? "Task will be added to the current form."
              : "Task will be added to today's in-progress report. Open Home to review and save."}
            <span className="quick-add-shortcut">Ctrl + Enter to add</span>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Tiny helper used by App to convert a quick-add payload into a Task.
export const quickAddToTask = (
  payload: QuickAddPayload,
  make: () => Task
): Task => {
  const base = make();
  return {
    ...base,
    title: payload.title,
    taskId: payload.taskId || "",
    hours: payload.hours,
    minutes: payload.minutes,
    status: payload.status,
  };
};
