/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./app.css";

import { AddIcon, deleteIcon ,minusIcon} from "./assets/fontAwesomeIcons";
import { Alert, Button, DatePicker, Input, Select, Layout, Menu, Tooltip } from "antd"; // Import Ant Design components
import {
  CheckOutlined,
  CopyOutlined,
  SaveOutlined,
  HomeOutlined,
  SettingOutlined,
  FileTextOutlined,
  ReloadOutlined, // Import the refresh icon
} from "@ant-design/icons";
import {
  Link,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { InputRef } from "antd";
import moment from "moment";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import EditTaskPage from "./pages/EditTaskPage";
import { ALERT_DISMISS_TIME, ALL_AVAILABLE_PROJECTS, ALL_STATUS_OPTIONS } from "./constant/task.constant";
const { Option } = Select;
const { Header } = Layout;

interface Task {
  id: number;
  taskId: string | number;
  title: string;
  hours: string | number;
  minutes: string | number; // Add minutes field
  status: string;
}

const App = () => {
  const theme = "light";
  const workingTimeLimit = 8.5; // Total working time in hours
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed", // Default status set to "Completed"
    },
  ]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedProjects") || "[]"); // Ensure valid JSON string
    } catch {
      return []; // Fallback to an empty array if JSON parsing fails
    }
  });
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [date, setDate] = useState(
    localStorage.getItem("date") || new Date().toISOString().split("T")[0]
  );
  const [bulletType, setBulletType] = useState<
    "bullet" | "dot" | "number" | ">" | ">>" | "=>"
  >("bullet");
  const [copySuccess, setCopySuccess] = useState(false);
  const [nextTaskValue, setNextTaskValue] = useState(""); // New state for the next task value
  const [settings, setSettings] = useState({
    showDate: JSON.parse(localStorage.getItem("showDate") || "true"),
    showHours: JSON.parse(localStorage.getItem("showHours") || "true"),
    showID: JSON.parse(localStorage.getItem("showID") || "true"),
    showStatus: JSON.parse(localStorage.getItem("showStatus") || "true"),
    showNextTask: JSON.parse(localStorage.getItem("showNextTask") || "true"),
    showProject: JSON.parse(localStorage.getItem("showProject") || "true"),
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // State for alert message
  const taskIdInputRef = useRef<InputRef[]>([]); // Use an array of refs for multiple tasks
  const [editingReport, setEditingReport] = useState<any | null>(null); // State for editing a report


  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME); // Use the constant here
      return () => clearTimeout(timer); // Cleanup timer on component unmount or alert change
    }
  }, [alertMessage]);

  const calculateRemainingTime = () => {
    const totalTaskTime = tasks.reduce((sum, task) => {
      const taskHours = parseFloat(task.hours as string) || 0;
      const taskMinutes = (parseFloat(task.minutes as string) || 0) / 60; // Convert minutes to hours
      return sum + taskHours + taskMinutes;
    }, 0);
    return workingTimeLimit - totalTaskTime;
  };

  const formatRemainingTime = (remainingTime: number) => {
    const hours = Math.floor(remainingTime);
    const minutes = Math.round((remainingTime - hours) * 60);
    return `${hours}h and ${minutes}m`;
  };

  const formatTaskTime = (hours: string | number, minutes: string | number) => {
    const h = parseInt(hours as string) || 0;
    const m = parseInt(minutes as string) || 0;
    let timeString = "";
    if (h > 0) timeString += `${h}h`; // Only include hours if greater than 0
    if (m > 0) timeString += ` ${m}min`; // Only include minutes if greater than 0
    return timeString.trim(); // Remove any leading/trailing spaces
  };

  const remainingTime = calculateRemainingTime();
  const isTimeExceeded = remainingTime < 0;

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
    Object.keys(settings).forEach((key) => {
      localStorage.setItem(
        key,
        JSON.stringify(settings[key as keyof typeof settings])
      );
    });
  }, [settings]);

  const handleTaskChange = (
    index: number,
    field: keyof Task, // Explicitly define the field as a key of Task
    value: string | number
  ) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value as never; // Cast value to 'never' to satisfy TypeScript
    setTasks(updatedTasks);
  };

  const addTask = () => {
    const newTask: Task = {
      id: tasks.length + 1,
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed", // Default status set to "Completed"
    };
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks, newTask];
      setTimeout(() => {
        const lastTaskIndex = updatedTasks.length - 1;
        if (settings.showID) {
          taskIdInputRef.current[lastTaskIndex]?.focus(); // Focus on Task ID if visible
        } else {
          document
            .querySelectorAll<HTMLInputElement>(".task-title-input")[lastTaskIndex]?.focus(); // Focus on Title if Task ID is hidden
        }
      }, 0);
      return updatedTasks;
    });
  };

  const resetForm = () => {
    setTasks([
      {
        id: 1,
        taskId: "",
        title: "",
        hours: "",
        minutes: "",
        status: "Completed",
      },
    ]);
    setNextTaskValue("");
    setDate(new Date().toISOString().split("T")[0]); // Reset to today's date
  };

  const clearTask = (taskId: number) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  };

  const toggleSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getFormattedPreview = () => {
    const allTasks = tasks; // Include all tasks without filtering

    const formatLine = (task: Task, _: number) => {
      let line = "";
      if (settings.showID && task.taskId) {
        line += `ID: ${task.taskId.toString().trim()} - `; // Trim Task ID
      }
      line += task.title.trim(); // Trim Title
      if (settings.showStatus && task.status)
        line += ` (${task.status.trim()})`; // Trim Status
      if (settings.showHours) {
        const taskTime = formatTaskTime(task.hours, task.minutes);
        if (taskTime) line += ` (${taskTime})`; // Only include time if it's not empty
      }
      return line;
    };

    const getBullet = (_: number) => {
      switch (bulletType) {
        case "dot":
          return "• "; // Use a dot bullet
        case "number":
          return `${_ + 1}. `; // Use numbers
        case ">":
          return "> "; // Use a single arrow
        case ">>":
          return ">> "; // Use a double arrow
        case "=>":
          return "=> "; // Use an arrow with equals
        case "bullet":
          return "● "; // Use a bold dot
        default:
          return "- "; // Default fallback
      }
    };

    const formatTasks = (tasks: Task[]) =>
      tasks
        .map((task, index) => `${getBullet(index)}${formatLine(task, index)}`)
        .join("\n");

    return `Today's work update - ${settings.showDate ? moment(date).format("YYYY-MM-DD") || "YYYY-MM-DD" : ""
      }

${settings.showProject
        ? `Project : ${selectedProjects.map((p) => p.trim()).join(" & ") || "Not Selected"
        }\n---------------------\n`
        : ""
      }${formatTasks(allTasks)}${settings.showNextTask && nextTaskValue.trim()
        ? `\nNext's Tasks\n---------------------\n=> ${nextTaskValue.trim()}`
        : ""
      }

