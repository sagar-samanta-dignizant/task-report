import { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Tooltip } from "antd";
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

  useEffect(() => {
    if (!open) {
      setTitle("");
      setTaskId("");
      setHours("");
      setMinutes("");
      setStatus("Completed");
    }
  }, [open]);

  const canSubmit = title.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onAdd({
      title: title.trim(),
      taskId: taskId.trim() || undefined,
      hours: hours === "" ? "" : Math.max(0, Math.min(23, parseInt(hours, 10) || 0)),
      minutes: minutes === "" ? "" : Math.max(0, Math.min(59, parseInt(minutes, 10) || 0)),
      status,
    });
    onOpenChange(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
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
        <div className="quick-add-body" onKeyDown={handleKey}>
          <Input
            autoFocus
            size="large"
            placeholder="What did you work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onPressEnter={submit}
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
