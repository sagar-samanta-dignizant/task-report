import { AutoComplete, Input, InputRef, Select as AntdSelect } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  PlusOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import type { DraggableProvided } from "@hello-pangea/dnd";
import type { Subtask, Task, TaskSettings } from "../../types/task";
import type { TitleHistoryEntry } from "../../utils/titleHistory";
import { ALL_STATUS_OPTIONS } from "../../constant/task.constant";
import { getStatusPalette } from "../../utils/statusColors";
import "./TaskCard.css";

const { Option } = AntdSelect;

export interface TaskHandlers {
  onTaskChange: (index: number, field: keyof Task, value: string | number) => void;
  onSubtaskChange: (
    parentIndex: number,
    subtaskIndex: number,
    field: keyof Subtask,
    value: string | number
  ) => void;
  onAddSubtask: (parentIndex: number) => void;
  onClearTask: (index: number) => void;
  onClearSubtask: (parentIndex: number, subtaskIndex: number) => void;
  onToggleTaskView: (index: number) => void;
  onToggleSubtaskView: (parentIndex: number, subtaskIndex: number) => void;
  registerTaskRef?: (uid: string, el: HTMLInputElement | null) => void;
  registerSubtaskRef?: (uid: string, ref: InputRef | null) => void;
  titleHistory?: TitleHistoryEntry[];
}

interface Props {
  task: Task;
  index: number;
  settings: TaskSettings;
  draggable?: DraggableProvided;
  handlers: TaskHandlers;
}

const historyToOptions = (history: TitleHistoryEntry[] | undefined) =>
  (history ?? []).map((h) => ({
    value: h.title,
    label: (
      <div className="task-card-suggest">
        <span className="task-card-suggest-title">{h.title}</span>
        <span className="task-card-suggest-count">{h.count}×</span>
      </div>
    ),
  }));

const filterHistory = (input: string, option?: { value: string }) => {
  if (!option) return false;
  return option.value.toLowerCase().includes(input.toLowerCase());
};

const StatusSelect = ({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
}) => {
  const palette = getStatusPalette(value);
  return (
    <AntdSelect
      className="task-card-status"
      placeholder="Status"
      value={value || undefined}
      onChange={(v) => onChange((v as string) || "")}
      optionLabelProp="label"
      size="small"
      style={{
        minWidth: 140,
        // bg via CSS variables so theme flips carry through
        ["--status-bg" as string]: palette.bg,
        ["--status-text" as string]: palette.text,
        ["--status-border" as string]: palette.border,
      }}
      popupMatchSelectWidth={false}
    >
      {ALL_STATUS_OPTIONS.map((status) => (
        <Option key={status} value={status === "None" ? null : status} label={status}>
          {status}
        </Option>
      ))}
    </AntdSelect>
  );
};

const NumberInput = ({
  value,
  onChange,
  placeholder,
  max,
  disabled,
}: {
  value: string | number;
  onChange: (v: number) => void;
  placeholder: string;
  max: number;
  disabled?: boolean;
}) => (
  <Input
    type="number"
    size="small"
    className="task-card-num"
    placeholder={placeholder}
    value={value}
    disabled={disabled}
    min={0}
    max={max}
    onChange={(e) => {
      const v = Math.min(max, Math.max(0, parseInt(e.target.value, 10) || 0));
      onChange(v);
    }}
    onWheel={(e) => e.currentTarget.blur()}
  />
);

