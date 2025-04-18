/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, DatePicker, Input, Select, Tooltip } from "antd";
const { Option } = Select;
import moment from "moment";
import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ALL_AVAILABLE_PROJECTS, ALL_STATUS_OPTIONS } from "../constant/task.constant";
import { AddIcon, minusIcon } from "../assets/fontAwesomeIcons";

interface Task {
    id: number;
    taskId: string | number;
    title: string;
    hours: string | number;
    minutes: string | number;
    status: string;
    subtasks?: Omit<Task, "subtasks">[]; // Add subtasks property
}

const EditTaskPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const report = location.state?.report;

    const [tasks, setTasks] = useState<Task[]>(report?.data.tasks || []);
    const [selectedProjects, setSelectedProjects] = useState<string[]>(report?.data.selectedProjects || []);
    const [name, setName] = useState(report?.data.name || "");
    const [date, setDate] = useState(report?.date || "");
    const [bulletType, setBulletType] = useState(report?.data.bulletType || "bullet");
    const [nextTaskValue, setNextTaskValue] = useState(report?.data.nextTask || "");
    const [selectedSubIcon, setSelectedSubIcon] = useState<"bullet" | "number" | ">" | "=>">("bullet");

    const taskRefs = useRef<(HTMLInputElement | null)[]>([]);
    const subtaskRefs = useRef<(HTMLInputElement | null)[][]>([]);

    const workingTimeLimit = 8.5;

    const calculateRemainingTime = () => {
        const totalTaskTime = tasks.reduce((sum, task) => {
            const subtaskTime =
                task.subtasks?.reduce((subSum, subtask) => {
                    const subtaskHours = parseFloat(subtask.hours as string) || 0;
                    const subtaskMinutes =
                        (parseFloat(subtask.minutes as string) || 0) / 60;
                    return subSum + subtaskHours + subtaskMinutes;
                }, 0) || 0;

            const taskHours = task.subtasks ? 0 : parseFloat(task.hours as string) || 0; // Ignore task hours if subtasks exist
            const taskMinutes =
                task.subtasks ? 0 : (parseFloat(task.minutes as string) || 0) / 60; // Ignore task minutes if subtasks exist

            return sum + taskHours + taskMinutes + subtaskTime;
        }, 0);
        return workingTimeLimit - totalTaskTime;
    };

    const formatRemainingTime = (remainingTime: number) => {
        const hours = Math.floor(Math.abs(remainingTime));
        const minutes = Math.round((Math.abs(remainingTime) - hours) * 60);
        return remainingTime < 0
            ? `${hours}h ${minutes}m (Extra hour)`
            : `${hours}h ${minutes}m`;
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

    const handleSubtaskChange = (
        parentIndex: number,
        subtaskIndex: number,
        field: keyof Task,
        value: string | number
    ) => {
        const updatedTasks = [...tasks];
        const parentTask = updatedTasks[parentIndex];
        if (parentTask.subtasks) {
            parentTask.subtasks[subtaskIndex] = {
                ...parentTask.subtasks[subtaskIndex],
                [field]: value,
            };

            // Recalculate parent task's hours and minutes based on subtasks
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
        setTasks((prevTasks) => {
            const updatedTasks = [...prevTasks, newTask];
            taskRefs.current.push(null); // Add a new ref for the new task
            return updatedTasks;
        });
        setTimeout(() => {
            taskRefs.current[taskRefs.current.length - 1]?.focus(); // Focus on the ID input if it exists
        }, 0);
    };

    const addSubtask = (parentIndex: number) => {
        const newSubtask: Task = {
            id: Date.now(), // Unique ID for the subtask
            taskId: "",
            title: "",
            hours: "",
            minutes: "",
            status: "Completed",
        };

        setTasks((prevTasks) => {
            const updatedTasks = [...prevTasks];
            if (!updatedTasks[parentIndex].subtasks) {
                updatedTasks[parentIndex].subtasks = [];
                subtaskRefs.current[parentIndex] = []; // Initialize subtask refs for the parent
            }
            updatedTasks[parentIndex].subtasks.push(newSubtask);
            subtaskRefs.current[parentIndex].push(null); // Add a new ref for the new subtask
            return updatedTasks;
        });
        setTimeout(() => {
            const subtaskRef = subtaskRefs.current[parentIndex]?.[subtaskRefs.current[parentIndex].length - 1];
            subtaskRef?.focus(); // Focus on the Title input of the new subtask
        }, 0);
    };

    const clearTask = (taskId: number) => {
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updatedTasks);
    };

    const clearSubtask = (parentIndex: number, subtaskIndex: number) => {
        const updatedTasks = [...tasks];
        updatedTasks[parentIndex].subtasks = updatedTasks[parentIndex].subtasks?.filter(
            (_, index) => index !== subtaskIndex
        );
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
        const formatLine = (task: Task, level = 0, bulletType: string, index: number) => {
            const getBullet = (type: string, index: number) => {
                switch (type) {
                    case "bullet":
                        return "•";
                    case "number":
                        return `${index + 1}.`;
                    case ">":
                        return ">";
                    case "=>":
                        return "=>";
                    default:
                        return "-";
                }
            };

            const bullet = getBullet(bulletType, index);
            const indent = "    ".repeat(level); // 4 spaces per level for better visual offset

            let line = `${indent}${bullet} `; // Indent comes before bullet
            if (task.taskId) line += `ID: ${task.taskId.toString().trim()} - `;
            line += task.title.trim();
            if (task.status) line += ` (${task.status.trim()})`;
            if (task.hours || task.minutes) {
                const taskTime = `${task.hours || 0}h ${task.minutes || 0}m`.trim();
                if (taskTime) line += ` (${taskTime})`;
            }
            return line;
        };

        const formatTasks = (tasks: Task[], level = 0, bulletType: string, subIcon: string): string =>
            tasks
                .map((task, index) => {
                    const taskLine = `${formatLine(task, level, bulletType, index)}`;
                    const subtaskLines = task.subtasks
                        ? formatTasks(task.subtasks, level + 1, subIcon, subIcon)
                        : "";
                    return `${taskLine}${subtaskLines ? `\n${subtaskLines}` : ""}`;
                })
                .join("\n");

        return `Today's work update - ${moment(date).format("YYYY-MM-DD")}

Project: ${selectedProjects.join(" & ") || "Not Selected"}
----------------------------------------
${formatTasks(tasks, 0, bulletType, selectedSubIcon)}
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
                            <div className="input-group" style={{ width: "140px" }}>
                                <label htmlFor="date">Date</label>
                                <DatePicker
                                    id="date"
                                    value={date ? moment(date, "YYYY-MM-DD") : null}
                                    format="YYYY-MM-DD"
                                    onChange={(_, dateString) => setDate(dateString as string)}
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
                            <div className="input-group" style={{ width: "120px" }}>
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
                            <div className="input-group" style={{ flex: "1 1 25%" }}>
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
                            </div>
                        </div>
                        <div
                            className="task-details-inputs"
                            style={{
                                marginTop: "10px",
                                maxHeight: "400px", // Limit the height for scrolling
                                overflowY: "auto", // Enable vertical scrolling
                            }}
                        >
                            {tasks.map((task, index) => (
                                <div key={`task-${index}`}>
                                    <div
                                        className="task-row"
                                        style={{
                                            gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr auto auto",
                                        }}
                                    >
                                        <div className="input-group id-field">
                                            <Input
                                                ref={(el) => {
                                                    taskRefs.current[index] = el?.input || null; // Assign ref to the underlying input element
                                                }}
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
                                                disabled={!!task.subtasks?.length} // Disable if subtasks exist
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
                                                disabled={!!task.subtasks?.length} // Disable if subtasks exist
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
                                        <div
                                            className="clear-task-circle"
                                            onClick={() => clearTask(task.id)}
                                            title="Delete Task"
                                        >
                                            {minusIcon}
                                        </div>
                                        <div
                                            className="add-task-circle"
                                            onClick={() => addSubtask(index)}
                                            title="Add Subtask"
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
                                                    gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr auto auto", // Same layout as tasks
                                                }}
                                            >
                                                <div className="input-group id-field">
                                                    <Input
                                                        style={{ visibility: "hidden" }} // Hide subtask ID field
                                                        placeholder="Subtask ID"
                                                        value={subtask.taskId}
                                                        onChange={(e) =>
                                                            handleSubtaskChange(index, subIndex, "taskId", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="input-group title-field">
                                                    <Input
                                                        ref={(el) => {
                                                            if (!subtaskRefs.current[index]) {
                                                                subtaskRefs.current[index] = [];
                                                            }
                                                            subtaskRefs.current[index][subIndex] = el?.input || null; // Assign ref to the Title input
                                                        }}
                                                        placeholder="Subtask Title"
                                                        value={subtask.title}
                                                        onChange={(e) =>
                                                            handleSubtaskChange(index, subIndex, "title", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <Input
                                                        type="number"
                                                        placeholder="Hours"
                                                        value={subtask.hours}
                                                        onChange={(e) =>
                                                            handleSubtaskChange(index, subIndex, "hours", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <Input
                                                        type="number"
                                                        placeholder="Minutes"
                                                        value={subtask.minutes}
                                                        onChange={(e) =>
                                                            handleSubtaskChange(index, subIndex, "minutes", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <Select
                                                        placeholder="Select status"
                                                        value={subtask.status}
                                                        onChange={(value) =>
                                                            handleSubtaskChange(index, subIndex, "status", value)
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
                                                <div
                                                    className="clear-task-circle"
                                                    onClick={() => clearSubtask(index, subIndex)}
                                                    title="Delete Subtask"
                                                >
                                                    {minusIcon}
                                                </div>
                                                <div
                                                    className="add-task-circle"
                                                    style={{ visibility: "hidden" }}
                                                >
                                                    {AddIcon}
                                                </div>
                                            </div>
                                        ))}
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
            <div className="button-group" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-start", gap: "20px" }}>
                <Button
                    type="default"
                    onClick={handleSave}
                    style={{
                        borderColor: "#4caf50",
                        color: "#4caf50",
                        padding: "10px 20px",
                        fontSize: "16px",
                        borderRadius: "5px",
                    }}
                >
                    Save
                </Button>
                <Button
                    type="default"
                    onClick={() => navigate("/reports")}
                    style={{
                        borderColor: "#f44336",
                        color: "#f44336",
                        padding: "10px 20px",
                        fontSize: "16px",
                        borderRadius: "5px",
                    }}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};
export default EditTaskPage;