import {
  ALL_AVAILABLE_PROJECTS,
  ALL_BULLET_TYPES,
} from "../constant/task.constant";
import { AddIcon } from "../assets/fontAwesomeIcons";
import {
  Alert,
  App as AntdApp,
  Button,
  DatePicker,
  Input,
  Modal,
  Segmented,
  Select,
  Tooltip,
} from "antd";
import {
  CloseOutlined,
  CopyOutlined,
  ExpandOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import dayjs from "dayjs";
import { formatPreview } from "../utils/previewFormatter";
import {
  deleteReport,
  reportExists,
  saveReport,
  QuotaError,
} from "../utils/reportsStore";
import { newUid } from "../utils/uid";
import { computeTitleHistory } from "../utils/titleHistory";
import PageHeader from "../components/layout/PageHeader";
import TaskCard from "../components/home/TaskCard";
import ResizableSplit from "../components/home/ResizableSplit";
import type {
  AllSettings,
  GenerateSettings,
  PreviewFormat,
  PreviewSettings,
  Report,
  Subtask,
  Task,
} from "../types/task";

const PREVIEW_FORMAT_KEY = "app:preview-format";
const readPreviewFormat = (): PreviewFormat => {
  try {
    const raw = localStorage.getItem(PREVIEW_FORMAT_KEY);
    if (raw === "plain" || raw === "markdown" || raw === "slack") return raw;
  } catch {
    // ignore
  }
  return "plain";
};

const { Option } = Select;
const WORKING_TIME_LIMIT = 8.5;

const getProjectsFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem("allProjects");
    if (!stored) return ALL_AVAILABLE_PROJECTS;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : ALL_AVAILABLE_PROJECTS;
  } catch {
    return ALL_AVAILABLE_PROJECTS;
  }
};

const readGenerateSettings = (): GenerateSettings => {
  try {
    return JSON.parse(localStorage.getItem("generateSettings") || "{}");
  } catch {
    return {};
  }
};

const ensureUids = (tasks: Task[] | undefined): Task[] => {
  if (!tasks) return [];
  return tasks.map((t) => ({
    ...t,
    uid: t.uid || newUid(),
    view: t.view !== false,
    subtasks: t.subtasks?.map((s) => ({
      ...s,
      uid: s.uid || newUid(),
      view: s.view !== false,
    })),
  }));
};

const recomputeParentTime = (parent: Task): Task => {
  const subs = parent.subtasks || [];
  if (subs.length === 0) return parent;
  const totals = subs.reduce(
    (acc, s) => ({
      hours: acc.hours + (parseInt(s.hours as string, 10) || 0),
      minutes: acc.minutes + (parseInt(s.minutes as string, 10) || 0),
    }),
    { hours: 0, minutes: 0 }
  );
  return {
    ...parent,
    hours: String(totals.hours + Math.floor(totals.minutes / 60)),
    minutes: String(totals.minutes % 60),
  };
};

