/* eslint-disable @typescript-eslint/no-explicit-any */
import { AddIcon, deleteIcon } from "../assets/fontAwesomeIcons";
import { Button, DatePicker, Input, Select } from "antd";
const { Option } = Select;
import moment from "moment";
import { useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";
import { ALL_AVAILABLE_PROJECTS, ALL_STATUS_OPTIONS } from "../constant/task.constant";

interface Task {
    id: number;
    taskId: string | number;
    title: string;
    hours: string | number;
    minutes: string | number;
    status: string;
}

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
  ${nextTaskValue.trim()
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
                                    onChange={(_, dateString) => setDate(dateString as string)}
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
                                    {ALL_AVAILABLE_PROJECTS.map((project) => (
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
                                            {ALL_STATUS_OPTIONS.map((status) => (
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
export default EditTaskPage;