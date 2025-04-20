import "./ReportsPage.css"
import { Button, DatePicker, Tooltip, Dropdown, Menu } from "antd";
import { CheckOutlined, CopyOutlined, DeleteOutlined, EditOutlined, FilePdfOutlined, FileExcelOutlined, FileTextOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs"; // Import dayjs
import isBetween from "dayjs/plugin/isBetween"; // Import isBetween plugin
import { fileExportIcon } from "../assets/fontAwesomeIcons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { reverseDate } from "../utils/dateUtils";

dayjs.extend(isBetween); // Extend dayjs with isBetween plugin

const { RangePicker } = DatePicker;

const ReportsPage: React.FC = () => {
    const [reportData, setReportData] = useState<Array<{ date: string; data: any }>>([]);
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
                const normalizedDate = dayjs(date, "YYYY-MM-DD");
                const normalizedStart = dayjs(start, "DD-MM-YYYY");
                const normalizedEnd = dayjs(end, "DD-MM-YYYY");

                return normalizedDate.isBetween(normalizedStart, normalizedEnd, "day", "[]"); // Use isBetween
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
        setReportData(reportData.filter((report: any) => report.date !== date));
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

    const formatPreview = (data: any) => {
        const { tasks, selectedProjects, date, name, nextTask, bulletType, subIcon } = data;

        const generateSettings = JSON.parse(localStorage.getItem("generateSettings") || "{}");
        const previewSettings = JSON.parse(localStorage.getItem("previewSettings") || "{}");

        const TASK_GAP = generateSettings.taskGap || 1; // Default to 1 if not set
        const SUBTASK_GAP = generateSettings.subtaskGap || 1; // Default to 1 if not set
        const workUpdateText = generateSettings.workUpdateText || "Today's work update -";
        const closingText = generateSettings.closingText || "Thanks & regards";

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

            let line = `${indent}${bullet} `;
            if (previewSettings.showID && task.taskId) line += `ID: ${task.taskId.toString().trim()} - `;
            line += task.title.trim();
            if (previewSettings.showStatus && task.status) line += ` (${task.status.trim()})`;
            if (previewSettings.showHours) {
                const taskTime = formatTaskTime(task.hours, task.minutes);
                if (taskTime) line += ` (${taskTime})`;
            }
            return line;
        };

        const formatTasks = (tasks: any[], level = 0, bulletType: string, subIcon: string): string =>
            tasks
                .map((task, index) => {
                    const taskLine = `${formatLine(task, level, bulletType, index)}`;
                    const subtaskLines = previewSettings.allowSubtask && task.subtasks
                        ? formatTasks(task.subtasks, level + 1, subIcon, subIcon)
                        : "";
                    return `${taskLine}${subtaskLines ? `\n${subtaskLines}` : ""}`;
                })
                .join("\n".repeat(level === 0 ? TASK_GAP : SUBTASK_GAP));

        return `${workUpdateText} ${previewSettings.showDate ? reverseDate(date) : ""}

${previewSettings.showProject && selectedProjects.length > 0
                ? `Project: ${selectedProjects.map((p: any) => p.trim()).join(" & ")}`
                : ""
            } 
----------------------------------------
${formatTasks(tasks, 0, bulletType, subIcon)}
${previewSettings.showNextTask && nextTask && nextTask.trim()
                ? `\nNext's Tasks\n---------------------\n=> ${nextTask.trim()}`
                : ""
            }

${closingText}
${name?.trim()}`;
    };

    const handleExport = (key: string) => {
        if (key !== "pdf") return;
    
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
        // Constants for styling
        const HEADER_COLOR = "#4A90E2"; // Blue header color
        const HEADER_TEXT_COLOR = "#ffffff"; // White text color in header
        const FONT_FAMILY = "Helvetica"; // Professional font
        const TITLE_FONT_SIZE = 18;
        const SUBTITLE_FONT_SIZE = 12;
    
        // Convert "YYYY-MM-DD" to "DD/MM/YYYY"
        const formatDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-");
            return `${day}/${month}/${year}`;
        };
    
        // Sorting data and defining date range
        const sortedData = [...reportData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    
        const dates = sortedData.map((item) => item.date);
        const fromDate = selectedDateRange?.[0] || dates[0];
        const toDate = selectedDateRange?.[1] || dates[dates.length - 1];
    
        // Add a header with a background color
        doc.setFillColor(HEADER_COLOR);
        doc.rect(0, 0, 210, 30, "F"); // Full-width header with height of 30mm
        doc.setFont(FONT_FAMILY, "bold");
        doc.setFontSize(TITLE_FONT_SIZE);
        doc.setTextColor(HEADER_TEXT_COLOR);
        doc.text("Monthly Work Report", 105, 15, { align: "center" }); // Center-aligned title with spacing above
    
        // Add name on the left and date on the right
        doc.setFont(FONT_FAMILY, "normal");
        doc.setFontSize(SUBTITLE_FONT_SIZE);
        doc.setTextColor(HEADER_TEXT_COLOR);
        doc.text("Name: Sagar", 10, 28); // Left-aligned name
        doc.text(`Date: ${formatDate(fromDate)} to ${formatDate(toDate)}`, 200, 28, { align: "right" }); // Right-aligned date
    
        // Table Rows Preparation
        const allRows: any[] = [];
        let previousMonthYear = "";
    
        sortedData.forEach((entry) => {
            const date = entry.date;
            const dayData = entry.data || {};
            const tasks = dayData.tasks || [];
    
            const currentMonthYear = formatDate(date).slice(3, 10); // MM/YYYY
    
            if (currentMonthYear !== previousMonthYear) {
                previousMonthYear = currentMonthYear;
            }
    
            let isFirstTask = true;
    
            tasks.forEach((task: any) => {
                allRows.push([
                    isFirstTask ? formatDate(date) : "",
                    task?.id || task?.taskId || "",
                    task?.title || "",
                    task?.status || "",
                    `${task?.hours || 0}h ${task?.minutes || 0}m`,
                ]);
                isFirstTask = false;
    
                if (task?.subtasks?.length > 0) {
                    task.subtasks.forEach((subtask: any) => {
                        allRows.push([
                            "",
                            "",
                            subtask?.title || "",
                            subtask?.status || "",
                            `${subtask?.hours || 0}h ${subtask?.minutes || 0}m`,
                        ]);
                    });
                }
            });
        });
    
        // Adding Table with Stylish Layout (Full width adjustment)
        const tableStartY = 35; // Starting Y position for the table
    
        autoTable(doc, {
            startY: tableStartY, // Start the table below the text
            head: [["Date", "ID", "Task", "Status", "Time"]],
            body: allRows,
            styles: {
                fontSize: 9,
                cellPadding: 2, // Reduced padding for more content space
                overflow: "linebreak",
                font: FONT_FAMILY,
                fillColor: [240, 240, 240], // Light grey fill for rows
                cellWidth: "auto", // Full width usage for each column
            },
            headStyles: {
                fillColor: HEADER_COLOR,
                textColor: HEADER_TEXT_COLOR,
                fontSize: 11,
                font: FONT_FAMILY,
            },
            columnStyles: {
                0: { cellWidth: 30 }, // Static width for Date
                1: { cellWidth: 20 }, // Static width for ID
                2: { cellWidth: "auto" }, // Dynamic width for Task Title
                3: { cellWidth: 30 }, // Static width for Status
                4: { cellWidth: 30 }, // Static width for Time
            },
            theme: "grid",
            alternateRowStyles: { fillColor: [220, 220, 220] }, // Light row color
            didDrawPage: function (data) {
                const cursorY = data.cursor?.y ?? 0; // Default to 0 if data.cursor is null
                if (cursorY > 290) {
                    doc.addPage(); // If table overflows, add a new page
                }
            }
        });
    
        // Add footer with page number
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${doc.getNumberOfPages()}`, 190, 285);
    
        // Save the document with professional naming
        doc.save(`task-report-${fromDate}-to-${toDate}.pdf`);
    };    
    

    const calculateSummary = (reports: any[]) => {
        let totalHours = 0;
        let totalMinutes = 0;

        reports.forEach((report) => {
            const tasks = report.data.tasks || [];
            tasks.forEach((task: any) => {
                totalHours += Number(task.hours) || 0; // Ensure hours are treated as numbers
                totalMinutes += Number(task.minutes) || 0; // Ensure minutes are treated as numbers

                if (task.subtasks?.length > 0) {
                    task.subtasks.forEach((subtask: any) => {
                        totalHours += Number(subtask.hours) || 0; // Ensure subtask hours are numbers
                        totalMinutes += Number(subtask.minutes) || 0; // Ensure subtask minutes are numbers
                    });
                }
            });
        });

        // Convert total minutes to hours and adjust total hours and minutes
        totalHours += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;

        const totalWorkedHours = totalHours + totalMinutes / 60;
        const actualWorkingHours = reports.length * 8.5; // Assuming 8.5 hours per day
        const extraHours = totalWorkedHours > actualWorkingHours ? totalWorkedHours - actualWorkingHours : 0;
        const lessHours = totalWorkedHours < actualWorkingHours ? actualWorkingHours - totalWorkedHours : 0;

        return { totalHours, totalMinutes, actualWorkingHours, extraHours, lessHours };
    };

    const exportMenu = (
        <Menu
            onClick={({ key }) => handleExport(key as string)}
            items={[
                {
                    key: "pdf",
                    icon: <FilePdfOutlined style={{ color: "#e74c3c" }} />,
                    label: "Export as PDF",
                    disabled: reportData.length === 0, // Disable if no data
                },
                {
                    key: "excel",
                    icon: <FileExcelOutlined style={{ color: "#27ae60" }} />,
                    label: "Export as Excel",
                    disabled: true, // Placeholder for future implementation
                },
                {
                    key: "sheet",
                    icon: <FileTextOutlined style={{ color: "#3498db" }} />,
                    label: "Export as Sheet",
                    disabled: true, // Placeholder for future implementation
                },
            ]}
        />
    );

    return (
        <div className="reports-page">
            <div className="reports-header sticky-header">
                <h2>Reports</h2>
                <div className="reports-header-controls">
                    <RangePicker
                        onChange={handleDateRangeChange}
                        format="DD-MM-YYYY" // Display date in DD-MM-YYYY format
                    />
                    <Dropdown overlay={exportMenu} trigger={['click']}>
                        <Button
                            type="default"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                border: "1px solid rgb(91 100 99)", // Custom border color
                                color: "#f39c12", // Custom text color
                            }}
                        >
                            <span style={{ color: "#f39c12", fontSize: "18px" }}>{fileExportIcon}</span>
                            Export
                        </Button>
                    </Dropdown>
                </div>
            </div>
            <div className="reports-content">
                {selectedDateRange && reportData.length > 0 && (
                    <div className="summary-section">
                        {(() => {
                            const { totalHours, totalMinutes, actualWorkingHours, extraHours, lessHours } = calculateSummary(reportData);
                            console.log("Total Hours:", totalHours, "Total Minutes:", totalMinutes, "Actual Working Hours:", actualWorkingHours, "Extra Hours:", extraHours, "Less Hours:", lessHours);
                            
                            // Determine text colors based on conditions
                            const workedHoursColor = totalHours + totalMinutes / 60 === actualWorkingHours
                                ? "green"
                                : totalHours + totalMinutes / 60 > actualWorkingHours
                                    ? "green"
                                    : "red";

                            const extraHoursColor = extraHours > 0 ? "green" : "inherit";
                            const lessHoursColor = lessHours > 0 ? "yellow" : "inherit";

                            return (
                                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                                    <p>
                                        <strong>Total Hours :</strong> 
                                        <span style={{ color: "green" }}> {actualWorkingHours.toFixed(2)} h</span>
                                    </p>
                                    <p>
                                        <strong>Worked Hours :</strong> 
                                        <span style={{ color: workedHoursColor }}> {totalHours} h {totalMinutes} min</span>
                                    </p>
                                    <p>
                                        <strong>Extra Hours :</strong> 
                                        <span style={{ color: extraHoursColor }}> {extraHours.toFixed(2)} h</span>
                                    </p>
                                    <p>
                                        <strong>Less Worked :</strong> 
                                        <span style={{ color: lessHoursColor }}> {lessHours.toFixed(2)} h</span>
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                )}
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
                <div className="report-grid">
                    {reportData.length > 0 && (
                        reportData.map((report: any, index: number) => (
                            <div key={index} className="report-card">
                                <div className="task-preview-header">
                                    <h3>{`Date: ${dayjs(report.date, "YYYY-MM-DD").format("DD-MM-YYYY")}`}</h3>
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
