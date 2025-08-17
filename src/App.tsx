import "./app.css";

import {
  ALERT_DISMISS_TIME,
  ALL_BULLET_TYPES,
  ALL_STATUS_OPTIONS,
  ALL_AVAILABLE_PROJECTS,
} from "./constant/task.constant";
import { AddIcon, minusIcon } from "./assets/fontAwesomeIcons";
import {
  Alert,
  Avatar,
  Button,
  DatePicker,
  Input,
  InputRef,
  Layout,
  Select as AntdSelect,
  Dropdown,
  Menu,
  Tooltip
} from "antd";
import {
  CheckOutlined,
  CopyOutlined,
  FileTextOutlined,
  HomeOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LogoutOutlined
} from "@ant-design/icons";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { MenuOutlined } from "@ant-design/icons";
import EditTaskPage from "./pages/EditTaskPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import dayjs from "dayjs";
import { getBullet } from "./utils/icon.utils";
import { reverseDate } from "./utils/dateUtils";
import LoginPage from "./components/LoginPage";

const { Option } = AntdSelect;
const { Header } = Layout;
interface Task {
  taskId?: string;
  title: string;
  hours: string | number;
  minutes: string | number;
  status: string;
  icon?: string;
  subtasks?: Omit<Task, "subtasks">[];
  view?: boolean; // New: controls visibility in preview
}
// Define a static notification time
const NOTIFICATION_TIME = "06:00 PM";

const getProjectsFromStorage = () => {
  const stored = localStorage.getItem("allProjects");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch { }
  }
  return ALL_AVAILABLE_PROJECTS;
};

