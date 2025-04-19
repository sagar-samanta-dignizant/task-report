/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, DatePicker, Tooltip } from "antd"; 
import {
    CheckOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
const { RangePicker } = DatePicker;

const ReportsPage: React.FC = () => {
    const [reportData, setReportData] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null); // Track which report was copied
    const navigate = useNavigate(); // Use navigate for redirection

    const handleDateRangeChange = (_: any, dateStrings: [string, string]) => {
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

    const formatLine = (task: any, level = 0, bulletType: string, index: number) => {
        const indent = "  ".repeat(level); // Add consistent indentation based on the level
        const getBullet = (type: string, index: number) => {
            switch (type) {
                case "dot":
                    return "• "; // Use a dot bullet
                case "number":
                    return `${index + 1}. `; // Use numbers dynamically
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

        let line = `${indent}${getBullet(bulletType, index)}`; // Apply indentation and bullet
        if (task.taskId) line += `ID: ${task.taskId.toString().trim()} - `; // Trim Task ID
        line += task.title.trim(); // Trim Title
        if (task.status) line += ` (${task.status.trim()})`; // Trim Status
        if (task.hours || task.minutes) {
            const taskTime = formatTaskTime(task.hours, task.minutes);
            if (taskTime) line += ` (${taskTime})`; // Only include time if it's not empty
        }
        return line;
    };

    const formatTasks = (tasks: any[], level = 0, bulletType: string, subIcon: string): string =>
        tasks
            .map((task, index) => {
                const taskLine = `${formatLine(task, level, bulletType, index)}`;
                const subtaskLines = task.subtasks
                    ? formatTasks(task.subtasks, level + 1, subIcon, subIcon) // Use subIcon for subtasks
                    : "";
                return `${taskLine}${subtaskLines ? `\n${subtaskLines}` : ""}`;
            })
            .join("\n");

    const formatPreview = (data: any) => {
        const { tasks, selectedProjects, date, name, nextTask, bulletType, subIcon } = data;

        return `Today's work update - ${moment(date, "YYYY-MM-DD").format(
            "YYYY-MM-DD"
        )}
  
  ${selectedProjects.length > 0
                ? `Project: ${selectedProjects.map((p: any) => p.trim()).join(" & ")}`
                : ""
            } 
  ----------------------------------------
  ${formatTasks(tasks, 0, bulletType, subIcon)}
  ${nextTask && nextTask.trim()
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
            <div className="report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {reportData.length > 0 ? (
                    reportData.map((report, index) => (
                        <div key={index} className="report-card">
                            <div className="task-preview-header">
                                <h3>{`Date: ${report.date}`}</h3>
                                <div className="button-group" style={{ display: "flex", gap: "10px" }}>
                                    <Tooltip title="Copy to Clipboard">
                                        <Button
                                            type="default"
                                            icon={
                                                copiedIndex === index ? (
                                                    <CheckOutlined style={{ color: "#4caf50" }} /> // Green color for success
                                                ) : (
                                                    <CopyOutlined style={{ color: "#4caf50" }} /> // Green color for default
                                                )
                                            }
                                            onClick={() => handleCopy(report.data, index)}
                                            title="Copy"
                                        />
                                    </Tooltip>
                                    <Tooltip title="Edit Report">
                                        <Button
                                            type="default"
                                            icon={<EditOutlined style={{ color: "#1e88e5" }} />} // Blue color for edit
                                            onClick={() => handleEdit(report)}
                                            title="Edit"
                                        />
                                    </Tooltip>
                                    <Tooltip title="Delete Report">
                                        <Button
                                            type="default" // Change from "primary" to "default" to remove background color
                                            danger
                                            icon={<DeleteOutlined style={{ color: "#f44336" }} />} // Red color for delete
                                            onClick={() => handleDelete(report.date)}
                                            title="Delete"
                                        />
                                    </Tooltip>
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
export default ReportsPage;