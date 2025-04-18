import "./task.less";

import { AddIcon, deleteIcon } from "./assets/fontAwesomeIcons";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom"; // Import react-router-dom
import { Button, DatePicker, Input, Select, Switch } from "antd"; // Import Ant Design components
import { CheckOutlined, CopyOutlined, SaveOutlined } from "@ant-design/icons"; // Import Ant Design icons
import { useEffect, useState } from "react";

import moment from "moment"; // Import moment.js for date formatting

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Task {
  id: number;
  taskId: string | number;
  title: string;
  hours: string | number;
  status: string;
}

const allProjects = ["Rukkor", "Geometra","Deviaq"];
const statusOptions = ["In Progress", "Hold", "Completed"];

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

const ReportsPage = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [_, setSelectedDateRange] = useState<
    [string, string] | null
  >(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null); // Track which report was copied

  const handleDateRangeChange = (_: any, dateStrings: [string, string]) => {
    setSelectedDateRange(dateStrings);
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

  const formatPreview = (data: any) => {
    const { tasks, selectedProjects, date, name, nextTask } = data;
    const completedTasks = tasks.filter(
      (task: any) => task.status === "Completed"
    );
    const otherTasks = tasks.filter((task: any) => task.status !== "Completed");

    const formatLine = (task: any) => {
      let line = "";
      if (task.taskId) line += `ID: ${task.taskId} - `;
      line += task.title;
      if (task.status) line += ` (${task.status})`;
      if (task.hours)
        line += ` (${task.hours} hour${+task.hours > 1 ? "s" : ""})`;
      return line;
    };

    const formatTasks = (tasks: any[]) =>
      tasks.map((task, _) => `- ${formatLine(task)}`).join("\n");

    return `Date: ${moment(date, "YYYY-MM-DD").format("YYYY-MM-DD")} 

${selectedProjects.length > 0 ? `Project: ${selectedProjects.join(" & ")}` : ""}
${
  completedTasks.length > 0
    ? `---------------------\nCompleted Tasks:\n${formatTasks(completedTasks)}`
    : ""
}
${
  otherTasks.length > 0
    ? `---------------------\nOther Tasks:\n${formatTasks(otherTasks)}`
    : ""
}
${nextTask ? `---------------------\nNext Day's Task:\n=> ${nextTask}` : ""}
${name ? `\nThanks & regards\n${name}` : ""}`;
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
                </div>
              </div>
              <pre className="script-style">{formatPreview(report.data)}</pre>
            </div>
          ))
        ) : (
          <p>No records found for the selected date range.</p>
        )}
      </div>
    </div>
  );
};

const Task = () => {
  const theme = "light";
  const workingTimeLimit = 8.5; // Total working time in hours
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, taskId: "", title: "", hours: "", status: "Completed" }, // Default status set to "Completed"
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

  const calculateRemainingTime = () => {
    const totalTaskTime = tasks.reduce(
      (sum, task) => sum + (parseFloat(task.hours as string) || 0),
      0
    );
    return workingTimeLimit - totalTaskTime;
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
      status: "Completed", // Default status set to "Completed"
    };
    setTasks([...tasks, newTask]); // Allow adding tasks without restriction
  };

  const resetForm = () => {
    setTasks([{ id: 1, taskId: "", title: "", hours: "", status: "Completed" }]);
    setSelectedProjects([]);
    setName("");
    setDate(new Date().toISOString().split("T")[0]);
    setNextTaskValue("");
  };

  const clearTask = (taskId: number) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  };

  const toggleSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getFormattedPreview = () => {
    const filteredTasks = tasks.filter((task) => task.title.trim()); // Only include tasks with a title
    const completedTasks = filteredTasks.filter(
      (task) => task.status === "Completed"
    );
    const inProgressTasks = filteredTasks.filter(
      (task) => task.status === "In Progress"
    );
    const otherTasks = filteredTasks.filter((task) => !task.status);

    const formatLine = (task: Task, _: number) => {
      let line = "";
      if (settings.showID && task.taskId) {
        line += `ID: ${task.taskId} - `;
      }
      line += task.title;

      if (settings.showStatus && task.status) line += ` (${task.status})`;
      if (settings.showHours && task.hours) {
        line += ` (${task.hours} hour${+task.hours > 1 ? "s" : ""})`;
      }
      return line;
    };

    const getBullet = (index: number) => {
      switch (bulletType) {
        case "number":
          return `${index + 1}. `;
        case "dot":
          return "• ";
        case ">":
          return "> ";
        case ">>":
          return ">> ";
        case "=>":
          return "=> ";
        default:
          return "- ";
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
    ? `Project : ${selectedProjects.join(" & ") || "Not Selected"}\n---------------------\n`
    : ""
}${formatTasks(completedTasks)}
${formatTasks(inProgressTasks)}
${formatTasks(otherTasks)}${
      settings.showNextTask && nextTaskValue.trim()
        ? `\nNext's Tasks\n---------------------\n=> ${nextTaskValue}`
        : ""
    }

Thanks & regards
${name}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFormattedPreview());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000); // Revert back after 2 seconds
  };

  const savePreview = () => {
    const filteredTasks = tasks.filter((task) => task.title.trim()); // Only include tasks with a title
    const previewData = {
      date, // Save the date in `YYYY-MM-DD` format
      tasks: filteredTasks.map((task) => ({
        taskId: settings.showID ? task.taskId : undefined,
        title: task.title,
        hours: settings.showHours ? task.hours : undefined,
        status: settings.showStatus ? task.status : undefined,
      })),
      selectedProjects: settings.showProject ? selectedProjects : [],
      name: settings.showDate ? name : undefined,
      nextTask:
        settings.showNextTask && nextTaskValue.trim()
          ? nextTaskValue
          : undefined, // Save next task only if it exists
    };
    const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");
    savedReports[date] = previewData; // Save only the filtered data
    localStorage.setItem("reports", JSON.stringify(savedReports));

    // Reset form data
    setTasks([{ id: 1, taskId: "", title: "", hours: "", status: "Completed" }]);
    setSelectedProjects([]);
    setName("");
    setDate(new Date().toISOString().split("T")[0]);
    setNextTaskValue("");
  };

  return (
    <BrowserRouter>
      <div className={`app-container ${theme}`}>
        <header className="header">
          <h1>
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
              Report Manager
            </Link>
          </h1>
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
                  <h3>Create New Task</h3>
                  <div className="personal-details-section">
                    <h4>Personal Details</h4>
                    <div className="task-info-row">
                      <div className="input-group">
                        <label htmlFor="name">Your Name:</label>
                        <Input
                          id="name"
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="date">Date:</label>
                        <Input
                          id="date"
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="project">Project:</label>
                        <Select
                          id="project"
                          mode="multiple" /* Enable multiple selection */
                          placeholder="Select Project"
                          value={selectedProjects}
                          onChange={(value) => setSelectedProjects(value)}
                          style={{ width: "100%" }} /* Ensure full width */
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
                        <label htmlFor="bulletType">Bullet Type:</label>
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
                          Total: <span>{workingTimeLimit} hrs</span>
                        </p>
                        <p className="remaining-time">
                          Remaining:{" "}
                          <span
                            className={
                              isTimeExceeded ? "time-exceeded" : "time-in-limit"
                            }
                          >
                            {remainingTime.toFixed(2)} hrs
                          </span>
                        </p>
                      </div>
                      <div className="button-group">
                        <Button
                          type="primary"
                          shape="circle"
                          icon={AddIcon}
                          onClick={addTask}
                          title="Add Task"
                        />
                        <Button
                          type="default"
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
                        <div className="task-row" key={task.id}>
                          <div className="input-group">
                            <label>
                              Task ID:
                              <Input
                                placeholder="Task ID"
                                value={task.taskId}
                                onChange={(e) =>
                                  handleTaskChange(index, "taskId", e.target.value)
                                }
                              />
                            </label>
                          </div>
                          <div className="input-group">
                            <label>
                              Task Title:
                              <Input
                                placeholder="Task Title"
                                value={task.title}
                                onChange={(e) =>
                                  handleTaskChange(index, "title", e.target.value)
                                }
                              />
                            </label>
                          </div>
                          <div className="input-group">
                            <label>
                              Hours:
                              <Input
                                type="number"
                                placeholder="Hours"
                                value={task.hours}
                                onChange={(e) =>
                                  handleTaskChange(index, "hours", e.target.value)
                                }
                              />
                            </label>
                          </div>
                          <div className="input-group">
                            <label>
                              Status:
                              <Select
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
                            </label>
                          </div>
                          <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={deleteIcon}
                            onClick={() => clearTask(task.id)}
                            title="Delete Task"
                            style={{ marginTop: "10px" }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="input-group" style={{ marginTop: "20px" }}>
                      <label htmlFor="nextTask">Next Task:</label>
                      <Input
                        id="nextTask"
                        placeholder="Enter next task"
                        value={nextTaskValue}
                        onChange={(e) => setNextTaskValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="task-preview-container">
                  <div className="task-preview-header">
                    <h3>Preview</h3>
                    <div className="button-group">
                      <Button
                        type="primary"
                        icon={
                          copySuccess ? <CheckOutlined /> : <CopyOutlined />
                        } // Change icon on copy
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
                  <pre className="script-style">{getFormattedPreview()}</pre>
                </div>
              </div>
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage settings={settings} toggleSetting={toggleSetting} />
            }
          />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Task;