export const TaskCard = ({ task, index, settings, draggable, handlers }: Props) => {
  const { showID, showHours, showStatus, allowSubtask } = settings;
  const hidden = task.view === false;
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;

  return (
    <div
      ref={draggable?.innerRef}
      {...(draggable?.draggableProps ?? {})}
      className={`task-card ${hidden ? "is-hidden" : ""}`}
    >
      <div className="task-card-main">
        <div
          {...(draggable?.dragHandleProps ?? {})}
          className="task-card-drag"
          title="Drag to reorder"
          aria-label="Drag handle"
        >
          <MenuOutlined />
        </div>

        <div className="task-card-body">
          <div className="task-card-row">
            <AutoComplete
              className="task-card-title"
              value={task.title}
              options={historyToOptions(handlers.titleHistory)}
              filterOption={filterHistory}
              onChange={(v) => handlers.onTaskChange(index, "title", v)}
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              popupMatchSelectWidth={false}
              style={{ flex: 1, minWidth: 0 }}
            >
              <Input
                ref={(el) => {
                  if (task.uid && handlers.registerTaskRef) {
                    handlers.registerTaskRef(task.uid, el?.input || null);
                  }
                }}
                placeholder="What did you work on?"
                spellCheck
              />
            </AutoComplete>
            {showStatus && (
              <StatusSelect
                value={task.status}
                onChange={(v) => handlers.onTaskChange(index, "status", v)}
              />
            )}
          </div>

          <div className="task-card-meta">
            {showID && (
              <Input
                size="small"
                className="task-card-id"
                placeholder="ID"
                value={task.taskId || ""}
                onChange={(e) => handlers.onTaskChange(index, "taskId", e.target.value)}
              />
            )}
            {showHours && (
              <>
                <NumberInput
                  value={task.hours}
                  placeholder="Hours"
                  max={23}
                  disabled={hasSubtasks}
                  onChange={(v) =>
                    !hasSubtasks && handlers.onTaskChange(index, "hours", v)
                  }
                />
                <span className="task-card-meta-sep">h</span>
                <NumberInput
                  value={task.minutes}
                  placeholder="Mins"
                  max={59}
                  disabled={hasSubtasks}
                  onChange={(v) =>
                    !hasSubtasks && handlers.onTaskChange(index, "minutes", v)
                  }
                />
                <span className="task-card-meta-sep">m</span>
              </>
            )}

            <div className="task-card-spacer" />

            <button
              type="button"
              className="task-card-action"
              onClick={() => handlers.onToggleTaskView(index)}
              title={hidden ? "Show in preview" : "Hide from preview"}
            >
              {hidden ? (
                <EyeInvisibleOutlined style={{ color: "var(--warning)" }} />
              ) : (
                <EyeOutlined />
              )}
            </button>
            {allowSubtask && (
              <button
                type="button"
                className="task-card-action"
                onClick={() => handlers.onAddSubtask(index)}
                title="Add subtask"
              >
                <PlusOutlined style={{ color: "var(--success)" }} />
              </button>
            )}
            <button
              type="button"
              className="task-card-action danger"
              onClick={() => handlers.onClearTask(index)}
              title="Delete task"
            >
              <DeleteOutlined style={{ color: "var(--danger)" }} />
            </button>
          </div>
        </div>
      </div>

      {allowSubtask && task.subtasks && task.subtasks.length > 0 && (
        <div className="task-card-subtasks">
          {task.subtasks.map((subtask, subIndex) => {
            const subHidden = subtask.view === false;
            return (
              <div
                key={subtask.uid || `${task.uid}-${subIndex}`}
                className={`subtask-row ${subHidden ? "is-hidden" : ""}`}
              >
                <div className="subtask-bullet" aria-hidden>└─</div>
                <AutoComplete
                  className="task-card-title subtask-title"
                  value={subtask.title}
                  options={historyToOptions(handlers.titleHistory)}
                  filterOption={filterHistory}
                  onChange={(v) =>
                    handlers.onSubtaskChange(index, subIndex, "title", v)
                  }
                  getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  popupMatchSelectWidth={false}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Input
                    ref={(el) => {
                      if (subtask.uid && handlers.registerSubtaskRef) {
                        handlers.registerSubtaskRef(subtask.uid, el);
                      }
                    }}
                    placeholder="Subtask"
                  />
                </AutoComplete>
                {showStatus && (
                  <StatusSelect
                    value={subtask.status}
                    onChange={(v) =>
                      handlers.onSubtaskChange(index, subIndex, "status", v)
                    }
                  />
                )}
                {showHours && (
                  <div className="subtask-time">
                    <NumberInput
                      value={subtask.hours}
                      placeholder="H"
                      max={23}
                      onChange={(v) =>
                        handlers.onSubtaskChange(index, subIndex, "hours", v)
                      }
                    />
                    <NumberInput
                      value={subtask.minutes}
                      placeholder="M"
                      max={59}
                      onChange={(v) =>
                        handlers.onSubtaskChange(index, subIndex, "minutes", v)
                      }
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="task-card-action"
                  onClick={() => handlers.onToggleSubtaskView(index, subIndex)}
                  title={subHidden ? "Show in preview" : "Hide from preview"}
                >
                  {subHidden ? (
                    <EyeInvisibleOutlined style={{ color: "var(--warning)" }} />
                  ) : (
                    <EyeOutlined />
                  )}
                </button>
                <button
                  type="button"
                  className="task-card-action danger"
                  onClick={() => handlers.onClearSubtask(index, subIndex)}
                  title="Delete subtask"
                >
                  <DeleteOutlined style={{ color: "var(--danger)" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