Thanks & regards
${name.trim()}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFormattedPreview());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000); // Revert back after 2 seconds
  };

  const savePreview = () => {
    const missingFields: string[] = [];

    if (!name.trim()) missingFields.push("Name");
    if (!selectedProjects.length) missingFields.push("Project");
    if (!date.trim()) missingFields.push("Date");

    if (missingFields.length > 0) {
      setAlertMessage(
        `The following fields are required : ${missingFields.join(", ")}`
      );
      setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME); // Use the constant here
      return;
    }

    const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");

    if (!editingReport && savedReports[date]) {
      setAlertMessage(`A record already exists for the date: ${date}`);
      setTimeout(() => setAlertMessage(null), ALERT_DISMISS_TIME); // Use the constant here
      return;
    }

    const filteredTasks = tasks.filter((task) => task.title.trim()); // Only include tasks with a title
    const previewData = {
      date, // Save the date in `YYYY-MM-DD` format
      tasks: filteredTasks.map((task) => ({
        taskId: settings.showID ? task.taskId.toString().trim() : undefined, // Trim Task ID
        title: task.title.trim(), // Trim Title
        hours: settings.showHours ? task.hours : undefined,
        minutes: settings.showHours ? task.minutes : undefined, // Include minutes
        status: settings.showStatus ? task.status.trim() : undefined, // Trim Status
      })),
      selectedProjects: settings.showProject
        ? selectedProjects.map((p) => p.trim())
        : [], // Trim Project Names
      name: settings.showDate ? name.trim() : undefined, // Trim Name
      nextTask:
        settings.showNextTask && nextTaskValue.trim()
          ? nextTaskValue.trim() // Trim Next Task
          : undefined, // Save next task only if it exists
      bulletType, // Save the selected bullet type for this report
    };

    savedReports[date] = previewData; // Save only the filtered data
    localStorage.setItem("reports", JSON.stringify(savedReports));
    setAlertMessage(
      editingReport
        ? "Record updated successfully!"
        : "Record saved successfully!"
    ); // Show success alert

    // Reset form data (excluding user details and selected projects)
    setTasks([
      {
        id: 1,
        taskId: "",
        title: "",
        hours: "",
        minutes: "",
        status: "Completed",
      },
    ]);
    setNextTaskValue("");
    setEditingReport(null); // Clear editing state
  };

  const HomePage = () => {

    return (<div className="content">
      <div className="task-input-container">
        {alertMessage && (
          <Alert
            message={alertMessage}
            type={
              alertMessage.includes("successfully")
                ? "success"
                : "error"
            } // Success or error based on message
            closable
            onClose={() => setAlertMessage(null)} // Clear alert on close
            style={{ marginBottom: "15px" }}
          />
        )}
        <div className="personal-details-section">
          <h4>Personal Details</h4>
          <div className="task-info-row">
            <div className="input-group">
              <label htmlFor="name">User Name</label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="date">Date</label>
              <DatePicker
                id="date"
                value={date ? moment(date, "YYYY-MM-DD") : null} // Ensure only the default date is selected
                format="YYYY-MM-DD"
                onChange={(_, dateString) =>
                  setDate(dateString as string)
                } // Explicitly cast dateString to string
                style={{ width: "100%" }}
              />
            </div>
            <div className="input-group">
              <label htmlFor="project">Project</label>
              <Select
                id="project"
                mode="multiple" /* Enable multiple selection */
                placeholder="Select project(s)"
                value={selectedProjects}
                onChange={(value) => setSelectedProjects(value)}
                style={{ width: "100%" }} /* Ensure full width */
                getPopupContainer={(triggerNode) =>
                  triggerNode.parentNode
                } // Ensure dropdown appears above other elements
              >
                {ALL_AVAILABLE_PROJECTS.map((project) => (
                  <Option key={project} value={project}>
                    {project}
                  </Option>
                ))}
              </Select>
            </div>
            <div
              className="input-group"
              style={{ position: "relative" }}
            >
              <label htmlFor="bulletType">Options</label>
              <Select
                id="bulletType"
                value={bulletType}
                onChange={(value) => setBulletType(value as any)}
                style={{ width: "100%" }}
                dropdownStyle={{ zIndex: 99999 }} // Ensure dropdown appears above other elements
              >
                <Option value="bullet">•</Option>
                <Option value="number">1</Option>
                <Option value={">"}>{">"}</Option>
                <Option value={"=>"}>{"=>"}</Option>
              </Select>
            </div>
          </div>
        </div>

        <div className="task-details-section">
          <div className="task-details-header">
            <h4>Task Details</h4>
            <div className="time-info">
              <p className="total-time">
                Total: <span>8h 30min</span>
              </p>
              <p className="remaining-time">
                Remaining:{" "}
                <span
                  className={
                    isTimeExceeded ? "time-exceeded" : "time-in-limit"
                  }
                >
                  {formatRemainingTime(Math.abs(remainingTime))}
                </span>
              </p>
            </div>
            <div className="button-group">
              <Tooltip title="Add a new task">
                <Button
                  type="default" // Change to outlined button
                  icon={AddIcon} // Add icon for Add Task
                  onClick={addTask}
                  title="Add Task"
                  className="add-task-btn" // Add class for styling
                >
                  Add Task
                </Button>
              </Tooltip>
              <Tooltip title="Reset all tasks">
                <Button
                  type="default" // Change to outlined button
                  icon={<ReloadOutlined />} // Use refresh icon for Reset
                  onClick={resetForm}
                  title="Reset Form"
                  className="reset-btn" // Add class for styling
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
              <div
                className="task-row"
                style={{
                  gridTemplateColumns: settings.showID
                    ? "1fr 3fr 1fr 1fr 1fr auto" // Include space for ID field
                    : "3fr 1fr 1fr 1fr auto", // Redistribute space when ID field is hidden
                }}
                key={task.id}
              >
                {settings.showID && (
                  <div className="input-group id-field">
                    <Input
                      ref={(el) => {
                        taskIdInputRef.current[index] = el as InputRef;
                      }}
                      placeholder="Task ID"
                      value={task.taskId}
                      onChange={(e) =>
                        handleTaskChange(
                          index,
                          "taskId",
                          e.target.value
                        )
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
                {settings.showHours && (
                  <div className="input-group">
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={task.hours}
                      onChange={(e) =>
                        handleTaskChange(index, "hours", e.target.value)
                      }
                    />
                  </div>
                )}
                {settings.showHours && (
                  <div className="input-group">
                    <Input
                      type="number"
                      placeholder="Minutes"
                      value={task.minutes}
                      onChange={(e) =>
                        handleTaskChange(
                          index,
                          "minutes",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
                {settings.showStatus && (
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
                  onClick={() => clearTask(task.id)}
                  title="Delete Task"
                >
                  {minusIcon}
                </div>
              </div>
            ))}
          </div>
          {settings.showNextTask && ( // Conditionally render the Next Task input
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
                type="default" // Change to outlined button
                icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
                title="Copy"
                className="copy-btn" // Add class for styling
              />
            </Tooltip>
            <Tooltip title="Save Preview">
              <Button
                type="default" // Change to outlined button
                icon={<SaveOutlined />}
                onClick={savePreview}
                title="Save"
                className="save-btn" // Add class for styling
                style={{ marginLeft: "10px" }} // Add spacing between buttons
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
    </div>)
  }

  return (
    <Layout className={`app-container ${theme}`}>
      <Header className="header">
        <div className="logo" style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
          Report Manager
        </div>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={["1"]}>
          <Menu.Item key="1" icon={<HomeOutlined />}>
            <Link to="/">Home</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<SettingOutlined />}>
            <Link to="/settings">Settings</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<FileTextOutlined />}>
            <Link to="/reports">Reports</Link>
          </Menu.Item>
        </Menu>
      </Header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/edit-task" element={<EditTaskPage />} />
        <Route
          path="/settings"
          element={<SettingsPage settings={settings} toggleSetting={toggleSetting} />}
        />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </Layout>
  );
};

export default App;