const EditTaskPage = ({ settings }: { settings: AllSettings }) => {
  const { message } = AntdApp.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report as
    | { date: string; data: Report }
    | undefined;
  const data = report?.data;

  const [tasks, setTasks] = useState<Task[]>(() => ensureUids(data?.tasks));
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    data?.selectedProjects || []
  );
  const [name, setName] = useState(data?.name || "");
  const [date, setDate] = useState(data?.date || "");
  const [bulletType, setBulletType] = useState<string>(data?.bulletType || "dot");
  const [nextTaskValue, setNextTaskValue] = useState(data?.nextTask || "");
  const [selectedSubIcon, setSelectedSubIcon] = useState<string>(
    data?.subIcon || "dot"
  );
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isDateConflict, setIsDateConflict] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>(readPreviewFormat);

  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_FORMAT_KEY, previewFormat);
    } catch {
      // ignore
    }
  }, [previewFormat]);
  const taskRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const subtaskRefs = useRef<
    Map<string, import("antd").InputRef | null>
  >(new Map());
  const projects = useMemo(() => getProjectsFromStorage(), []);

  const remainingTime = useMemo(() => {
    const total = tasks.reduce((sum, task) => {
      const subtaskTime =
        task.subtasks?.reduce((s, st) => {
          const h = parseFloat(st.hours as string) || 0;
          const m = (parseFloat(st.minutes as string) || 0) / 60;
          return s + h + m;
        }, 0) || 0;
      const taskHours = task.subtasks?.length
        ? 0
        : parseFloat(task.hours as string) || 0;
      const taskMinutes = task.subtasks?.length
        ? 0
        : (parseFloat(task.minutes as string) || 0) / 60;
      return sum + taskHours + taskMinutes + subtaskTime;
    }, 0);
    return WORKING_TIME_LIMIT - total;
  }, [tasks]);

  const isTimeExceeded = remainingTime < 0;
  const formatRemainingTime = (r: number) => {
    const hours = Math.floor(Math.abs(r));
    const minutes = Math.round((Math.abs(r) - hours) * 60);
    return r < 0 ? `${hours}h ${minutes}m (Extra hour)` : `${hours}h ${minutes}m`;
  };

  const handleTaskChange = useCallback(
    (index: number, field: keyof Task, value: string | number) => {
      setTasks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const handleSubtaskChange = useCallback(
    (
      parentIndex: number,
      subtaskIndex: number,
      field: keyof Subtask,
      value: string | number
    ) => {
      setTasks((prev) => {
        const next = [...prev];
        const parent = { ...next[parentIndex] };
        if (parent.subtasks) {
          const subs = [...parent.subtasks];
          subs[subtaskIndex] = { ...subs[subtaskIndex], [field]: value };
          parent.subtasks = subs;
          const totals = subs.reduce(
            (acc, s) => ({
              hours: acc.hours + (parseInt(s.hours as string, 10) || 0),
              minutes: acc.minutes + (parseInt(s.minutes as string, 10) || 0),
            }),
            { hours: 0, minutes: 0 }
          );
          parent.hours = String(totals.hours + Math.floor(totals.minutes / 60));
          parent.minutes = String(totals.minutes % 60);
        }
        next[parentIndex] = parent;
        return next;
      });
    },
    []
  );

  const addTask = useCallback(() => {
    const newTask: Task = {
      uid: newUid(),
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
      view: true,
    };
    setTasks((prev) => [...prev, newTask]);
    setTimeout(() => taskRefs.current.get(newTask.uid!)?.focus(), 0);
  }, []);

  const addSubtask = useCallback((parentIndex: number) => {
    const newSubtask: Subtask = {
      uid: newUid(),
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
      view: true,
    };
    setTasks((prev) => {
      const next = [...prev];
      const parent = { ...next[parentIndex] };
      parent.subtasks = [...(parent.subtasks || []), newSubtask];
      next[parentIndex] = recomputeParentTime(parent);
      return next;
    });
    setTimeout(() => subtaskRefs.current.get(newSubtask.uid!)?.focus(), 0);
  }, []);

  const clearTask = useCallback((taskIndex: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== taskIndex));
  }, []);

  const clearSubtask = useCallback(
    (parentIndex: number, subtaskIndex: number) => {
      setTasks((prev) => {
        const next = [...prev];
        const parent = { ...next[parentIndex] };
        parent.subtasks = parent.subtasks?.filter((_, i) => i !== subtaskIndex);
        next[parentIndex] = recomputeParentTime(parent);
        return next;
      });
    },
    []
  );

  const toggleTaskView = useCallback((taskIndex: number) => {
    setTasks((prev) => {
      const next = [...prev];
      next[taskIndex] = {
        ...next[taskIndex],
        view: next[taskIndex].view === false ? true : false,
      };
      return next;
    });
  }, []);

  const toggleSubtaskView = useCallback(
    (parentIndex: number, subtaskIndex: number) => {
      setTasks((prev) => {
        const next = [...prev];
        const parent = { ...next[parentIndex] };
        if (parent.subtasks) {
          const subs = [...parent.subtasks];
          subs[subtaskIndex] = {
            ...subs[subtaskIndex],
            view: subs[subtaskIndex].view === false ? true : false,
          };
          parent.subtasks = subs;
        }
        next[parentIndex] = parent;
        return next;
      });
    },
    []
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const s = result.source.index;
    const d = result.destination.index;
    if (s === d) return;
    setTasks((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(s, 1);
      next.splice(d, 0, moved);
      return next;
    });
  }, []);

  const registerTaskRef = useCallback(
    (uid: string, el: HTMLInputElement | null) => {
      taskRefs.current.set(uid, el);
    },
    []
  );
  const registerSubtaskRef = useCallback(
    (uid: string, ref: import("antd").InputRef | null) => {
      subtaskRefs.current.set(uid, ref);
    },
    []
  );

  const handleDateChange = (dateString: string) => {
    const formattedDate = dayjs(dateString, "DD-MM-YYYY").format("YYYY-MM-DD");
    if (formattedDate !== report?.date && reportExists(formattedDate)) {
      setAlertMessage(
        `A record already exists for ${dayjs(formattedDate).format("DD-MM-YYYY")}. Saving will replace it.`
      );
      setIsDateConflict(true);
    } else {
      setAlertMessage(null);
      setIsDateConflict(false);
    }
    setDate(formattedDate);
  };

  const preview = useMemo(() => {
    const r: Report = {
      date,
      tasks,
      selectedProjects,
      name,
      nextTask: nextTaskValue,
      bulletType,
      subIcon: selectedSubIcon,
    };
    return formatPreview({
      report: r,
      previewSettings: settings.previewSettings as PreviewSettings,
      generateSettings: readGenerateSettings(),
      format: previewFormat,
    });
  }, [
    date,
    tasks,
    selectedProjects,
    name,
    nextTaskValue,
    bulletType,
    selectedSubIcon,
    settings.previewSettings,
    previewFormat,
  ]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(preview);
    message.success("Copied to clipboard");
  }, [preview, message]);

  const handleSave = () => {
    const updatedReport: Report = {
      date,
      tasks,
      selectedProjects,
      name,
      bulletType,
      nextTask: nextTaskValue,
      subIcon: selectedSubIcon,
    };

    try {
      if (report && date !== report.date) {
        deleteReport(report.date);
      }
      saveReport(date, updatedReport);
    } catch (err) {
      if (err instanceof QuotaError) {
        message.error(err.message);
      } else {
        message.error("Failed to save the report. Please try again.");
      }
      return;
    }

    message.success("Report updated");
    navigate("/reports");
  };

  const handleCancel = () => navigate("/reports");

  if (!report) {
    return (
      <>
        <PageHeader title="Edit report" />
        <div className="page-body">
          <div className="surface-card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>Report not found.</p>
            <Button onClick={() => navigate("/reports")}>Back to Reports</Button>
          </div>
        </div>
      </>
    );
  }

  const headerActions = (
    <>
      <Tooltip title="Discard and return to Reports">
        <Button icon={<CloseOutlined />} onClick={handleCancel}>
          Cancel
        </Button>
      </Tooltip>
      <Tooltip title="Save changes">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
        >
          Save
        </Button>
      </Tooltip>
    </>
  );

  const titleHistory = useMemo(() => computeTitleHistory(), []);

  const taskHandlers = {
    onTaskChange: handleTaskChange,
    onSubtaskChange: handleSubtaskChange,
    onAddSubtask: addSubtask,
    onClearTask: clearTask,
    onClearSubtask: clearSubtask,
    onToggleTaskView: toggleTaskView,
    onToggleSubtaskView: toggleSubtaskView,
    registerTaskRef,
    registerSubtaskRef,
    titleHistory,
  };

  return (
    <>
      <PageHeader
        title="Edit report"
        subtitle={date ? dayjs(date, "YYYY-MM-DD").format("dddd · DD MMM YYYY") : "Update a previously saved entry"}
        actions={headerActions}
      />
      <div className="page-body">
        {alertMessage && (
          <Alert
            message={alertMessage}
            type={isDateConflict ? "warning" : "info"}
            closable
            onClose={() => setAlertMessage(null)}
            style={{ marginBottom: 15 }}
          />
        )}

        <ResizableSplit
          storageKey="edit-split"
          defaultRatio={0.62}
          minRatio={0.38}
          maxRatio={0.8}
          left={
            <section className="surface-card builder">
              <div className="section-head">
                <h2 className="section-title">Personal details</h2>
                <div className="time-info" style={{ marginLeft: "auto" }}>
                  <p className="total-time">
                    Total : <span>{WORKING_TIME_LIMIT}h</span>
                  </p>
                  <p className="remaining-time">
                    Remaining :{" "}
                    <span className={isTimeExceeded ? "time-exceeded" : "time-in-limit"}>
                      {formatRemainingTime(remainingTime)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="task-info-row">
                <div className="input-group">
                  <label htmlFor="name">Name</label>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ width: 160 }}>
                  <label htmlFor="date">Date</label>
                  <DatePicker
                    id="date"
                    value={date ? dayjs(date, "YYYY-MM-DD") : null}
                    onChange={(_, dateString) => handleDateChange(dateString as string)}
                    format="DD-MM-YYYY"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="input-group" style={{ width: 140 }}>
                  <label htmlFor="bulletType">Task Icon</label>
                  <Select
                    id="bulletType"
                    value={bulletType}
                    onChange={(value) => setBulletType(value as string)}
                    style={{ width: "100%" }}
                  >
                    {ALL_BULLET_TYPES.map((type) => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div
                  className="input-group"
                  style={{
                    width: 140,
                    display: settings.taskSettings.allowSubtask ? "block" : "none",
                  }}
                >
                  <label htmlFor="icon">Sub Icon</label>
                  <Select
                    id="icon"
                    placeholder="Select icon"
                    value={selectedSubIcon}
                    onChange={(value) => setSelectedSubIcon(value as string)}
                    style={{ width: "100%" }}
                  >
                    {ALL_BULLET_TYPES.map((type) => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div
                  className="input-group"
                  style={{
                    flex: "2 1 260px",
                    display: settings.taskSettings.showProject ? "block" : "none",
                  }}
                >
                  <label htmlFor="project">Project</label>
                  <Select
                    id="project"
                    mode="multiple"
                    placeholder="Select project(s)"
                    value={selectedProjects}
                    onChange={(value) => setSelectedProjects(value as string[])}
                    style={{ width: "100%" }}
                  >
                    {projects.map((project: string) => (
                      <Option key={project} value={project}>
                        {project}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="section-head with-actions">
                <h2 className="section-title">Tasks</h2>
                <div className="section-actions">
                  <Tooltip title="Add new task">
                    <Button type="primary" icon={AddIcon} onClick={addTask}>
                      Add task
                    </Button>
                  </Tooltip>
                </div>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="editTaskList">
                  {(provided) => (
                    <div
                      className="task-list"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.uid} draggableId={task.uid!} index={index}>
                          {(prov) => (
                            <TaskCard
                              task={task}
                              index={index}
                              settings={settings.taskSettings}
                              draggable={prov}
                              handlers={taskHandlers}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {settings.taskSettings.showNextTask && (
                <div className="input-group" style={{ marginTop: "var(--space-4)" }}>
                  <label htmlFor="nextTask">Tomorrow</label>
                  <Input
                    id="nextTask"
                    placeholder="What's on deck for tomorrow?"
                    value={nextTaskValue}
                    onChange={(e) => setNextTaskValue(e.target.value)}
                    spellCheck
                  />
                </div>
              )}
            </section>
          }
          right={
            <section className="surface-card preview">
              <div className="section-head with-actions">
                <h2 className="section-title">Preview</h2>
                <div className="section-actions">
                  <Segmented
                    size="small"
                    value={previewFormat}
                    onChange={(v) => setPreviewFormat(v as PreviewFormat)}
                    options={[
                      { label: "Plain", value: "plain" },
                      { label: "MD", value: "markdown" },
                      { label: "Slack", value: "slack" },
                    ]}
                  />
                  <Tooltip title="Expand">
                    <Button
                      type="text"
                      icon={<ExpandOutlined />}
                      onClick={() => setPreviewOpen(true)}
                    />
                  </Tooltip>
                  <Tooltip title="Copy to clipboard">
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                    />
                  </Tooltip>
                </div>
              </div>
              <pre className="script-style">{preview}</pre>
            </section>
          }
        />
      </div>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width="min(1200px, 95vw)"
        centered
        className="preview-modal"
        title={
          <div className="preview-modal-title">
            <span>Preview</span>
            <Segmented
              size="small"
              value={previewFormat}
              onChange={(v) => setPreviewFormat(v as PreviewFormat)}
              options={[
                { label: "Plain", value: "plain" },
                { label: "MD", value: "markdown" },
                { label: "Slack", value: "slack" },
              ]}
            />
          </div>
        }
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopy}>
            Copy
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => {
              handleSave();
              setPreviewOpen(false);
            }}
          >
            Save changes
          </Button>,
        ]}
      >
        <pre className="script-style preview-modal-body">{preview}</pre>
      </Modal>
    </>
  );
};

export default EditTaskPage;
