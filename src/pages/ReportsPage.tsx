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
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [copiedPreview, setCopiedPreview] = useState<string | null>(null);
    const [selectedDateRange, setSelectedDateRange] = useState<[string, string] | null>(null);
    const navigate = useNavigate();

    const handleDateRangeChange = (_: any, dateStrings: [string, string]) => {
        setSelectedDateRange(dateStrings);
        const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");
        const filteredReports = Object.entries(savedReports)
            .filter(([date]) => {
                const [start, end] = dateStrings;
                if (!start || !end) return false;
                const normalizedDate = moment(date, "YYYY-MM-DD");
                const normalizedStart = moment(start, "DD/MM/YYYY").format("YYYY-MM-DD");
                const normalizedEnd = moment(end, "DD/MM/YYYY").format("YYYY-MM-DD");

                return normalizedDate.isBetween(
                    moment(normalizedStart),
                    moment(normalizedEnd),
                    "days",
                    "[]"
                );
            })
            .map(([date, data]) => ({ date, data }));

        setReportData(filteredReports);
    };

    const handleCopy = (data: any, index: number) => {
        const preview = formatPreview(data);
        navigator.clipboard.writeText(preview);
        setCopiedIndex(index);
        setCopiedPreview(preview);

        setTimeout(() => {
            setCopiedIndex(null);
            setCopiedPreview(null);
        }, 2000);
    };

    const handleDelete = (date: string) => {
        const savedReports = JSON.parse(localStorage.getItem("reports") || "{}");
        delete savedReports[date];
        localStorage.setItem("reports", JSON.stringify(savedReports));
        setReportData(reportData.filter((report) => report.date !== date));
    };

    const handleEdit = (report: any) => {
        navigate(`/edit-task`, { state: { report } });
    };

    const formatTaskTime = (hours: string | number, minutes: string | number) => {
        const h = parseInt(hours as string) || 0;
        const m = parseInt(minutes as string) || 0;
        let timeString = "";
        if (h > 0) timeString += `${h} h`;
        if (m > 0) timeString += ` ${m} min`;
        return timeString.trim();
    };

    const formatLine = (task: any, level = 0, bulletType: string, index: number) => {
        const getBullet = (type: string, index: number) => {
            switch (type) {
                case "dot":
                    return "•";
                case "number":
                    return `${index + 1}.`;
                case ">":
                    return ">";
                case ">>":
                    return ">>";
                case "=>":
                    return "=>";
                case "bullet":
                    return "●";
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
            const taskTime = formatTaskTime(task.hours, task.minutes);
            if (taskTime) line += ` (${taskTime})`;
        }
        return line;
    };


    const formatTasks = (tasks: any[], level = 0, bulletType: string, subIcon: string): string =>
        tasks
            .map((task, index) => {
                const taskLine = `${formatLine(task, level, bulletType, index)}`;
                const subtaskLines = task.subtasks
                    ? formatTasks(task.subtasks, level + 1, subIcon, subIcon)
                    : "";
                return `${taskLine}${subtaskLines ? `\n${subtaskLines}` : ""}`;
            })
            .join("\n");

    const formatPreview = (data: any) => {
        const { tasks, selectedProjects, date, name, nextTask, bulletType, subIcon } = data;

        return `Today's work update - ${moment(date, "YYYY-MM-DD").format("YYYY-MM-DD")}

${selectedProjects.length > 0
                ? `Project: ${selectedProjects.map((p: any) => p.trim()).join(" & ")}`
                : ""
            } 
----------------------------------------
${formatTasks(tasks, 0, bulletType, subIcon)}
${nextTask && nextTask.trim()
                ? `\nNext's Tasks\n---------------------\n=> ${nextTask.trim()}`
                : ""
            }

Thanks & regards
${name.trim()}`;
    };
console.log(reportData, "reportData");

    return (
        <div className="reports-page">
            <div className="reports-header sticky-header">
                <h2>Reports</h2>
                <RangePicker
                    onChange={handleDateRangeChange}
                    format="DD/MM/YYYY"
                />
            </div>
            <div className="reports-content">
                {(reportData.length === 0 || !selectedDateRange) && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "calc(100vh - 80px)", // Full height minus header height
                            width: "100%", // Full width of the screen
                            textAlign: "center", // Center text alignment
                        }}
                    >
                        {!selectedDateRange && (
                            <p style={{ color: "#888", fontSize: "18px", fontWeight: "bold" }}>
                                Select a date range to view reports.
                            </p>
                        )}
                        {reportData.length === 0 && selectedDateRange && (
                            <div className="report-summary">
                                <p style={{ color: "#888", fontSize: "18px", fontWeight: "bold" }}>
                                    No reports found for the selected date range.
                                </p>
                            </div>
                        )}
                    </div>
                )}
                <div className="report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    {reportData.length > 0 && (
                        reportData.map((report, index) => (
                            <div key={index} className="report-card">
                                <div className="task-preview-header">
                                    <h3>{`Date: ${report.date}`}</h3>
                                    <div className="button-group" style={{ display: "flex", gap: "10px" }}>
                                        <Tooltip title="Copy to Clipboard">
                                            <Button
                                                type="default"
                                                icon={
                                                    copiedIndex === index
                                                        ? <CheckOutlined style={{ color: "#4caf50" }} />
                                                        : <CopyOutlined style={{ color: "#4caf50" }} />
                                                }
                                                onClick={() => handleCopy(report.data, index)}
                                            />
                                        </Tooltip>
                                        <Tooltip title="Edit Report">
                                            <Button
                                                type="default"
                                                icon={<EditOutlined style={{ color: "#1e88e5" }} />}
                                                onClick={() => handleEdit(report)}
                                            />
                                        </Tooltip>
                                        <Tooltip title="Delete Report">
                                            <Button
                                                type="default"
                                                danger
                                                icon={<DeleteOutlined style={{ color: "#f44336" }} />}
                                                onClick={() => handleDelete(report.date)}
                                            />
                                        </Tooltip>
                                    </div>
                                </div>
                                <pre className="script-style" style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                                    {formatPreview(report.data)}
                                </pre>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {copiedPreview && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    padding: "16px",
                    backgroundColor: "#333", /* Darker background for better contrast */
                    color: "#fff", /* White text for readability */
                    border: "1px solid #555", /* Subtle border */
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
        </div>
    );
};

export default ReportsPage;
