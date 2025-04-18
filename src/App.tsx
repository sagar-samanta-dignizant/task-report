import "./task.less";

import { AddIcon, deleteIcon, minusIcon } from "./assets/fontAwesomeIcons";
import { Alert, Button, DatePicker, Input, Select, Switch } from "antd"; // Import Ant Design components
import {
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { InputRef } from "antd"; // Import InputRef from Ant Design
import moment from "moment"; // Import moment.js for date formatting

// Import react-router-dom

// Import Ant Design icons

const { Option } = Select;
const { RangePicker } = DatePicker;

const ALERT_DISMISS_TIME = 4000; // Time in milliseconds after which the alert disappears

interface Task {
  id: number;
  taskId: string | number;
  title: string;
  hours: string | number;
  minutes: string | number; // Add minutes field
  status: string;
}

const allProjects = ["Rukkor", "Geometra", "Deviaq"];
const statusOptions = [
  "In Progress",
  "Hold",
  "Completed",
  "Fixed",
  "Not Fixed",
];

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div className="clock">
      {currentTime.toLocaleTimeString()} {/* Show only the time */}
    </div>
  );
};

const SettingsPage = ({ settings, toggleSetting }: any) => (
  <div className="settings-page">
    <h2>Settings</h2>
    <div className="settings-option">
      <label>
        Show Date
        <Switch
          checked={settings.showDate}
          onChange={(checked) => toggleSetting("showDate", checked)}
        />
      </label>
    </div>
    <div className="settings-option">
      <label>
        Show Hours
        <Switch
          checked={settings.showHours}
          onChange={(checked) => toggleSetting("showHours", checked)}
        />
      </label>
    </div>
    <div className="settings-option">
      <label>
        Show ID
        <Switch
          checked={settings.showID}
          onChange={(checked) => toggleSetting("showID", checked)}
        />
      </label>
    </div>
    <div className="settings-option">
      <label>
        Show Status
        <Switch
          checked={settings.showStatus}
          onChange={(checked) => toggleSetting("showStatus", checked)}
        />
      </label>
    </div>
    <div className="settings-option">
      <label>
        Show Next Task
        <Switch
          checked={settings.showNextTask}
          onChange={(checked) => toggleSetting("showNextTask", checked)}
        />
      </label>
    </div>
    <div className="settings-option">
      <label>
        Show Project
        <Switch
          checked={settings.showProject}
          onChange={(checked) => toggleSetting("showProject", checked)}
        />
      </label>
    </div>
  </div>
);

interface ReportsPageProps {}

