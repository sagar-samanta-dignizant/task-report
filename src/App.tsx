import "./app.css";

import {
  ALERT_DISMISS_TIME,
  ALL_BULLET_TYPES,
  ALL_AVAILABLE_PROJECTS,
} from "./constant/task.constant";
import { AddIcon } from "./assets/fontAwesomeIcons";
import {
  Alert,
  Button,
  DatePicker,
  Input,
  InputRef,
  Modal,
  Segmented,
  Select as AntdSelect,
  Tooltip,
  App as AntdApp,
} from "antd";
import {
  CopyOutlined,
  ExpandOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import dayjs from "dayjs";

import LoginPage from "./components/LoginPage";
import Sidebar from "./components/layout/Sidebar";
import PageHeader from "./components/layout/PageHeader";
import TodayStrip from "./components/home/TodayStrip";
import TaskCard from "./components/home/TaskCard";
import ResizableSplit from "./components/home/ResizableSplit";
import { QuickAddFab, type QuickAddPayload } from "./components/home/QuickAddFab";
import { formatPreview } from "./utils/previewFormatter";
import {
  getReport,
  listReportDates,
  reportExists,
  saveReport,
  QuotaError,
} from "./utils/reportsStore";
import { newUid } from "./utils/uid";
import { useHotkey, useHotkeys } from "./hooks/useHotkey";
import {
  clearDraft,
  isDraftEmpty,
  loadDraft,
  saveDraft,
} from "./utils/draftStore";
import { computeTitleHistory } from "./utils/titleHistory";
import {
  addTemplate,
  captureTemplate,
  loadTemplates,
} from "./utils/templatesStore";
import type { Task, AllSettings, PreviewFormat, Report, TaskTemplate } from "./types/task";

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

const EditTaskPage = lazy(() => import("./pages/EditTaskPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const { Option } = AntdSelect;

const WORKING_TIME_LIMIT = 8.5;

const createTask = (overrides: Partial<Task> = {}): Task => ({
  uid: newUid(),
  taskId: "",
  title: "",
  hours: "",
  minutes: "",
  status: "Completed",
  view: true,
  ...overrides,
});

const withUids = (tasks: Task[] | undefined): Task[] => {
  if (!tasks || tasks.length === 0) return [];
  return tasks.map((t) => ({
    ...t,
    uid: t.uid || newUid(),
    subtasks: t.subtasks?.map((s) => ({ ...s, uid: s.uid || newUid() })),
  }));
};

// Re-derive parent's hours/minutes from its current subtasks. Call this whenever
// subtasks are added, removed, or edited so the aggregate stays in sync.
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

const loadSettings = (): AllSettings => {
  const read = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : fallback;
    } catch {
      return fallback;
    }
  };
  // Defaults: every "show/allow" feature is enabled and every line separator is
  // on at the standard length of 3 dashes. "Hide parent ..." toggles stay off
  // (enabling them would hide information, which contradicts "show everything").
  // These defaults only apply to new installs — existing users keep whatever
  // they've saved, via the spread merge in `read()` above.
  return {
    taskSettings: read("taskSettings", {
      allowSubtask: true,
      showHours: true,
      showStatus: true,
      showDate: true,
      showID: true,
      showNextTask: true,
      showProject: true,
    }),
    previewSettings: read("previewSettings", {
      allowSubtask: true,
      showHours: true,
      showStatus: true,
      showDate: true,
      showID: true,
      showNextTask: true,
      showProject: true,
      hideParentTaskTime: false,
      hideParentTaskStatus: false,
      allowLineAfterWorkUpdate: true,
      lineAfterWorkUpdate: 3,
      allowLineAfterProject: true,
      lineAfterProject: 3,
      allowLineAfterNextTask: true,
      lineAfterNextTask: 3,
      allowLineBeforeClosingText: true,
      lineBeforeClosingText: 3,
    }),
    exportSettings: read("exportSettings", {
      allowSubtask: true,
      showHours: true,
      showStatus: true,
      showDate: true,
      showID: true,
      showNextTask: true,
      showProject: true,
    }),
    generateSettings: read("generateSettings", {
      taskGap: 1,
      subtaskGap: 1,
      draftEnabled: true,
      titleSuggestionsEnabled: false,
    }),
  };
};

const App = () => {
  const { message } = AntdApp.useApp();
  const [tasks, setTasks] = useState<Task[]>(() => [createTask()]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("selectedProjects");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState(() => localStorage.getItem("name") || "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bulletType, setBulletType] = useState<string>("dot");
  const [nextTaskValue, setNextTaskValue] = useState("");
  const [settings, setSettings] = useState<AllSettings>(loadSettings);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<{ date: string } | null>(null);
  const [selectedSubIcon, setSelectedSubIcon] = useState<string>("dot");
  const taskRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const subtaskRefs = useRef<Map<string, InputRef | null>>(new Map());
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState<string>(() => {
    try {
      return localStorage.getItem("profilePicture") || "";
    } catch {
      return "";
    }
  });

  const projects = useMemo(() => getProjectsFromStorage(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [copyFromDate, setCopyFromDate] = useState<string>();
  const [allReportDates, setAllReportDates] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>(readPreviewFormat);

  useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_FORMAT_KEY, previewFormat);
    } catch {
      // ignore
    }
  }, [previewFormat]);

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => loadTemplates());
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleLogin = useCallback(() => setIsLoggedIn(true), []);
  const handleLogout = useCallback(() => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    if (!alertMessage) return;
    const t = setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
    return () => clearTimeout(t);
  }, [alertMessage]);

  useEffect(() => {
    localStorage.setItem("name", name);
  }, [name]);
  useEffect(() => {
    localStorage.setItem("date", date);
  }, [date]);
  useEffect(() => {
    localStorage.setItem("selectedProjects", JSON.stringify(selectedProjects));
  }, [selectedProjects]);

  useEffect(() => {
    for (const section of Object.keys(settings) as Array<keyof AllSettings>) {
      try {
        localStorage.setItem(section, JSON.stringify(settings[section]));
      } catch {
        // quota — ignore, next save will retry
      }
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem("profilePicture", profilePicture);
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        message.error("Profile picture is too large to store locally.");
      }
    }
  }, [profilePicture, message]);

  useEffect(() => {
    setAllReportDates(listReportDates().sort((a, b) => b.localeCompare(a)));
  }, []);

  // Draft restore — runs once on mount if the feature is enabled and a draft
  // exists that's not empty. Guarded with a ref so we don't double-apply.
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current) return;
    if (!settings.generateSettings.draftEnabled) return;
    const draft = loadDraft();
    if (!draft || isDraftEmpty(draft)) return;
    draftRestoredRef.current = true;
    setTasks(withUids(draft.tasks));
    setName(draft.name ?? "");
    setDate(draft.date || new Date().toISOString().split("T")[0]);
    setSelectedProjects(draft.selectedProjects ?? []);
    setNextTaskValue(draft.nextTask ?? "");
    setBulletType(draft.bulletType || "dot");
    setSelectedSubIcon(draft.subIcon || "dot");
    message.info(
      `Draft restored from ${dayjs(draft.savedAt).format("h:mm A")}`
    );
  }, [settings.generateSettings.draftEnabled, message]);

  // Draft save — debounced write on state change while feature is enabled.
  useEffect(() => {
    if (!settings.generateSettings.draftEnabled) return;
    const handle = setTimeout(() => {
      saveDraft({
        tasks,
        name,
        date,
        selectedProjects,
        nextTask: nextTaskValue,
        bulletType,
        subIcon: selectedSubIcon,
        savedAt: new Date().toISOString(),
      });
    }, 500);
    return () => clearTimeout(handle);
  }, [
    tasks,
    name,
    date,
    selectedProjects,
    nextTaskValue,
    bulletType,
    selectedSubIcon,
    settings.generateSettings.draftEnabled,
  ]);

  // If the user turns the feature off, purge any existing draft.
  useEffect(() => {
    if (!settings.generateSettings.draftEnabled) clearDraft();
  }, [settings.generateSettings.draftEnabled]);

  const remainingTime = useMemo(() => {
    const total = tasks.reduce((sum, task) => {
      const subtaskTime =
        task.subtasks?.reduce((s, st) => {
          const h = parseFloat(st.hours as string) || 0;
          const m = (parseFloat(st.minutes as string) || 0) / 60;
          return s + h + m;
        }, 0) || 0;
      const taskHours = task.subtasks?.length ? 0 : parseFloat(task.hours as string) || 0;
      const taskMinutes = task.subtasks?.length ? 0 : (parseFloat(task.minutes as string) || 0) / 60;
      return sum + taskHours + taskMinutes + subtaskTime;
    }, 0);
    return WORKING_TIME_LIMIT - total;
  }, [tasks]);

  const usedHours = WORKING_TIME_LIMIT - remainingTime;

  const taskCount = useMemo(() => tasks.filter((t) => t.title.trim()).length, [tasks]);
  const hiddenCount = useMemo(
    () =>
      tasks.filter((t) => t.title.trim() && t.view === false).length +
      tasks.reduce(
        (n, t) =>
          n +
          (t.subtasks?.filter((s) => s.title.trim() && s.view === false).length || 0),
        0
      ),
    [tasks]
  );

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
    (parentIndex: number, subtaskIndex: number, field: keyof Task, value: string | number) => {
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
    const newTask = createTask();
    setTasks((prev) => [...prev, newTask]);
    setTimeout(() => {
      if (settings.taskSettings.showID) {
        taskRefs.current.get(newTask.uid!)?.focus();
      } else {
        const inputs = document.querySelectorAll<HTMLInputElement>(".task-card-title input");
        inputs[inputs.length - 1]?.focus();
      }
    }, 0);
  }, [settings.taskSettings.showID]);

  const handleQuickAdd = useCallback(
    (payload: QuickAddPayload) => {
      // Replace the initial empty placeholder task if it's still untouched,
      // otherwise append so the user keeps whatever they were composing.
      setTasks((prev) => {
        const next = createTask({
          title: payload.title,
          taskId: payload.taskId || "",
          hours: payload.hours,
          minutes: payload.minutes,
          status: payload.status,
        });
        if (prev.length === 1 && !prev[0].title.trim() && !(prev[0].subtasks?.length)) {
          return [next];
        }
        return [...prev, next];
      });
      message.success(
        location.pathname === "/"
          ? "Task added"
          : "Task added to today — open Home to save"
      );
    },
    [message, location.pathname]
  );

  const addSubtask = useCallback(
    (parentIndex: number) => {
      const newSubtask = createTask({ icon: selectedSubIcon });
      setTasks((prev) => {
        const next = [...prev];
        const parent = { ...next[parentIndex] };
        parent.subtasks = [...(parent.subtasks || []), newSubtask];
        next[parentIndex] = recomputeParentTime(parent);
        return next;
      });
      setTimeout(() => subtaskRefs.current.get(newSubtask.uid!)?.focus(), 0);
    },
    [selectedSubIcon]
  );

  const resetForm = useCallback(() => {
    setTasks([createTask()]);
    setNextTaskValue("");
    setDate(new Date().toISOString().split("T")[0]);
    clearDraft();
  }, []);

  const clearTask = useCallback((taskIndex: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== taskIndex));
  }, []);

  const clearSubtask = useCallback((parentIndex: number, subtaskIndex: number) => {
    setTasks((prev) => {
      const next = [...prev];
      const parent = { ...next[parentIndex] };
      parent.subtasks = parent.subtasks?.filter((_, i) => i !== subtaskIndex);
      next[parentIndex] = recomputeParentTime(parent);
      return next;
    });
  }, []);

  const toggleSetting = useCallback(
    (section: keyof AllSettings, key: string, value: unknown) => {
      setSettings((prev) => {
        const updatedSection = { ...(prev[section] as object), [key]: value };
        return { ...prev, [section]: updatedSection } as AllSettings;
      });
    },
    []
  );

  const preview = useMemo(() => {
    const report: Report = {
      date,
      tasks,
      selectedProjects,
      name,
      nextTask: nextTaskValue,
      bulletType,
      subIcon: selectedSubIcon,
    };
    return formatPreview({
      report,
      previewSettings: settings.previewSettings,
      generateSettings: settings.generateSettings,
      format: previewFormat,
    });
  }, [date, tasks, selectedProjects, name, nextTaskValue, bulletType, selectedSubIcon, settings.previewSettings, settings.generateSettings, previewFormat]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(preview);
    message.success("Copied to clipboard");
  }, [preview, message]);

  const savePreview = useCallback(() => {
    const missingFields: string[] = [];
    if (!name.trim()) missingFields.push("Name");
    if (!date.trim()) missingFields.push("Date");

    const filteredTasks = tasks.filter((t) => t.title.trim());
    if (filteredTasks.length === 0) {
      setAlertMessage("No task added");
      return;
    }
    const hasEmptySubtask = filteredTasks.some(
      (t) => t.subtasks && t.subtasks.some((s) => !s.title.trim())
    );
    if (hasEmptySubtask) {
      setAlertMessage("Subtasks cannot have empty titles");
      return;
    }
    if (missingFields.length > 0) {
      setAlertMessage(`The following fields are required : ${missingFields.join(", ")}`);
      return;
    }
    if (!editingReport && reportExists(date)) {
      setAlertMessage(`A record already exists for the date: ${date}`);
      return;
    }

    const ts = settings.taskSettings;
    const report: Report = {
      date,
      tasks: filteredTasks.map((task) => ({
        uid: task.uid || newUid(),
        taskId: ts.showID ? task.taskId?.trim() : undefined,
        title: task.title.trim(),
        hours: ts.showHours ? task.hours : "",
        minutes: ts.showHours ? task.minutes : "",
        status: ts.showStatus ? task.status?.trim() || "" : "",
        icon: task.icon?.trim(),
        subtasks: task.subtasks
          ?.filter((s) => s.title.trim())
          .map((s) => ({
            uid: s.uid || newUid(),
            taskId: ts.showID ? s.taskId?.trim() : undefined,
            title: s.title.trim(),
            hours: ts.showHours ? s.hours : "",
            minutes: ts.showHours ? s.minutes : "",
            status: ts.showStatus ? s.status?.trim() || "" : "",
            icon: s.icon?.trim(),
          })),
      })),
      selectedProjects: ts.showProject ? selectedProjects.map((p) => p.trim()) : [],
      name: name.trim(),
      nextTask: ts.showNextTask && nextTaskValue.trim() ? nextTaskValue.trim() : undefined,
      bulletType,
      subIcon: selectedSubIcon,
    };

    try {
      saveReport(date, report);
    } catch (err) {
      if (err instanceof QuotaError) {
        message.error(err.message);
      } else {
        message.error("Failed to save the report. Please try again.");
      }
      return;
    }
    setAllReportDates(listReportDates().sort((a, b) => b.localeCompare(a)));

    navigator.clipboard.writeText(preview);
    message.success(editingReport ? "Report updated & copied" : "Report saved & copied");

    setTasks([createTask()]);
    setNextTaskValue("");
    setEditingReport(null);
    clearDraft();
  }, [name, date, tasks, settings.taskSettings, selectedProjects, nextTaskValue, bulletType, selectedSubIcon, editingReport, preview, message]);

  const handleCopyAndSavePreview = useCallback(() => {
    savePreview();
  }, [savePreview]);

  const applyTemplate = useCallback(
    (id: string) => {
      const tpl = templates.find((t) => t.id === id);
      if (!tpl) return;
      setTasks(withUids(tpl.tasks));
      if (tpl.selectedProjects) setSelectedProjects(tpl.selectedProjects);
      if (tpl.bulletType) setBulletType(tpl.bulletType);
      if (tpl.subIcon) setSelectedSubIcon(tpl.subIcon);
      setDate(new Date().toISOString().split("T")[0]);
      message.success(`Applied template "${tpl.name}"`);
    },
    [templates, message]
  );

  const handleSaveTemplate = useCallback(() => {
    const trimmed = newTemplateName.trim();
    if (!trimmed) {
      message.warning("Give the template a name");
      return;
    }
    const hasTitledTask = tasks.some((t) => t.title.trim());
    if (!hasTitledTask) {
      message.warning("Add at least one task before saving a template");
      return;
    }
    const tpl = captureTemplate(trimmed, {
      tasks,
      selectedProjects,
      bulletType,
      subIcon: selectedSubIcon,
    });
    const next = addTemplate(tpl);
    setTemplates(next);
    setSaveTemplateOpen(false);
    setNewTemplateName("");
    message.success(`Template "${tpl.name}" saved`);
  }, [newTemplateName, tasks, selectedProjects, bulletType, selectedSubIcon, message]);

  const handleCopyFromDate = useCallback((d: string) => {
    setCopyFromDate(d);
    if (d === "none") {
      setTasks([createTask()]);
      setSelectedProjects([]);
      setName(localStorage.getItem("name") || "");
      setBulletType("dot");
      setNextTaskValue("");
      setSelectedSubIcon("dot");
      setDate(new Date().toISOString().split("T")[0]);
      return;
    }
    const report = getReport(d);
    if (!report) return;
    setTasks(withUids(report.tasks));
    setSelectedProjects(report.selectedProjects || []);
    setName(report.name || "");
    setBulletType(report.bulletType || "dot");
    setNextTaskValue(report.nextTask || "");
    setSelectedSubIcon(report.subIcon || "dot");
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const toggleTaskView = useCallback((taskIndex: number) => {
    setTasks((prev) => {
      const next = [...prev];
      next[taskIndex] = { ...next[taskIndex], view: next[taskIndex].view === false ? true : false };
      return next;
    });
  }, []);

  const toggleSubtaskView = useCallback((parentIndex: number, subtaskIndex: number) => {
    setTasks((prev) => {
      const next = [...prev];
      const parent = { ...next[parentIndex] };
      if (parent.subtasks) {
        const subs = [...parent.subtasks];
        subs[subtaskIndex] = { ...subs[subtaskIndex], view: subs[subtaskIndex].view === false ? true : false };
        parent.subtasks = subs;
      }
      next[parentIndex] = parent;
      return next;
    });
  }, []);

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

  useHotkeys(
    [
      { combo: "ctrl+shift+c", handler: () => handleCopy() },
      { combo: "ctrl+shift+e", handler: () => setPreviewOpen(true) },
      { combo: "ctrl+enter", handler: () => addTask() },
      { combo: "ctrl+n", handler: () => addTask() },
      { combo: "ctrl+shift+z", handler: () => resetForm() },
      { combo: "ctrl+s", handler: () => handleCopyAndSavePreview() },
    ],
    isLoggedIn && location.pathname === "/"
  );

  // Global: quick-add works on every route when logged in (except login itself)
  useHotkey("ctrl+shift+a", () => setQuickAddOpen(true), isLoggedIn);

  const registerTaskRef = useCallback((uid: string, el: HTMLInputElement | null) => {
    taskRefs.current.set(uid, el);
  }, []);

  const registerSubtaskRef = useCallback((uid: string, ref: InputRef | null) => {
    subtaskRefs.current.set(uid, ref);
  }, []);

  // Must be declared before any early returns so hook order stays stable
  // across login/logout (React rules of hooks).
  const suggestionsEnabled = !!settings.generateSettings.titleSuggestionsEnabled;
  const titleHistory = useMemo(
    () => (suggestionsEnabled ? computeTitleHistory() : undefined),
    [allReportDates, suggestionsEnabled]
  );

  if (!isLoggedIn) {
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
      return null;
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  const homeActions = (
    <>
      <Tooltip title="Reset all tasks (Ctrl+Shift+Z)" placement="bottom">
        <Button icon={<ReloadOutlined />} onClick={resetForm} className="reset-btn">
          Reset
        </Button>
      </Tooltip>
      <Tooltip title="Copy to clipboard (Ctrl+Shift+C)" placement="bottom">
        <Button icon={<CopyOutlined />} onClick={handleCopy} className="copy-btn">
          Copy
        </Button>
      </Tooltip>
      <Tooltip title="Copy & Save (Ctrl+S)" placement="bottom">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleCopyAndSavePreview}
          className="save-task-btn"
        >
          Copy & Save
        </Button>
      </Tooltip>
    </>
  );

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
    <div className="app-shell">
      <Sidebar name={name} profilePicture={profilePicture} onLogout={handleLogout} />
      <main className="page">
        <Suspense fallback={<div style={{ padding: 24, color: "var(--text-muted)" }}>Loading…</div>}>
          <Routes location={location}>
            <Route
              path="/"
              element={
                <>
                  <PageHeader title="Home" subtitle="Compose today's report" actions={homeActions} />
                  <div className="page-body home-layout">
                    <TodayStrip
                      date={date}
                      workingHours={WORKING_TIME_LIMIT}
                      usedHours={usedHours}
                      taskCount={taskCount}
                      hiddenCount={hiddenCount}
                    />

                    {alertMessage && (
                      <Alert
                        message={alertMessage}
                        type={alertMessage.includes("successfully") ? "success" : "error"}
                        closable
                        onClose={() => setAlertMessage(null)}
                        style={{ marginBottom: 15 }}
                      />
                    )}

                    <ResizableSplit
                      storageKey="home-split"
                      defaultRatio={0.62}
                      minRatio={0.38}
                      maxRatio={0.8}
                      left={
                        <section className="surface-card builder">
                        <div className="section-head">
                          <h2 className="section-title">Personal details</h2>
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
                          <div
                            className="input-group"
                            style={{
                              width: 160,
                              display: settings.taskSettings.showDate ? "block" : "none",
                            }}
                          >
                            <label htmlFor="date">Date</label>
                            <DatePicker
                              id="date"
                              value={date ? dayjs(date, "YYYY-MM-DD") : null}
                              onChange={(d) => d && setDate(d.format("YYYY-MM-DD"))}
                              format="DD-MM-YYYY"
                              style={{ width: "100%" }}
                            />
                          </div>
                          <div className="input-group" style={{ width: 140 }}>
                            <label htmlFor="bulletType">Task Icon</label>
                            <AntdSelect
                              id="bulletType"
                              value={bulletType}
                              onChange={(v) => setBulletType(v as string)}
                              style={{ width: "100%" }}
                            >
                              {ALL_BULLET_TYPES.map((type) => (
                                <Option key={type} value={type}>
                                  {type}
                                </Option>
                              ))}
                            </AntdSelect>
                          </div>
                          <div
                            className="input-group"
                            style={{
                              width: 140,
                              display: settings.taskSettings.allowSubtask ? "block" : "none",
                            }}
                          >
                            <label htmlFor="icon">Sub Icon</label>
                            <AntdSelect
                              id="icon"
                              placeholder="Select icon"
                              value={selectedSubIcon}
                              onChange={(v) => setSelectedSubIcon(v as string)}
                              style={{ width: "100%" }}
                            >
                              {ALL_BULLET_TYPES.map((type) => (
                                <Option key={type} value={type}>
                                  {type}
                                </Option>
                              ))}
                            </AntdSelect>
                          </div>
                          <div
                            className="input-group"
                            style={{
                              flex: "2 1 260px",
                              display: settings.taskSettings.showProject ? "block" : "none",
                            }}
                          >
                            <label htmlFor="project">Project</label>
                            <AntdSelect
                              id="project"
                              mode="multiple"
                              placeholder="Select project(s)"
                              value={selectedProjects}
                              onChange={(v) => setSelectedProjects(v as string[])}
                              style={{ width: "100%" }}
                            >
                              {projects.map((project: string) => (
                                <Option key={project} value={project}>
                                  {project}
                                </Option>
                              ))}
                            </AntdSelect>
                          </div>
                        </div>

                        <div className="section-head with-actions">
                          <h2 className="section-title">Tasks</h2>
                          <div className="section-actions">
                            <AntdSelect
                              style={{ width: 180 }}
                              value={copyFromDate}
                              onChange={handleCopyFromDate}
                              placeholder="Copy from date"
                            >
                              <AntdSelect.Option value="none">None</AntdSelect.Option>
                              {allReportDates.map((d) => (
                                <AntdSelect.Option key={d} value={d}>
                                  {dayjs(d, "YYYY-MM-DD").format("DD-MM-YYYY")}
                                </AntdSelect.Option>
                              ))}
                            </AntdSelect>
                            <AntdSelect
                              style={{ width: 200 }}
                              placeholder="Templates"
                              value={undefined}
                              onChange={(value: string) => {
                                if (value === "__save__") {
                                  setNewTemplateName("");
                                  setSaveTemplateOpen(true);
                                } else if (value) {
                                  applyTemplate(value);
                                }
                              }}
                            >
                              <AntdSelect.Option value="__save__">
                                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                                  + Save current as template…
                                </span>
                              </AntdSelect.Option>
                              {templates.length > 0 && (
                                <AntdSelect.OptGroup label="Apply template">
                                  {templates.map((t) => (
                                    <AntdSelect.Option key={t.id} value={t.id}>
                                      {t.name}{" "}
                                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                                        · {t.tasks.length} task{t.tasks.length === 1 ? "" : "s"}
                                      </span>
                                    </AntdSelect.Option>
                                  ))}
                                </AntdSelect.OptGroup>
                              )}
                            </AntdSelect>
                            <Tooltip title="Add new task (Ctrl+Enter)">
                              <Button type="primary" icon={AddIcon} onClick={addTask}>
                                Add task
                              </Button>
                            </Tooltip>
                          </div>
                        </div>

                        <DragDropContext onDragEnd={handleDragEnd}>
                          <Droppable droppableId="taskList">
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
                              <Tooltip title="Expand (Ctrl+Shift+E)">
                                <Button
                                  type="text"
                                  icon={<ExpandOutlined />}
                                  onClick={() => setPreviewOpen(true)}
                                />
                              </Tooltip>
                              <Tooltip title="Copy (Ctrl+Shift+C)">
                                <Button
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={handleCopy}
                                />
                              </Tooltip>
                              <Tooltip title="Copy & Save (Ctrl+S)">
                                <Button
                                  type="text"
                                  icon={<SaveOutlined />}
                                  onClick={handleCopyAndSavePreview}
                                />
                              </Tooltip>
                            </div>
                          </div>
                          <pre className="script-style">{preview}</pre>
                        </section>
                      }
                    />
                  </div>
                </>
              }
            />
            <Route
              path="/edit-task"
              element={<EditTaskPage settings={settings} />}
            />
            <Route
              path="/settings"
              element={
                <>
                  <PageHeader title="Settings" subtitle="Customize what's included in your report" />
                  <div className="page-body">
                    <SettingsPage
                      settings={settings}
                      toggleSetting={toggleSetting}
                      setProfilePicture={setProfilePicture}
                    />
                  </div>
                </>
              }
            />
            <Route
              path="/reports"
              element={
                <>
                  <PageHeader title="Reports" subtitle="Browse and export your history" />
                  <div className="page-body">
                    <ReportsPage />
                  </div>
                </>
              }
            />
          </Routes>
        </Suspense>
      </main>

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
              handleCopyAndSavePreview();
              setPreviewOpen(false);
            }}
          >
            Copy & Save
          </Button>,
        ]}
      >
        <pre className="script-style preview-modal-body">{preview}</pre>
      </Modal>

      <Modal
        open={saveTemplateOpen}
        onCancel={() => setSaveTemplateOpen(false)}
        onOk={handleSaveTemplate}
        title="Save as template"
        okText="Save template"
        centered
        width={440}
      >
        <p style={{ margin: "0 0 12px", color: "var(--text-muted)", fontSize: 13 }}>
          Capture the current tasks, projects, and icon settings into a reusable
          template. You can apply it later from the Templates dropdown.
        </p>
        <Input
          placeholder="e.g. Backend dev day"
          value={newTemplateName}
          onChange={(e) => setNewTemplateName(e.target.value)}
          onPressEnter={handleSaveTemplate}
          autoFocus
        />
      </Modal>

      <QuickAddFab
        settings={settings.taskSettings}
        onAdd={handleQuickAdd}
        onOpenHome={() => {
          setQuickAddOpen(false);
          navigate("/");
        }}
        onHome={location.pathname === "/"}
        showFab={location.pathname !== "/edit-task"}
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
    </div>
  );
};

export default App;