const App = () => {
  const theme = "light";
  const workingTimeLimit = 8.5;
  const [tasks, setTasks] = useState<Task[]>([
    {
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
      view: true, // Default to true
    },
  ]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedProjects") || "[]");
    } catch {
      return [];
    }
  });
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulletType, setBulletType] = useState<
    "bullet" | "dot" | "number" | ">" | ">>" | "=>"
  >("dot");
  const [copySuccess, setCopySuccess] = useState(false);
  const [nextTaskValue, setNextTaskValue] = useState("");
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      taskSettings: JSON.parse(
        localStorage.getItem("taskSettings") || "{}"
      ) || {
        allowSubtask: false,
        showHours: true,
        showStatus: true,
        showDate: true,
        showID: true,
        showNextTask: false,
        showProject: true,
      },
      previewSettings: JSON.parse(
        localStorage.getItem("previewSettings") || "{}"
      ) || {
        allowSubtask: false,
        showHours: true,
        showStatus: true,
        showDate: true,
        showID: true,
        showNextTask: false,
        showProject: true,
        hideParentTaskTime: false, // New setting to hide parent task time
        hideParentTaskStatus: false, // New setting to hide parent task status
      },
      exportSettings: JSON.parse(
        localStorage.getItem("exportSettings") || "{}"
      ) || {
        allowSubtask: false,
        showHours: true,
        showStatus: true,
        showDate: true,
        showID: true,
        showNextTask: true,
        showProject: true,
      },
      generateSettings: JSON.parse(
        localStorage.getItem("generateSettings") || "{}"
      ) || {
        taskGap: 2,
        subtaskGap: 1,
      },
    };
    return defaultSettings;
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [selectedSubIcon, setSelectedSubIcon] = useState<
    "bullet" | "dot" | "number" | ">" | ">>" | "=>"
  >("dot");
  const [copiedPreview, setCopiedPreview] = useState<string | null>(null);
  const taskRefs = useRef<(HTMLInputElement | null)[]>([]);
  const subtaskRefs = useRef<(InputRef | null)[][]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState(() => {
    try {
      return localStorage.getItem("profilePicture") || "";
    } catch (error) {
      console.error(
        "Failed to retrieve profile picture from localStorage:",
        error
      );
      return ""; // Fallback to an empty string
    }
  });
  // const [currentSmileyIndex, setCurrentSmileyIndex] = useState(0);

  const TASK_GAP = settings.generateSettings.taskGap || 1; // Default to 1 if not set
  const SUBTASK_GAP = settings.generateSettings.subtaskGap || 1; // Default to 1 if not set



  const handleNavigation = (to: string) => {
    if (location.pathname !== to) {
      navigate(to);
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // setCurrentSmileyIndex((prevIndex) => (prevIndex + 1) % SMILYS.length);
  //   }, 2000); // Change smiley every 2 seconds
  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, []);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
      return () => clearTimeout(timer);
    }
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

  const projects = getProjectsFromStorage()


  useEffect(() => {
    Object.keys(settings).forEach((section) => {
      localStorage.setItem(
        section,
        JSON.stringify(settings[section as keyof typeof settings])
      );
    }, [settings]);
  });

  useEffect(() => {
    try {
      localStorage.setItem("profilePicture", profilePicture);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.warn("Profile picture is too large to store in localStorage.");
      } else {
        console.error("Failed to store profile picture:", error);
      }
    }
  }, [profilePicture]);

  const calculateRemainingTime = () => {
    const totalTaskTime = tasks.reduce((sum, task) => {
      const subtaskTime =
        task.subtasks?.reduce((subSum, subtask) => {
          const subtaskHours = parseFloat(subtask.hours as string) || 0;
          const subtaskMinutes =
            (parseFloat(subtask.minutes as string) || 0) / 60;
          return subSum + subtaskHours + subtaskMinutes;
        }, 0) || 0;

      const taskHours = task.subtasks
        ? 0
        : parseFloat(task.hours as string) || 0;
      const taskMinutes = task.subtasks
        ? 0
        : (parseFloat(task.minutes as string) || 0) / 60;

      return sum + taskHours + taskMinutes + subtaskTime;
    }, 0);
    return workingTimeLimit - totalTaskTime;
  };

  const formatRemainingTime = (remainingTime: number) => {
    const hours = Math.floor(Math.abs(remainingTime));
    const minutes = Math.round((Math.abs(remainingTime) - hours) * 60);
    const extra =
      remainingTime < 0
        ? `${hours}h ${minutes}m (Extra hour)`
        : `${hours}h ${minutes}m`;
    return remainingTime < 0 ? extra : `${hours}h ${minutes}m`;
  };

  const formatTaskTime = (
    hours: string | number,
    minutes: string | number,
    subtasks?: Task[]
  ) => {
    if (subtasks && subtasks.length > 0) {
      const totalSubtaskTime = subtasks.reduce(
        (sum, subtask) => {
          const subtaskHours = parseInt(subtask.hours as string) || 0;
          const subtaskMinutes = parseInt(subtask.minutes as string) || 0;
          return {
            hours: sum.hours + subtaskHours,
            minutes: sum.minutes + subtaskMinutes,
          };
        },
        { hours: 0, minutes: 0 }
      );

      const totalMinutes = totalSubtaskTime.minutes % 60;
      const totalHours =
        totalSubtaskTime.hours + Math.floor(totalSubtaskTime.minutes / 60);

      const timeParts = [];
      if (totalHours > 0) timeParts.push(`${totalHours}h`);
      if (totalMinutes > 0) timeParts.push(`${totalMinutes}m`);
      return timeParts.join(" ").trim();
    }

    const h = parseInt(hours as string) || 0;
    const m = parseInt(minutes as string) || 0;
    const timeParts = [];
    if (h > 0) timeParts.push(`${h}h`);
    if (m > 0) timeParts.push(`${m}m`);
    return timeParts.join(" ").trim();
  };

  const remainingTime = calculateRemainingTime();

  const handleTaskChange = (
    index: number,
    field: keyof Task,
    value: string | number
  ) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[index] = {
        ...updatedTasks[index],
        [field]: value,
      };
      return updatedTasks;
    });
  };

  const handleSubtaskChange = (
    parentIndex: number,
    subtaskIndex: number,
    field: keyof Task,
    value: string | number
  ) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      const parentTask = updatedTasks[parentIndex];
      if (parentTask.subtasks) {
        parentTask.subtasks[subtaskIndex] = {
          ...parentTask.subtasks[subtaskIndex],
          [field]: value,
        };

        const totalSubtaskTime = parentTask.subtasks.reduce(
          (sum, subtask) => {
            const subtaskHours = parseInt(subtask.hours as string) || 0;
            const subtaskMinutes = parseInt(subtask.minutes as string) || 0;
            return {
              hours: sum.hours + subtaskHours,
              minutes: sum.minutes + subtaskMinutes,
            };
          },
          { hours: 0, minutes: 0 }
        );

        const totalMinutes = totalSubtaskTime.minutes % 60;
        const totalHours =
          totalSubtaskTime.hours + Math.floor(totalSubtaskTime.minutes / 60);

        parentTask.hours = totalHours.toString();
        parentTask.minutes = totalMinutes.toString();
      }
      return updatedTasks;
    });
  };

  // Utility function to generate unique IDs

  const addTask = () => {
    const newTask: Task = {
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
      view: true, // Default to true
    };
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks, newTask];
      taskRefs.current.push(null);
      return updatedTasks;
    });
    setTimeout(() => {
      if (settings.taskSettings.showID) {
        const lastTaskRef = taskRefs.current[taskRefs.current.length - 1];
        lastTaskRef?.focus();
      } else {
        const titleInput =
          document.querySelectorAll<HTMLInputElement>(".task-title-input");
        titleInput[titleInput.length - 1]?.focus();
      }
    }, 0);
  };

  const addSubtask = (parentIndex: number) => {
    const newSubtask: Task = {
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
      icon: selectedSubIcon,
      view: true, // Default to true
    };
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      if (!updatedTasks[parentIndex].subtasks) {
        updatedTasks[parentIndex].subtasks = [];
        subtaskRefs.current[parentIndex] = [];
      }
      updatedTasks[parentIndex].subtasks.push(newSubtask);
      subtaskRefs.current[parentIndex].push(null);
      return updatedTasks;
    });
    setTimeout(() => {
      const subtaskRef =
        subtaskRefs.current[parentIndex]?.[
        subtaskRefs.current[parentIndex].length - 1
        ];
      subtaskRef?.focus();
    }, 0);
  };

  const resetForm = () => {
    setTasks([
      {
        taskId: "",
        title: "",
        hours: "",
        minutes: "",
        status: "Completed",
      },
    ]);
    setNextTaskValue("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  const clearTask = (taskIndex: number) => {
    setTasks((prevTasks) =>
      prevTasks.filter((_, index) => index !== taskIndex)
    );
  };

  const clearSubtask = (parentIndex: number, subtaskIndex: number) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[parentIndex].subtasks = updatedTasks[
        parentIndex
      ].subtasks?.filter((_, index) => index !== subtaskIndex);
      return updatedTasks;
    });
  };

  const toggleSetting = (
    section: keyof typeof settings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => {
      const updatedSection = { ...prev[section], [key]: value };
      localStorage.setItem(section, JSON.stringify(updatedSection));
      return { ...prev, [section]: updatedSection };
    });
  };

  const getFormattedPreview = () => {
    const allTasks = tasks.filter((task) => task.title.trim() && (task.view !== false));

    const formatLine = (task: Task, index: number, isSubtask = false) => {
      let line = "";
      if (settings.previewSettings.showID && task.taskId) {
        line += `ID : ${task.taskId.trim()} `;
      }
      if (task.icon) {
        const icon = isSubtask ? getBullet(selectedSubIcon, index) : task.icon;
        line += `  ${icon}`;
      }
      line += task.title.trim();
      if (
        settings.previewSettings.showStatus &&
        task?.status.trim() &&
        !(
          settings.previewSettings.hideParentTaskStatus &&
          (task.subtasks?.length ?? 0) > 0
        )
      ) {
        line += ` (${task?.status.trim()})`;
      }
      if (
        settings.previewSettings.showHours &&
        !(
          settings.previewSettings.hideParentTaskTime &&
          (task.subtasks?.length ?? 0) > 0
        )
      ) {
        const taskTime = formatTaskTime(
          task.hours,
          task.minutes,
          task.subtasks
        );
        if (taskTime) line += ` (${taskTime})`;
      }
      return line;
    };

    const formatTasks = (tasks: Task[], level = 0) =>
      tasks
        .filter((task) => task.view !== false)
        .map((task, index) => {
          const indent = "  ".repeat(level);
          let line = `${indent}${getBullet(bulletType, index)}${formatLine(
            task,
            index
          )}`;
          if (
            settings.previewSettings.allowSubtask &&
            task.subtasks &&
            task.subtasks.length > 0
          ) {
            const filteredSubtasks = task.subtasks.filter((subtask) => subtask.title.trim() && (subtask.view !== false));
            if (filteredSubtasks.length > 0) {
              line += `\n${filteredSubtasks
                .map(
                  (subtask, subIndex) =>
                    `${formatLine(subtask, subIndex, true)}`
                )
                .join("\n".repeat(SUBTASK_GAP))}`;
            }
          }
          return line;
        })
        .join("\n".repeat(TASK_GAP));

    const workUpdateText =
      settings.generateSettings.workUpdateText || "Today's work update -";
    const closingText =
      settings.generateSettings.closingText || "Thanks & regards";

    const lineAfterWorkUpdate = settings.previewSettings
      .allowLineAfterWorkUpdate
      ? "-".repeat(settings.previewSettings.lineAfterWorkUpdate || 3)
      : "";
    const lineAfterProject = settings.previewSettings.allowLineAfterProject
      ? "-".repeat(settings.previewSettings.lineAfterProject || 3)
      : "";
    const lineAfterNextTask = settings.previewSettings.allowLineAfterNextTask
      ? "-".repeat(settings.previewSettings.lineAfterNextTask || 3)
      : "";
    const lineBeforeClosingText = settings.previewSettings
      .allowLineBeforeClosingText
      ? "-".repeat(settings.previewSettings.lineBeforeClosingText || 3)
      : "";

    const previewLines = [
      `${workUpdateText}${settings.previewSettings.showDate ? " " + reverseDate(date) : ""
      }`,
      lineAfterWorkUpdate,
      settings.previewSettings.showProject
        ? `Project : ${selectedProjects.map((p) => p.trim()).join(" & ") || "Not Selected"
        }`
        : "",
      settings.previewSettings.allowLineAfterProject
        ? lineAfterProject
        : "",
      !settings.previewSettings.allowLineAfterProject ? "" : "",
      formatTasks(allTasks),
      settings.previewSettings.showNextTask && nextTaskValue.trim()
        ? `\nNext's Tasks\n${lineAfterNextTask}\n=> ${nextTaskValue.trim()}`
        : "",
      lineBeforeClosingText,
      closingText,
      name.trim(),
    ]
      .filter((line, idx) => {
        if (idx === 4 && !settings.previewSettings.allowLineAfterProject) return true;
        return line && line.trim() !== "";
      })
      .join("\n");

    return previewLines;
  };

  const handleCopy = () => {
    const preview = getFormattedPreview();
    navigator.clipboard.writeText(preview);
    setCopiedPreview(preview);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
      setCopiedPreview(null);
    }, 2000);
  };

  const handleCopyAndSavePreview = () => {
    handleCopy(); // First copy the preview
    savePreview(); // Then save the preview
  };

  const savePreview = () => {
    const missingFields: string[] = [];

    if (!name.trim()) missingFields.push("Name");
    if (!date.trim()) missingFields.push("Date");

    const filteredTasks = tasks.filter((task) => task.title.trim());

    if (filteredTasks.length === 0) {
      setAlertMessage("No task added");
      setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
      return;
    }

    const hasEmptySubtask = filteredTasks.some(
      (task) =>
        task.subtasks && task.subtasks.some((subtask) => !subtask.title.trim())
    );

    if (hasEmptySubtask) {
      setAlertMessage("Subtasks cannot have empty titles");
      setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
      return;
    }

    if (missingFields.length > 0) {
      setAlertMessage(
        `The following fields are required : ${missingFields.join(", ")}`
      );
      setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
      return;
    }

    const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");

    if (!editingReport && savedReports[date]) {
      setAlertMessage(`A record already exists for the date: ${date}`);
      setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
      return;
    }

    const previewData = {
      date,
      tasks: filteredTasks.map((task) => ({
        taskId: settings.taskSettings.showID ? task.taskId?.trim() : undefined,
        title: task.title.trim(),
        hours: settings.taskSettings.showHours ? task.hours : undefined,
        minutes: settings.taskSettings.showHours ? task.minutes : undefined,
        status: settings.taskSettings.showStatus
          ? task?.status.trim()
          : undefined,
        icon: task.icon?.trim(),
        subtasks: task.subtasks
          ?.filter((subtask) => subtask.title.trim())
          .map((subtask) => ({
            taskId: settings.taskSettings.showID
              ? subtask.taskId?.trim()
              : undefined,
            title: subtask.title.trim(),
            hours: settings.taskSettings.showHours ? subtask.hours : undefined,
            minutes: settings.taskSettings.showHours
              ? subtask.minutes
              : undefined,
            status: settings.taskSettings.showStatus
              ? subtask?.status.trim()
              : undefined,
            icon: subtask.icon?.trim(),
          })),
      })),
      selectedProjects: settings.taskSettings.showProject
        ? selectedProjects.map((p) => p.trim())
        : [],
      name: settings.taskSettings.showDate ? name.trim() : undefined,
      nextTask:
        settings.taskSettings.showNextTask && nextTaskValue.trim()
          ? nextTaskValue.trim()
          : undefined,
      bulletType,
      subIcon: selectedSubIcon,
    };

    savedReports[date] = previewData;
    localStorage.setItem("reports", JSON.stringify(savedReports));

    // Copy preview to clipboard
    const preview = getFormattedPreview();
    navigator.clipboard.writeText(preview);
    setCopiedPreview(preview);
    setCopySuccess(true);

    setAlertMessage(
      editingReport
        ? "Record updated and copied successfully!"
        : "Record saved and copied successfully!"
    );

    setTasks([
      {
        taskId: "",
        title: "",
        hours: "",
        minutes: "",
        status: "Completed",
      },
    ]);
    setNextTaskValue("");
    setEditingReport(null);

    setTimeout(() => {
      setCopySuccess(false);
      setCopiedPreview(null);
    }, 2000);
  };

  const parseTimeString = (timeString: string): Date | null => {
    const [time, modifier] = timeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    if (isNaN(hours) || isNaN(minutes)) return null;

    const date = new Date();
    date.setHours(modifier === "PM" && hours < 12 ? hours + 12 : hours % 12);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;
  };

  const scheduleNotification = (timeString: string, message: string) => {
    const targetTime = parseTimeString(timeString)?.getTime();
    if (!targetTime) {
      console.error("Invalid time string:", timeString);
      return;
    }

    const currentTime = Date.now();
    const delay = targetTime - currentTime;

    if (delay > 0) {
      console.log(`Notification scheduled in ${delay / 1000} seconds`);
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Reminder", { body: message });
        } else {
          console.warn("Notification permission not granted.");
        }
      }, delay);
    } else {
      console.warn("Notification time has already passed.");
    }
  };

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission !== "granted") {
          console.warn("Notification permission denied.");
        }
      });
    }
    const userName = localStorage.getItem("name");
    const message = userName
      ? `Hey ${userName}, Netflix can wait. Work can't. 😬`
      : "Netflix can wait. Time to slay some tasks! 🎯";

    scheduleNotification(NOTIFICATION_TIME, message);
  }, []); // Run only once on component mount

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (location.pathname !== "/") return; // Ensure hotkeys only work on the App page

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault(); // Prevent default browser behavior
        handleCopy(); // Trigger copy functionality
      } else if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addTask();
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        addTask();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        // Changed from Ctrl+Z to Ctrl+Shift+Z
        e.preventDefault();
        resetForm();
      } else if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleCopyAndSavePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    addTask,
    resetForm,
    handleCopy,
    handleCopyAndSavePreview,
    location.pathname,
  ]);

  // State for selected date to copy tasks from
  const [copyFromDate, setCopyFromDate] = useState<string>();
  const [allReportDates, setAllReportDates] = useState<string[]>([]);

  // Fetch all report dates on mount
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("reports") || "{}");
    const dates = Object.keys(reports).sort((a, b) => b.localeCompare(a)); // Descending order
    setAllReportDates(dates);
  }, []);

  // Handle copy from selected date
  const handleCopyFromDate = (date: string) => {
    setCopyFromDate(date);
    if (date === "none") {
      // Reset to default/empty state when "None" is selected
      setTasks([
        {
          taskId: "",
          title: "",
          hours: "",
          minutes: "",
          status: "Completed",
        },
      ]);
      setSelectedProjects([]);
      setName(localStorage.getItem("name") || "");
      setBulletType("dot");
      setNextTaskValue("");
      setSelectedSubIcon("dot");
      setDate(new Date().toISOString().split("T")[0]);
      return;
    }
    const reports = JSON.parse(localStorage.getItem("reports") || "{}");
    const report = reports[date];
    if (report) {
      setTasks(report.tasks || []);
      setSelectedProjects(report.selectedProjects || []);
      setName(report.name || "");
      setBulletType(report.bulletType || "dot");
      setNextTaskValue(report.nextTask || "");
      setSelectedSubIcon(report.subIcon || "dot");
      setDate(new Date().toISOString().split("T")[0]); // Set to today
    }
  };



  const toggleTaskView = (taskIndex: number) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        view: updatedTasks[taskIndex].view === false ? true : false,
      };
      return updatedTasks;
    });
  };

  const toggleSubtaskView = (parentIndex: number, subtaskIndex: number) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      if (updatedTasks[parentIndex].subtasks) {
        updatedTasks[parentIndex].subtasks[subtaskIndex] = {
          ...updatedTasks[parentIndex].subtasks[subtaskIndex],
          view: updatedTasks[parentIndex].subtasks[subtaskIndex].view === false ? true : false,
        };
      }
      return updatedTasks;
    });
  };
  if (!isLoggedIn) {
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
      return null;
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return; // dropped outside list

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    // If dropped at same place, do nothing
    if (sourceIndex === destIndex) return;

    // Make a copy of tasks
    const updatedTasks = Array.from(tasks);

    // Remove the dragged item
    const [movedTask] = updatedTasks.splice(sourceIndex, 1);

    // Insert it at the new position
    updatedTasks.splice(destIndex, 0, movedTask);

    // Update state
    setTasks(updatedTasks);
  };

  return (
    <Layout className={`app-container ${theme}`}>
      <Header className="header">
        <div className="header-content">
          {/* <div className="logo" onClick={() => handleNavigation("/")}>
            <img
              src={SMILYS[currentSmileyIndex]} // Display the current smiley
              alt="Logo"
              className="rounded-logo" // Add class for rounded style
              style={{ transition: "opacity 0.5s ease" }} // Smooth transition
            />
          </div> */}
          <div className="header-title">
            <span className="title-icon report">📊</span>
            <span className="title-text gradient-text bouncy-title">
              {Array.from('R3p0rt M@nag3r').map((ch, i) => (
                <span className="bouncy-letter" style={{ '--i': i } as React.CSSProperties} key={i}>{ch === ' ' ? '\u00A0' : ch}</span>
              ))}
            </span>
            <span className="title-icon notebook">📒</span>
          </div>
          <div className="nav-links">
            <NavLink
              to="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/");
              }}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active-link" : ""}`
              }
            >
              <HomeOutlined className="nav-icon" /> Home
            </NavLink>
            <NavLink
              to="/settings"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/settings");
              }}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active-link" : ""}`
              }
            >
              <SettingOutlined className="nav-icon" /> Settings
            </NavLink>
            <NavLink
              to="/reports"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/reports");
              }}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active-link" : ""}`
              }
            >
              <FileTextOutlined className="nav-icon" /> Reports
            </NavLink>
          </div>
          <div className="profile-avatar">
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="logout" onClick={handleLogout}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LogoutOutlined style={{ fontSize: 16 }} /> Logout
                    </span>
                  </Menu.Item>
                </Menu>
              }
              placement="bottomRight"
              trigger={["click"]}
            >
              <Avatar
                src={profilePicture || undefined}
                size="large"
                style={{
                  cursor: "pointer",
                  backgroundColor: profilePicture ? "transparent" : "#f56a00",
                }}

              >
                {!profilePicture && name ? name[0].toUpperCase() : null}
              </Avatar>
            </Dropdown>
          </div>
        </div>
      </Header>
      <div key={location.key} >
        <Routes location={location}>
          <Route
            path="/"
            element={
              <div className="content">
                <div className="task-input-container">
                  {alertMessage && (
                    <Alert
                      message={alertMessage}
                      type={
                        alertMessage.includes("successfully")
                          ? "success"
                          : "error"
                      }
                      closable
                      onClose={() => setAlertMessage(null)}
                      style={{ marginBottom: "15px" }}
                    />
                  )}
                  <div className="personal-details-section">
                    <h4>Personal Details</h4>
                    <div className="task-info-row">
                      <div className="input-group">
                        <label htmlFor="name">Name</label>
                        <Input
                          id="name"
                          placeholder="Enter name"
                          value={name}
                          required
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div
                        className="input-group"
                        style={{
                          width: "140px",
                          display: settings.taskSettings.showDate
                            ? "block"
                            : "none",
                        }}
                      >
                        <label htmlFor="date">Date</label>
                        <DatePicker
                          id="date"
                          value={date ? dayjs(date, "YYYY-MM-DD") : null} // Use dayjs object for value
                          onChange={(date) =>
                            date && setDate(date.format("YYYY-MM-DD"))
                          } // Use dayjs's format method
                          format="DD-MM-YYYY" // Display date in DD-MM-YYYY format
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div className="input-group" style={{ width: "120px" }}>
                        <label htmlFor="bulletType">Task Icon</label>
                        <AntdSelect
                          id="bulletType"
                          value={bulletType}
                          onChange={(value) => setBulletType(value as any)}
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
                          width: "120px",
                          display: settings.taskSettings.allowSubtask
                            ? "block"
                            : "none",
                        }}
                      >
                        <label htmlFor="icon">Sub Icon</label>
                        <AntdSelect
                          id="icon"
                          placeholder="Select icon"
                          value={selectedSubIcon}
                          onChange={(value) => setSelectedSubIcon(value)}
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
                          width: "300px",
                          display: settings.taskSettings.showProject
                            ? "block"
                            : "none",
                        }}
                      >
                        <label htmlFor="project">Project</label>
                        <AntdSelect
                          id="project"
                          mode="multiple"
                          placeholder="Select project(s)"
                          value={selectedProjects}
                          onChange={(value) => setSelectedProjects(value)}
                          style={{ width: "100%" }}
                          getPopupContainer={(triggerNode) =>
                            triggerNode.parentNode
                          }
                        >
                          {projects.map((project: string) => (
                            <Option key={project} value={project}>
                              {project}
                            </Option>
                          ))}
                        </AntdSelect>
                      </div>
                    </div>
                  </div>

                  <div className="task-details-section">
                    <div
                      className="task-details-header"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <h4 style={{ margin: 0, flex: 1 }}>Task Details</h4>
                      <div className="time-info">
                        <p className="total-time">
                          Total : <span>8h 30min</span>
                        </p>
                        <p className="remaining-time">
                          Remaining :{" "}
                          <span
                            className={
                              remainingTime < 0
                                ? "time-exceeded"
                                : remainingTime === 0
                                  ? "time-matched"
                                  : "time-in-limit"
                            }
                          >
                            {formatRemainingTime(remainingTime)}
                          </span>
                        </p>
                      </div>
                      <div
                        className="button-group"
                        style={{ marginLeft: "20px" }}
                      >
                        <AntdSelect
                          style={{ width: 180, marginRight: 12 }}
                          value={copyFromDate}
                          onChange={handleCopyFromDate}
                          placeholder="Copy tasks from"
                        >
                          <AntdSelect.Option value="none">
                            None
                          </AntdSelect.Option>
                          {allReportDates.map((d) => (
                            <AntdSelect.Option key={d} value={d}>
                              {dayjs(d, "YYYY-MM-DD").format("DD-MM-YYYY")}
                            </AntdSelect.Option>
                          ))}
                        </AntdSelect>
                        <Tooltip
                          placement="bottom"
                          title="Add a new task (Ctrl+ Enter)"
                        >
                          <Button
                            type="default"
                            icon={AddIcon}
                            onClick={addTask}
                            title="Add Task"
                            className="add-task-btn"
                          >
                            Add Task
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="taskList">
                        {(provided) => (
                          <div
                            className="task-details-inputs"
                            style={{ marginTop: "10px" }}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {tasks.map((task, index) => (
                              <Draggable
                                key={`task-${index}`}
                                draggableId={`task-${index}`}
                                index={index}
                              >
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
                                    <div
                                      className="task-row"
                                      style={{
                                        gridTemplateColumns: (() => {
                                          const showID = settings.taskSettings.showID;
                                          const showStatus = settings.taskSettings.showStatus;
                                          const showHours = settings.taskSettings.showHours;
                                          // Count how many fields are visible
                                          let cols: string[] = [];
                                          cols.push("auto"); // ✅ drag handle column
                                          if (showID) cols.push("1fr");
                                          cols.push("title");
                                          if (showHours) {
                                            cols.push("1fr", "1fr"); // hours, minutes
                                          }
                                          if (showStatus) cols.push("1fr");
                                          // Always add the action columns
                                          cols.push("auto", "auto", "auto");
                                          // Now, set the title column width based on how many fields are visible
                                          let titleColWidth = "3fr";
                                          const visibleFields =
                                            (showID ? 1 : 0) +
                                            (showHours ? 2 : 0) +
                                            (showStatus ? 1 : 0);
                                          switch (visibleFields) {
                                            case 0:
                                              titleColWidth = "6fr";
                                              break;
                                            case 1:
                                              titleColWidth = "5fr";
                                              break;
                                            case 2:
                                              titleColWidth = "4fr";
                                              break;
                                            case 3:
                                              titleColWidth = "3fr";
                                              break;
                                            case 4:
                                              titleColWidth = "2fr";
                                              break;
                                            default:
                                              titleColWidth = "3fr";
                                          }
                                          cols = cols.map((col) =>
                                            col === "title" ? titleColWidth : col
                                          );
                                          return cols.join(" ");
                                        })(),
                                      }}
                                    >
                                      {/* ✅ Drag handle */}
                                      <div
                                        {...provided.dragHandleProps}
                                        className="drag-handle"
                                        title="Drag to reorder"
                                      >
                                        <MenuOutlined />
                                      </div>

                                      {/* === Your existing Task fields unchanged === */}
                                      {settings.taskSettings.showID && (
                                        <div className="input-group id-field">
                                          <Input
                                            ref={(el) => {
                                              taskRefs.current[index] = el?.input || null;
                                            }}
                                            className="task-id-input"
                                            placeholder="Task ID"
                                            value={task.taskId || ""}
                                            onChange={(e) =>
                                              handleTaskChange(index, "taskId", e.target.value)
                                            }
                                          />
                                        </div>
                                      )}
                                      <div className="input-group title-field">
                                        <Input
                                          className="task-title-input"
                                          placeholder="Task Title"
                                          value={task.title}
                                          onChange={(e) =>
                                            handleTaskChange(index, "title", e.target.value)
                                          }
                                          spellCheck={true}
                                        />
                                      </div>
                                      {settings.taskSettings.showHours && (
                                        <div className="input-group">
                                          <Input
                                            type="number"
                                            placeholder="Hours"
                                            value={task.subtasks?.length ? task.hours : task.hours}
                                            onChange={(e) => {
                                              const value = Math.min(
                                                23,
                                                Math.max(0, parseInt(e.target.value) || 0)
                                              );
                                              if (!task.subtasks?.length) {
                                                handleTaskChange(index, "hours", value);
                                              }
                                            }}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            disabled={!!task.subtasks?.length}
                                            min={0}
                                            max={23}
                                          />
                                        </div>
                                      )}
                                      {settings.taskSettings.showHours && (
                                        <div className="input-group">
                                          <Input
                                            type="number"
                                            placeholder="Minutes"
                                            value={
                                              task.subtasks?.length ? task.minutes : task.minutes
                                            }
                                            onChange={(e) => {
                                              const value = Math.min(
                                                59,
                                                Math.max(0, parseInt(e.target.value) || 0)
                                              );
                                              if (!task.subtasks?.length) {
                                                handleTaskChange(index, "minutes", value);
                                              }
                                            }}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            disabled={!!task.subtasks?.length}
                                            min={0}
                                            max={59}
                                          />
                                        </div>
                                      )}
                                      {settings.taskSettings.showStatus && (
                                        <div className="input-group">
                                          <AntdSelect
                                            placeholder="Select status"
                                            value={task?.status || undefined}
                                            onChange={(value) =>
                                              handleTaskChange(index, "status", value || "")
                                            }
                                            optionLabelProp="label"
                                          >
                                            {ALL_STATUS_OPTIONS.map((status) => (
                                              <Option
                                                key={status}
                                                value={status === "None" ? null : status}
                                                label={status}
                                              >
                                                {status}
                                              </Option>
                                            ))}
                                          </AntdSelect>
                                        </div>
                                      )}
                                      <div
                                        className="toggle-view-circle"
                                        onClick={() => toggleTaskView(index)}
                                        title={
                                          task.view === false
                                            ? "Show in Preview"
                                            : "Hide from Preview"
                                        }
                                      >
                                        {task.view === false ? (
                                          <EyeInvisibleOutlined
                                            style={{ color: "#ff9800", fontSize: 18 }}
                                          />
                                        ) : (
                                          <EyeOutlined style={{ color: "#4caf50", fontSize: 18 }} />
                                        )}
                                      </div>
                                      <div
                                        className="clear-task-circle"
                                        onClick={() => clearTask(index)}
                                        title="Delete Task"
                                      >
                                        {minusIcon}
                                      </div>
                                      <div
                                        className="add-task-circle"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addSubtask(index);
                                        }}
                                        title="Add Subtask"
                                        style={{
                                          display: settings.taskSettings.allowSubtask
                                            ? "flex"
                                            : "none",
                                        }}
                                      >
                                        {AddIcon}
                                      </div>
                                    </div>

                                    {/* ✅ Subtasks are OUTSIDE draggable, unchanged */}
                                    {task.subtasks &&
                                      task.subtasks.map((subtask, subIndex) => (
                                        <div
                                          className="task-row subtask-row"
                                          key={`subtask-${index}-${subIndex}`}
                                          style={{
                                            gridTemplateColumns: (() => {
                                              const showID = settings.taskSettings.showID;
                                              const showStatus = settings.taskSettings.showStatus;
                                              const showHours = settings.taskSettings.showHours;
                                              let cols: string[] = [];
                                              cols.push("auto"); // ✅ 
                                              if (showID) cols.push("1fr");
                                              cols.push("title");
                                              if (showHours) cols.push("1fr", "1fr");
                                              if (showStatus) cols.push("1fr");
                                              cols.push("auto", "auto", "auto");
                                              let titleColWidth = "3fr";
                                              const visibleFields =
                                                (showID ? 1 : 0) +
                                                (showHours ? 2 : 0) +
                                                (showStatus ? 1 : 0);
                                              switch (visibleFields) {
                                                case 0:
                                                  titleColWidth = "6fr";
                                                  break;
                                                case 1:
                                                  titleColWidth = "5fr";
                                                  break;
                                                case 2:
                                                  titleColWidth = "4fr";
                                                  break;
                                                case 3:
                                                  titleColWidth = "3fr";
                                                  break;
                                                case 4:
                                                  titleColWidth = "2fr";
                                                  break;
                                                default:
                                                  titleColWidth = "3fr";
                                              }
                                              cols = cols.map((col) =>
                                                col === "title" ? titleColWidth : col
                                              );
                                              return cols.join(" ");
                                            })(),
                                          }}
                                        >
                                          <div
                                            {...provided.dragHandleProps}
                                            className="drag-handle"
                                            title="Drag to reorder"
                                            style={{ opacity: 0 }}
                                          >
                                            <MenuOutlined />
                                          </div>
                                          {/* === All your existing subtask fields unchanged === */}
                                          {settings.taskSettings.showID && (
                                            <div className="input-group id-field">
                                              <Input
                                                ref={(el) => {
                                                  if (!subtaskRefs.current[index]) {
                                                    subtaskRefs.current[index] = [];
                                                  }
                                                  subtaskRefs.current[index][subIndex] = el || null;
                                                }}
                                                style={{ visibility: "hidden" }}
                                                className="task-id-input"
                                                placeholder="Subtask ID"
                                                value={subtask.taskId || ""}
                                                onChange={(e) =>
                                                  handleSubtaskChange(
                                                    index,
                                                    subIndex,
                                                    "taskId",
                                                    e.target.value
                                                  )
                                                }
                                              />
                                            </div>
                                          )}
                                          <div className="input-group title-field">
                                            <Input
                                              ref={(el) => {
                                                if (!subtaskRefs.current[index]) {
                                                  subtaskRefs.current[index] = [];
                                                }
                                                subtaskRefs.current[index][subIndex] = el;
                                              }}
                                              className="task-title-input"
                                              placeholder="Subtask Title"
                                              value={subtask.title}
                                              onChange={(e) =>
                                                handleSubtaskChange(
                                                  index,
                                                  subIndex,
                                                  "title",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </div>
                                          {settings.taskSettings.showHours && (
                                            <div className="input-group">
                                              <Input
                                                type="number"
                                                placeholder="Hours"
                                                value={subtask.hours}
                                                onChange={(e) => {
                                                  const value = Math.min(
                                                    23,
                                                    Math.max(0, parseInt(e.target.value) || 0)
                                                  );
                                                  handleSubtaskChange(
                                                    index,
                                                    subIndex,
                                                    "hours",
                                                    value
                                                  );
                                                }}
                                                onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling on number input
                                                min={0}
                                                max={23}
                                              />
                                            </div>
                                          )}
                                          {settings.taskSettings.showHours && (
                                            <div className="input-group">
                                              <Input
                                                type="number"
                                                placeholder="Minutes"
                                                value={subtask.minutes}
                                                onChange={(e) => {
                                                  const value = Math.min(
                                                    59,
                                                    Math.max(0, parseInt(e.target.value) || 0)
                                                  );
                                                  handleSubtaskChange(
                                                    index,
                                                    subIndex,
                                                    "minutes",
                                                    value
                                                  );
                                                }}
                                                onWheel={(e) => e.currentTarget.blur()} // Prevent scrolling on number input
                                                min={0}
                                                max={59}
                                              />
                                            </div>
                                          )}
                                          {settings.taskSettings.showStatus && (
                                            <div className="input-group">
                                              <AntdSelect
                                                placeholder="Select status"
                                                value={subtask?.status}
                                                onChange={(value) =>
                                                  handleSubtaskChange(
                                                    index,
                                                    subIndex,
                                                    "status",
                                                    value
                                                  )
                                                }
                                                style={{
                                                  width: "100%",
                                                }}
                                                optionLabelProp="label"
                                              >
                                                {ALL_STATUS_OPTIONS.map((status) => (
                                                  <Option
                                                    key={status}
                                                    value={status === "None" ? null : status}
                                                    label={status}
                                                  >
                                                    {status}
                                                  </Option>
                                                ))}
                                              </AntdSelect>
                                            </div>
                                          )}
                                          <div
                                            className="toggle-view-circle"
                                            onClick={() => toggleSubtaskView(index, subIndex)}
                                            title={
                                              subtask.view === false
                                                ? "Show in Preview"
                                                : "Hide from Preview"
                                            }
                                          >
                                            {subtask.view === false ? (
                                              <EyeInvisibleOutlined
                                                style={{ color: "#ff9800", fontSize: 18 }}
                                              />
                                            ) : (
                                              <EyeOutlined
                                                style={{ color: "#4caf50", fontSize: 18 }}
                                              />
                                            )}
                                          </div>
                                          <div
                                            className="clear-task-circle"
                                            onClick={
                                              () => clearSubtask(index, subIndex) // Use parentIndex and subtaskIndex to remove the subtask
                                            }
                                            title="Delete Subtask"
                                          >
                                            {minusIcon}
                                          </div>
                                          <div
                                            className="add-task-circle"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              addSubtask(index);
                                            }}
                                            title="Add Subtask"
                                            style={{ visibility: "hidden" }}
                                          >
                                            {AddIcon}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    {settings.taskSettings.showNextTask && (
                      <div
                        className="input-group"
                        style={{ marginTop: "20px" }}
                      >
                        <Input
                          id="nextTask"
                          placeholder="Enter next day's task"
                          value={nextTaskValue}
                          onChange={(e) => setNextTaskValue(e.target.value)}
                          spellCheck={true} // Enable spell checking
                        />
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Tooltip
                      title="Reset all tasks (Ctrl+Z)"
                      placement="bottom"
                    >
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={resetForm}
                        title="Reset Form"
                        className="reset-btn"
                        style={{ marginLeft: "10px" }}
                      >
                        Reset
                      </Button>
                    </Tooltip>
                    <Tooltip
                      placement="bottom"
                      title="Copy & Save Preview (Ctrl+S)"
                    >
                      <Button
                        onClick={handleCopyAndSavePreview}
                        type="default"
                        icon={<SaveOutlined />}
                        className="save-task-btn"
                      >
                        Copy & Save
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                <div className="task-preview-container">
                  <div className="task-preview-header">
                    <h3>Preview</h3>
                    <div className="button-group">
                      <Tooltip
                        title="Copy to Clipboard (Ctrl+Shift+C)"
                        placement="bottom"
                      >
                        <Button
                          type="default"
                          icon={
                            copySuccess ? <CheckOutlined /> : <CopyOutlined />
                          }
                          onClick={handleCopy}
                          title="Copy"
                          className="copy-btn"
                        />
                      </Tooltip>
                      <Tooltip title="Copy & Save Preview (Ctrl+S)">
                        <Button
                          type="default"
                          icon={<SaveOutlined />}
                          onClick={handleCopyAndSavePreview}
                          title="Copy & Save"
                          className="save-btn"
                          style={{ marginLeft: "10px" }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <pre
                    className="script-style"
                    style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                  >
                    {getFormattedPreview()}
                  </pre>
                </div>
              </div>
            }
          />
          <Route
            path="/edit-task"
            element={<EditTaskPage settings={settings} />}
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                settings={settings}
                toggleSetting={toggleSetting}
                setProfilePicture={setProfilePicture}
              />
            }
          />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
      {copiedPreview && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "16px",
            backgroundColor: "#333",
            color: "#fff",
            border: "1px solid #555",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            borderRadius: "8px",
            zIndex: 9999,
            maxWidth: "400px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <strong style={{ color: "#4caf50" }}>Copied Preview:</strong>
          <div style={{ marginTop: "8px" }}>{copiedPreview}</div>
        </div>
      )}
    </Layout>
  );
};

export default App;