const ReportsPage: React.FC<ReportsPageProps> = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [_, setSelectedDateRange] = useState<[string, string] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null); // Track which report was copied
  const navigate = useNavigate(); // Use navigate for redirection

  const handleDateRangeChange = (_: any, dateStrings: [string, string]) => {
    setSelectedDateRange(dateStrings as [string, string]); // Explicitly cast dateStrings
    const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");

    const filteredReports = Object.entries(savedReports)
      .filter(([date]) => {
        const [start, end] = dateStrings;
        if (!start || !end) return false; // Ensure both start and end dates are provided

        // Normalize all dates to `YYYY-MM-DD` for consistent comparison
        const normalizedDate = moment(date, "YYYY-MM-DD");
        const normalizedStart = moment(start, "DD/MM/YYYY").format(
          "YYYY-MM-DD"
        );
        const normalizedEnd = moment(end, "DD/MM/YYYY").format("YYYY-MM-DD");

        return normalizedDate.isBetween(
          moment(normalizedStart, "YYYY-MM-DD"),
          moment(normalizedEnd, "YYYY-MM-DD"),
          "days",
          "[]"
        );
      })
      .map(([date, data]) => ({
        date, // Keep the date in `YYYY-MM-DD` format
        data,
      }));

    setReportData(filteredReports); // Update state with filtered reports
  };

  const handleCopy = (data: any, index: number) => {
    navigator.clipboard.writeText(formatPreview(data));
    setCopiedIndex(index); // Set the copied index
    setTimeout(() => setCopiedIndex(null), 2000); // Revert back after 2 seconds
  };

  const handleDelete = (date: string) => {
    const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");
    delete savedReports[date]; // Remove the report by date
    localStorage.setItem("reports", JSON.stringify(savedReports)); // Update storage
    setReportData(reportData.filter((report) => report.date !== date)); // Update state
  };

  const handleEdit = (report: any) => {
    navigate(`/edit-task`, { state: { report } }); // Redirect to the edit page with state
  };

  const formatTaskTime = (hours: string | number, minutes: string | number) => {
    const h = parseInt(hours as string) || 0;
    const m = parseInt(minutes as string) || 0;
    let timeString = "";
    if (h > 0) timeString += `${h} h`; // Only include hours if greater than 0
    if (m > 0) timeString += ` ${m} min`; // Only include minutes if greater than 0
    return timeString.trim(); // Remove any leading/trailing spaces
  };

  const formatLine = (task: any) => {
    let line = "";
    if (task.taskId) line += `ID: ${task.taskId.toString().trim()} - `; // Trim Task ID
    line += task.title.trim(); // Trim Title
    if (task.status) line += ` (${task.status.trim()})`; // Trim Status
    if (task.hours || task.minutes) {
      const taskTime = formatTaskTime(task.hours, task.minutes);
      if (taskTime) line += ` (${taskTime})`; // Only include time if it's not empty
    }
    return line;
  };

  const formatPreview = (data: any) => {
    const { tasks, selectedProjects, date, name, nextTask, bulletType } = data;

    const getBullet = (index: number) => {
      switch (bulletType) {
        case "dot":
          return "• "; // Use a dot bullet
        case "number":
          return `${index + 1}. `; // Use numbers
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

    const formatTasks = (tasks: any[]) =>
      tasks
        .map((task, index) => `${getBullet(index)}${formatLine(task)}`)
        .join("\n");

    return `Today's work update - ${moment(date, "YYYY-MM-DD").format(
      "YYYY-MM-DD"
    )}

${
  selectedProjects.length > 0
    ? `Project: ${selectedProjects.map((p: any) => p.trim()).join(" & ")}`
    : ""
} 
----------------------------------------
${formatTasks(tasks)}
${
  nextTask && nextTask.trim()
    ? `\nNext's Tasks\n---------------------\n=> ${nextTask.trim()}` // Trim Next Task
    : ""
}

Thanks & regards
${name.trim()}`; // Trim Name
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h2>Reports</h2>
        <RangePicker
          onChange={handleDateRangeChange}
          format="DD/MM/YYYY" // Set date picker format
        />
      </div>
      <div className="report-grid">
        {reportData.length > 0 ? (
          reportData.map((report, index) => (
            <div key={index} className="report-card">
              <div className="task-preview-header">
                <h3>{`Date: ${report.date}`}</h3>
                <div className="button-group">
                  <Button
                    type="primary"
                    icon={
                      copiedIndex === index ? (
                        <CheckOutlined />
                      ) : (
                        <CopyOutlined />
                      )
                    } // Change icon on copy
                    onClick={() => handleCopy(report.data, index)}
                    title="Copy"
                  />
                  <Button
                    type="default"
                    icon={<EditOutlined />} // Use Edit icon
                    onClick={() => handleEdit(report)} // Trigger edit
                    title="Edit"
                  />
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />} // Use Delete icon
                    onClick={() => handleDelete(report.date)}
                    title="Delete"
                  />
                </div>
              </div>
              <pre
                className="script-style"
                style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
              >
                {formatPreview(report.data)}
              </pre>
            </div>
          ))
        ) : (
          <p>No records found for the selected date range.</p>
        )}
      </div>
    </div>
  );
};

const EditTaskPage = () => {
  const location = useLocation(); // Use useLocation to access the state
  const navigate = useNavigate(); // For navigation
  const report = location.state?.report; // Extract the report data from state

  const [tasks, setTasks] = useState<Task[]>(report?.data.tasks || []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    report?.data.selectedProjects || []
  );
  const [name, setName] = useState(report?.data.name || "");
  const [date, setDate] = useState(report?.date || "");
  const [bulletType, setBulletType] = useState(
    report?.data.bulletType || "bullet"
  );
  const [nextTaskValue, setNextTaskValue] = useState(
    report?.data.nextTask || ""
  );

  const workingTimeLimit = 8.5; // Total working time in hours

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

  const remainingTime = calculateRemainingTime();
  const isTimeExceeded = remainingTime < 0;

  const handleTaskChange = (
    index: number,
    field: keyof Task,
    value: string | number
  ) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value as never;
    setTasks(updatedTasks);
  };

  const addTask = () => {
    const newTask: Task = {
      id: tasks.length + 1,
      taskId: "",
      title: "",
      hours: "",
      minutes: "",
      status: "Completed",
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const clearTask = (taskId: number) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  };

  const handleSave = () => {
    // Save the updated report data in the correct structure
    const updatedReport = {
      date,
      tasks,
      selectedProjects,
      name,
      bulletType,
      nextTask: nextTaskValue,
    };

    const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");
    savedReports[date] = updatedReport; // Save the updated report directly under the date key
    localStorage.setItem("reports", JSON.stringify(savedReports));

    navigate("/reports"); // Navigate back to the reports page after saving
  };

  const getFormattedPreview = () => {
    const formatLine = (task: Task) => {
      let line = "";
      if (task.taskId) line += `ID: ${task.taskId.toString().trim()} - `;
      line += task.title.trim();
      if (task.status) line += ` (${task.status.trim()})`;
      if (task.hours || task.minutes) {
        const taskTime = `${task.hours || 0}h ${task.minutes || 0}m`.trim();
        if (taskTime) line += ` (${taskTime})`;
      }
      return line;
    };

    const formatTasks = tasks
      .map((task, index) => `${index + 1}. ${formatLine(task)}`)
      .join("\n");

    return `Today's work update - ${moment(date).format("YYYY-MM-DD")}

Project: ${selectedProjects.join(" & ") || "Not Selected"}
----------------------------------------
${formatTasks}
${
  nextTaskValue.trim()
    ? `\nNext's Tasks\n---------------------\n=> ${nextTaskValue.trim()}`
    : ""
}

Thanks & regards
${name.trim()}`;
  };

  if (!report) {
    return <p>Report not found!</p>;
  }

  return (
    <div className="edit-task-page">
      <h2>Edit Report</h2>
      <div className="content" style={{ display: "flex", gap: "20px" }}>
        <div className="task-input-container" style={{ flex: "65%" }}>
          <div className="personal-details-section">
            <h4>Personal Details</h4>
            <div className="task-info-row">
              <div className="input-group">
                <label htmlFor="name">User Name</label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="date">Date</label>
                <DatePicker
                  id="date"
                  value={date ? moment(date, "YYYY-MM-DD") : null} // Ensure only the default date is selected
                  format="YYYY-MM-DD"
                  onChange={(date, dateString) => setDate(dateString as string)}
                  style={{ width: "100%" }}
                />
              </div>
              <div className="input-group">
                <label htmlFor="project">Project</label>
                <Select
                  id="project"
                  mode="multiple"
                  placeholder="Select project(s)"
                  value={selectedProjects}
                  onChange={(value) => setSelectedProjects(value)}
                  style={{ width: "100%" }}
                >
                  {allProjects.map((project) => (
                    <Option key={project} value={project}>
                      {project}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="input-group">
                <label htmlFor="bulletType">Options</label>
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
                <Button
                  type="primary"
                  icon={AddIcon} // Add icon for Add Task
                  onClick={addTask}
                  title="Add Task"
                >
                  Add Task
                </Button>
              </div>
            </div>
            <div className="task-details-inputs" style={{ marginTop: "10px" }}>
              {tasks.map((task, index) => (
                <div
                  className="task-row"
                  style={{
                    gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr auto",
                  }}
                  key={index}
                >
                  <div className="input-group id-field">
                    <Input
                      placeholder="Task ID"
                      value={task.taskId}
                      onChange={(e) =>
                        handleTaskChange(index, "taskId", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group title-field">
                    <Input
                      placeholder="Task Title"
                      value={task.title}
                      onChange={(e) =>
                        handleTaskChange(index, "title", e.target.value)
                      }
                    />
                  </div>
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
                  <div className="input-group">
                    <Input
                      type="number"
                      placeholder="Minutes"
                      value={task.minutes}
                      onChange={(e) =>
                        handleTaskChange(index, "minutes", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group">
                    <Select
                      placeholder="Select status"
                      value={task.status}
                      onChange={(value) =>
                        handleTaskChange(index, "status", value)
                      }
                      style={{ width: "100%" }}
                    >
                      {statusOptions.map((status) => (
                        <Option key={status} value={status}>
                          {status}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="text" // Use "text" type to remove button styling
                    danger
                    icon={deleteIcon}
                    onClick={() => clearTask(task.id)}
                    title="Delete Task"
                    style={{ marginBottom: "15px" }}
                  />
                </div>
              ))}
            </div>
            <div className="input-group" style={{ marginTop: "20px" }}>
              <Input
                id="nextTask"
                placeholder="Enter next task"
                value={nextTaskValue}
                onChange={(e) => setNextTaskValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="task-preview-container" style={{ flex: "35%" }}>
          <div className="task-preview-header">
            <h3>Preview</h3>
          </div>
          <pre
            className="script-style"
            style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
          >
            {getFormattedPreview()}
          </pre>
        </div>
      </div>
      <div className="button-group" style={{ marginTop: "20px" }}>
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
        <Button type="default" onClick={() => navigate("/reports")}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const Task = () => {
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
            .querySelectorAll<HTMLInputElement>(".task-title-input")
            [lastTaskIndex]?.focus(); // Focus on Title if Task ID is hidden
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
    console.log(allTasks);

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

    return `Today's work update - ${
      settings.showDate ? moment(date).format("YYYY-MM-DD") || "YYYY-MM-DD" : ""
    }

${
  settings.showProject
    ? `Project : ${
        selectedProjects.map((p) => p.trim()).join(" & ") || "Not Selected"
      }\n---------------------\n`
    : ""
}${formatTasks(allTasks)}${
      settings.showNextTask && nextTaskValue.trim()
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

  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        <h1>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Report Manager
          </Link>
        </h1>
        <Clock /> {/* Simplified Clock component */}
        <nav>
          <Link to="/">Home</Link> | <Link to="/settings">Settings</Link> |{" "}
          <Link to="/reports">Reports</Link>
        </nav>
      </header>
      <Routes>
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
                        {allProjects.map((project) => (
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
                      <Button
                        type="primary"
                        icon={AddIcon} // Add icon for Add Task
                        onClick={addTask}
                        title="Add Task"
                      >
                        Add Task
                      </Button>
                      <Button
                        type="default"
                        icon={<DeleteOutlined />} // Add icon for Reset
                        onClick={resetForm}
                        title="Reset Form"
                        style={{ marginLeft: "10px" }}
                      >
                        Reset
                      </Button>
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
                              {statusOptions.map((status) => (
                                <Option key={status} value={status}>
                                  {status}
                                </Option>
                              ))}
                            </Select>
                          </div>
                        )}
                        <Button
                          type="text" // Use "text" type to remove button styling
                          danger
                          icon={deleteIcon}
                          onClick={() => clearTask(task.id)}
                          title="Delete Task"
                          style={{ marginBottom: "15px" }}
                        />
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
                    <Button
                      type="primary"
                      icon={copySuccess ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={handleCopy}
                      title="Copy"
                    />
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={savePreview}
                      title="Save"
                    />
                  </div>
                </div>
                <pre
                  className="script-style"
                  style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                >
                  {getFormattedPreview()}
                </pre>
              </div>
              {/* <div className="task-details-section">
                {tasks.map((task) => (
                  <div key={task.id} className="task-row">
                    <p>{task.title}</p>
                  </div>
                ))}
              </div> */}
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
    </div>
  );
};

export default Task;
