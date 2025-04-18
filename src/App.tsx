import "./app.css";
import { AddIcon, minusIcon } from "./assets/fontAwesomeIcons";
import { Alert, Button, DatePicker, Input, Select, Layout, Tooltip, InputRef } from "antd";
import { CheckOutlined, CopyOutlined, SaveOutlined, HomeOutlined, SettingOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import moment from "moment";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import EditTaskPage from "./pages/EditTaskPage";
import { ALERT_DISMISS_TIME, ALL_AVAILABLE_PROJECTS, ALL_STATUS_OPTIONS } from "./constant/task.constant";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const { Option } = Select;
const { Header } = Layout;

interface Task {
  id?: string;
  title: string;
  hours: string | number;
  minutes: string | number;
  status: string;
  icon?: string;
  subtasks?: Omit<Task, "subtasks">[];
}

const App = () => {
  const theme = "light";
  const workingTimeLimit = 8.5;
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
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
  const [date, setDate] = useState(
    localStorage.getItem("date") || new Date().toISOString().split("T")[0]
  );
  const [bulletType, setBulletType] = useState<"bullet" | "dot" | "number" | ">" | ">>" | "=>">("bullet");
  const [copySuccess, setCopySuccess] = useState(false);
  const [nextTaskValue, setNextTaskValue] = useState("");
  const [settings, setSettings] = useState(() => {
    const defaultSettings = {
      taskSettings: JSON.parse(localStorage.getItem("taskSettings") || "{}") || {
        allowSubtask: false,
        showHours: true,
        showStatus: true,
        showDate: true,
        showID: true,
        showNextTask: false,
        showProject: true,
      },
      previewSettings: JSON.parse(localStorage.getItem("previewSettings") || "{}") || {
        allowSubtask: false,
        showHours: true,
        showStatus: true,
        showDate: true,
        showID: true,
        showNextTask: false,
        showProject: true,
      },
      exportSettings: JSON.parse(localStorage.getItem("exportSettings") || "{}") || {
        allowSubtask: false,
        showHours: true,
        showStatus: true,
        showDate: true,
        showID: true,
        showNextTask: true,
        showProject: true,
      },
    };
    return defaultSettings;
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [selectedSubIcon, setSelectedSubIcon] = useState<"bullet" | "dot" | "number" | ">" | ">>" | "=>">("bullet");
  const [copiedPreview, setCopiedPreview] = useState<string | null>(null);
  const taskRefs = useRef<(HTMLInputElement | null)[]>([]);
  const subtaskRefs = useRef<(InputRef | null)[][]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (to: string) => {
    if (location.pathname !== to) {
      navigate(to);
    }
  };

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const calculateRemainingTime = () => {
    const totalTaskTime = tasks.reduce((sum, task) => {
      const subtaskTime =
        task.subtasks?.reduce((subSum, subtask) => {
          const subtaskHours = parseFloat(subtask.hours as string) || 0;
          const subtaskMinutes = (parseFloat(subtask.minutes as string) || 0) / 60;
          return subSum + subtaskHours + subtaskMinutes;
        }, 0) || 0;

      const taskHours = task.subtasks ? 0 : parseFloat(task.hours as string) || 0;
      const taskMinutes = task.subtasks ? 0 : (parseFloat(task.minutes as string) || 0) / 60;

      return sum + taskHours + taskMinutes + subtaskTime;
    }, 0);
    return workingTimeLimit - totalTaskTime;
  };

  const formatRemainingTime = (remainingTime: number) => {
    const hours = Math.floor(Math.abs(remainingTime));
    const minutes = Math.round((Math.abs(remainingTime) - hours) * 60);
    const extra = remainingTime < 0 ? `${hours}h ${minutes}m (Extra hour)` : `${hours}h ${minutes}m`;
    return remainingTime < 0 ? extra : `${hours}h ${minutes}m`;
  };

  const formatTaskTime = (hours: string | number, minutes: string | number, subtasks?: Task[]) => {
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
      const totalHours = totalSubtaskTime.hours + Math.floor(totalSubtaskTime.minutes / 60);

      const timeParts = [];
      if (totalHours > 0) timeParts.push(`${totalHours}h`);
      if (totalMinutes > 0) timeParts.push(`${totalMinutes}min`);
      return timeParts.join(" ").trim();
    }

    const h = parseInt(hours as string) || 0;
    const m = parseInt(minutes as string) || 0;
    const timeParts = [];
    if (h > 0) timeParts.push(`${h}h`);
    if (m > 0) timeParts.push(`${m}min`);
    return timeParts.join(" ").trim();
  };

  const remainingTime = calculateRemainingTime();

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
    Object.keys(settings).forEach((section) => {
      localStorage.setItem(section, JSON.stringify(settings[section as keyof typeof settings]));
    });
  }, [settings]);

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
        const totalHours = totalSubtaskTime.hours + Math.floor(totalSubtaskTime.minutes / 60);

        parentTask.hours = totalHours.toString();
        parentTask.minutes = totalMinutes.toString();
      }
      return updatedTasks;
    });
  };

  const addTask = () => {
    const newTask: Task = {
      id: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
    };
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks, newTask];
      taskRefs.current.push(null);
      return updatedTasks;
    });
    setTimeout(() => {
      if (settings.taskSettings.showID) {
        taskRefs.current[taskRefs.current.length - 1]?.focus();
      } else {
        document.querySelector<HTMLInputElement>('.task-title-input:last-child')?.focus();
      }
    }, 0);
  };

  const addSubtask = (parentIndex: number) => {
    const newSubtask: Task = {
      id: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
      icon: selectedSubIcon,
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
      const subtaskRef = subtaskRefs.current[parentIndex]?.[subtaskRefs.current[parentIndex].length - 1];
      subtaskRef?.focus();
    }, 0);
  };

  const resetForm = () => {
    setTasks([
      {
        id: "",
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
    setTasks((prevTasks) => prevTasks.filter((_, index) => index !== taskIndex));
  };

  const clearSubtask = (parentIndex: number, subtaskIndex: number) => {
    const updatedTasks = [...tasks];
    updatedTasks[parentIndex].subtasks = updatedTasks[
      parentIndex
    ].subtasks?.filter((_, index) => index !== subtaskIndex);
    setTasks(updatedTasks);
  };

  const toggleSetting = (section: keyof typeof settings, key: string, value: any) => {
    setSettings((prev) => {
      const updatedSection = { ...prev[section], [key]: value };
      localStorage.setItem(section, JSON.stringify(updatedSection));
      return { ...prev, [section]: updatedSection };
    });
  };

  const getFormattedPreview = () => {
    const allTasks = tasks.filter((task) => task.title.trim());

    const formatLine = (task: Task, index: number, isSubtask = false) => {
      let line = "";
      if (settings.previewSettings.showID && task.id) {
        line += `ID : ${task.id.trim()} `;
      }
      if (task.icon) {
        const icon = isSubtask ? getTaskIcon(index, selectedSubIcon) : task.icon;
        line += `  ${icon}`;
      }
      line += task.title.trim();
      if (settings.previewSettings.showStatus && task.status)
        line += ` (${task.status.trim()})`;
      if (settings.previewSettings.showHours) {
        const taskTime = formatTaskTime(task.hours, task.minutes, task.subtasks);
        if (taskTime) line += ` (${taskTime})`;
      }
      return line;
    };

    const getTaskIcon = (_: number, type: any) => {
      switch (type) {
        case "dot":
          return "• ";
        case "number":
          return `${_ + 1}. `;
        case ">":
          return "> ";
        case ">>":
          return ">> ";
        case "=>":
          return "=> ";
        case "bullet":
          return "● ";
        default:
          return "- ";
      }
    };

    const formatTasks = (tasks: Task[], level = 0) =>
      tasks
        .map((task, index) => {
          const indent = "  ".repeat(level);
          let line = `${indent}${getTaskIcon(index, bulletType)}${formatLine(task, index)}`;
          if (settings.previewSettings.allowSubtask && task.subtasks && task.subtasks.length > 0) {
            const filteredSubtasks = task.subtasks.filter((subtask) => subtask.title.trim());
            if (filteredSubtasks.length > 0) {
              line += `\n${filteredSubtasks
                .map((subtask, subIndex) =>
                  `${formatLine(subtask, subIndex, true)}`
                )
                .join("\n")}`;
            }
          }
          return line;
        })
        .join("\n");

    return `Today's work update - ${settings.previewSettings.showDate ? moment(date).format("YYYY-MM-DD") || "YYYY-MM-DD" : ""
      }

${settings.previewSettings.showProject
        ? `Project : ${selectedProjects.map((p) => p.trim()).join(" & ") || "Not Selected"
        }\n---------------------\n`
        : ""
      }${formatTasks(allTasks)}${settings.previewSettings.showNextTask && nextTaskValue.trim()
        ? `\n\nNext's Tasks\n---------------------\n=> ${nextTaskValue.trim()}`
        : ""
      }

Thanks & regards
${name.trim()}`;
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
        task.subtasks &&
        task.subtasks.some((subtask) => !subtask.title.trim())
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
        id: settings.taskSettings.showID ? task.id?.trim() : undefined,
        title: task.title.trim(),
        hours: settings.taskSettings.showHours ? task.hours : undefined,
        minutes: settings.taskSettings.showHours ? task.minutes : undefined,
        status: settings.taskSettings.showStatus ? task.status.trim() : undefined,
        icon: task.icon?.trim(),
        subtasks: task.subtasks
          ?.filter((subtask) => subtask.title.trim())
          .map((subtask) => ({
            id: settings.taskSettings.showID ? subtask.id?.trim() : undefined,
            title: subtask.title.trim(),
            hours: settings.taskSettings.showHours ? subtask.hours : undefined,
            minutes: settings.taskSettings.showHours ? subtask.minutes : undefined,
            status: settings.taskSettings.showStatus
              ? subtask.status.trim()
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
    setAlertMessage(
      editingReport
        ? "Record updated successfully!"
        : "Record saved successfully!"
    );

    setTasks([
      {
        id: "",
        title: "",
        hours: "",
        minutes: "",
        status: "Completed",
      },
    ]);
    setNextTaskValue("");
    setEditingReport(null);
  };

  return (
    <Layout className={`app-container ${theme}`}>
      <Header className="header">
        <div className="header-content">
          <div className="logo">
            <img src={"/test-1.png"} alt="Logo" />
          </div>
          <div className="header-title">
            <span>🎉 R3p0rt M@nag3r 🎨</span>
          </div>
          <div className="nav-links">
            <NavLink
              to="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/");
              }}
              className={({ isActive }) => `nav-link ${isActive ? "active-link" : ""}`}
            >
              <HomeOutlined className="nav-icon" /> Home
            </NavLink>
            <NavLink
              to="/settings"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/settings");
              }}
              className={({ isActive }) => `nav-link ${isActive ? "active-link" : ""}`}
            >
              <SettingOutlined className="nav-icon" /> Settings
            </NavLink>
            <NavLink
              to="/reports"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/reports");
              }}
              className={({ isActive }) => `nav-link ${isActive ? "active-link" : ""}`}
            >
              <FileTextOutlined className="nav-icon" /> Reports
            </NavLink>
          </div>
        </div>
      </Header>
      <TransitionGroup>
        <CSSTransition
          key={location.key}
          classNames="page"
          timeout={300}
        >
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
                        <div className="input-group" style={{ width: "140px", display: settings.taskSettings.showDate ? "block" : "none" }} >
                          <label htmlFor="date">Date</label>
                          <DatePicker
                            id="date"
                            value={date ? moment(date, "YYYY-MM-DD") : null}
                            format="YYYY-MM-DD"
                            onChange={(_, dateString) =>
                              setDate(dateString as string)
                            }
                            style={{ width: "100%" }}
                          />
                        </div>

                        <div className="input-group" style={{ width: "120px" }}>
                          <label htmlFor="bulletType">Task Icon</label>
                          <Select
                            id="bulletType"
                            value={bulletType}
                            onChange={(value) => setBulletType(value as any)}
                            style={{ width: "100%" }}
                          >
                            <Option value="bullet">•</Option>
                            <Option value="number">1</Option>
                            <Option value={">"}>{">"}</Option>
                            <Option value={"=>"}>{"=>"}</Option>
                          </Select>
                        </div>
                        <div className="input-group" style={{ width: "120px", display: settings.taskSettings.allowSubtask ? "block" : "none" }}>
                          <label htmlFor="icon">Sub Icon</label>
                          <Select
                            id="icon"
                            placeholder="Select icon"
                            value={selectedSubIcon}
                            onChange={(value) => setSelectedSubIcon(value)}
                            style={{ width: "100%" }}
                          >
                            <Option value="bullet">•</Option>
                            <Option value="number">1</Option>
                            <Option value={">"}>{">"}</Option>
                            <Option value={"=>"}>{"=>"}</Option>
                          </Select>
                        </div>
                        <div className="input-group" style={{ width: "300px", display: settings.taskSettings.showProject ? "block" : "none" }}>
                          <label htmlFor="project">Project</label>
                          <Select
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
                            {ALL_AVAILABLE_PROJECTS.map((project) => (
                              <Option key={project} value={project}>
                                {project}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="task-details-section">
                      <div className="task-details-header">
                        <h4>Task Details</h4>
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
                        <div className="button-group">
                          <Tooltip title="Add a new task">
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
                          <Tooltip title="Reset all tasks">
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
                        </div>
                      </div>
                      <div
                        className="task-details-inputs"
                        style={{ marginTop: "10px" }}
                      >
                        {tasks.map((task, index) => (
                          <div key={`task-${index}`}>
                            <div
                              className="task-row"
                              style={{
                                gridTemplateColumns: settings.taskSettings.showID
                                  ? "1fr 3fr 1fr 1fr 1fr auto auto"
                                  : "3fr 1fr 1fr 1fr auto auto",
                              }}
                            >
                              {settings.taskSettings.showID && (
                                <div className="input-group id-field">
                                  <Input
                                    ref={(el) => {
                                      taskRefs.current[index] = el?.input || null;
                                    }}
                                    className="task-id-input"
                                    placeholder="Task ID"
                                    value={task.id || ""}
                                    onChange={(e) =>
                                      handleTaskChange(index, "id", e.target.value)
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
                                />
                              </div>
                              {settings.taskSettings.showHours && (
                                <div className="input-group">
                                  <Input
                                    type="number"
                                    placeholder="Hours"
                                    value={task.subtasks?.length ? task.hours : task.hours}
                                    onChange={(e) => {
                                      const value = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                                      if (!task.subtasks?.length) {
                                        handleTaskChange(index, "hours", value);
                                      }
                                    }}
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
                                    value={task.subtasks?.length ? task.minutes : task.minutes}
                                    onChange={(e) => {
                                      const value = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                                      if (!task.subtasks?.length) {
                                        handleTaskChange(index, "minutes", value);
                                      }
                                    }}
                                    disabled={!!task.subtasks?.length}
                                    min={0}
                                    max={59}
                                  />
                                </div>
                              )}
                              {settings.taskSettings.showStatus && (
                                <div className="input-group">
                                  <Select
                                    placeholder="Select status"
                                    value={task.status}
                                    onChange={(value) =>
                                      handleTaskChange(index, "status", value)
                                    }
                                    style={{ width: "100%" }}
                                  >
                                    {ALL_STATUS_OPTIONS.map((status) => (
                                      <Option key={status} value={status}>
                                        {status}
                                      </Option>
                                    ))}
                                  </Select>
                                </div>
                              )}
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
                                style={{ display: settings.taskSettings.allowSubtask ? "flex" : "none" }}
                              >
                                {AddIcon}
                              </div>
                            </div>
                            {task.subtasks &&
                              task.subtasks.map((subtask, subIndex) => (
                                <div
                                  className="task-row subtask-row"
                                  key={`subtask-${index}-${subIndex}`}
                                  style={{
                                    gridTemplateColumns: settings.taskSettings.showID
                                      ? "1fr 3fr 1fr 1fr 1fr auto auto"
                                      : "3fr 1fr 1fr 1fr auto auto",
                                  }}
                                >
                                  {settings.taskSettings.showID && (
                                    <div className="input-group id-field">
                                      <Input
                                        ref={(el) => {
                                          if (!subtaskRefs.current[index]) {
                                            subtaskRefs.current[index] = [];
                                          }
                                          subtaskRefs.current[index][subIndex] = el || null;
                                        }}
                                        style={{
                                          visibility: "hidden"
                                        }}
                                        className="task-id-input"
                                        placeholder="Subtask ID"
                                        value={subtask.id || ""}
                                        onChange={(e) =>
                                          handleSubtaskChange(
                                            index,
                                            subIndex,
                                            "id",
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
                                          const value = Math.min(23, Math.max(0, parseInt(e.target.value) || 0));
                                          handleSubtaskChange(index, subIndex, "hours", value);
                                        }}
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
                                          const value = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                                          handleSubtaskChange(index, subIndex, "minutes", value);
                                        }}
                                        min={0}
                                        max={59}
                                      />
                                    </div>
                                  )}
                                  {settings.taskSettings.showStatus && (
                                    <div className="input-group">
                                      <Select
                                        placeholder="Select status"
                                        value={subtask.status}
                                        onChange={(value) =>
                                          handleSubtaskChange(
                                            index,
                                            subIndex,
                                            "status",
                                            value
                                          )
                                        }
                                        style={{ width: "100%" }}
                                      >
                                        {ALL_STATUS_OPTIONS.map((status) => (
                                          <Option key={status} value={status}>
                                            {status}
                                          </Option>
                                        ))}
                                      </Select>
                                    </div>
                                  )}
                                  <div
                                    className="clear-task-circle"
                                    onClick={() =>
                                      clearSubtask(index, subIndex)
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
                        ))}
                      </div>
                      {settings.taskSettings.showNextTask && (
                        <div className="input-group" style={{ marginTop: "20px" }}>
                          <Input
                            id="nextTask"
                            placeholder="Enter next task"
                            value={nextTaskValue}
                            onChange={(e) => setNextTaskValue(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="task-preview-container">
                    <div className="task-preview-header">
                      <h3>Preview</h3>
                      <div className="button-group">
                        <Tooltip title="Copy to Clipboard">
                          <Button
                            type="default"
                            icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
                            onClick={handleCopy}
                            title="Copy"
                            className="copy-btn"
                          />
                        </Tooltip>
                        <Tooltip title="Save Preview">
                          <Button
                            type="default"
                            icon={<SaveOutlined />}
                            onClick={savePreview}
                            title="Save"
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
            <Route path="/edit-task" element={<EditTaskPage />} />
            <Route
              path="/settings"
              element={
                <SettingsPage settings={settings} toggleSetting={toggleSetting} />
              }
            />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </CSSTransition>
      </TransitionGroup>
      {copiedPreview && (
        <div style={{
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
        }}>
          <strong style={{ color: "#4caf50" }}>Copied Preview:</strong>
          <div style={{ marginTop: "8px" }}>{copiedPreview}</div>
        </div>
      )}
    </Layout>
  );
};

export default App;
