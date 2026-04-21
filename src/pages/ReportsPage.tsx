import "./ReportsPage.css";

import {
  Button,
  DatePicker,
  Dropdown,
  Menu,
  Popconfirm,
  Select,
  Tooltip,
  Input,
  App as AntdApp,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import { fileExportIcon } from "../assets/fontAwesomeIcons";
import isBetween from "dayjs/plugin/isBetween";
import { useNavigate } from "react-router-dom";

import { useHotkey } from "../hooks/useHotkey";
import { formatPreview } from "../utils/previewFormatter";
import {
  deleteReport as deleteReportFromStore,
  getAllReports,
} from "../utils/reportsStore";
import Heatmap from "../components/reports/Heatmap";
import {
  buildRows,
  filterEnabledColumns,
  resolveColumnOrder,
  rowsToCsv,
} from "../utils/exportColumns";
import type { GenerateSettings, PreviewSettings, Report } from "../types/task";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Search } = Input;

type SortOrder = "desc" | "asc";

const readGenerateSettings = (): GenerateSettings => {
  try {
    return JSON.parse(localStorage.getItem("generateSettings") || "{}");
  } catch {
    return {};
  }
};

const readPreviewSettings = (): PreviewSettings => {
  try {
    return JSON.parse(localStorage.getItem("previewSettings") || "{}");
  } catch {
    return {
      allowSubtask: false,
      showHours: true,
      showStatus: true,
      showDate: true,
      showID: true,
      showNextTask: false,
      showProject: true,
    };
  }
};

const ReportsPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const [allReports, setAllReports] = useState<Array<{ date: string; data: Report }>>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string] | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () => (localStorage.getItem("reportSortOrder") as SortOrder) || "desc"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    setAllReports(getAllReports());
  }, []);

  useEffect(() => {
    const defaultStart = dayjs().startOf("month").format("DD-MM-YYYY");
    const defaultEnd = dayjs().endOf("month").format("DD-MM-YYYY");
    setSelectedDateRange([defaultStart, defaultEnd]);
  }, []);

  useEffect(() => {
    localStorage.setItem("reportSortOrder", sortOrder);
  }, [sortOrder]);

  const reportData = useMemo(() => {
    if (!selectedDateRange) return [];
    const [start, end] = selectedDateRange;
    if (!start || !end) return [];
    const normalizedStart = dayjs(start, "DD-MM-YYYY");
    const normalizedEnd = dayjs(end, "DD-MM-YYYY");
    const filtered = allReports.filter(({ date }) => {
      const d = dayjs(date, "YYYY-MM-DD");
      return d.isBetween(normalizedStart, normalizedEnd, "day", "[]");
    });
    return filtered.sort((a, b) =>
      sortOrder === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    );
  }, [allReports, selectedDateRange, sortOrder]);

  const handleDateRangeChange = (_: unknown, dateStrings: [string, string]) => {
    setSelectedDateRange(dateStrings);
  };

  const applyQuickRange = (from: Dayjs, to: Dayjs) => {
    setSelectedDateRange([from.format("DD-MM-YYYY"), to.format("DD-MM-YYYY")]);
  };

  const buildPreview = (report: Report): string =>
    formatPreview({
      report,
      previewSettings: readPreviewSettings(),
      generateSettings: readGenerateSettings(),
    });

  const handleCopy = useCallback(
    (data: Report) => {
      const preview = buildPreview(data);
      navigator.clipboard.writeText(preview);
      message.success("Copied to clipboard");
    },
    [message]
  );

  const handleDelete = (date: string) => {
    deleteReportFromStore(date);
    setAllReports((prev) => prev.filter((r) => r.date !== date));
    message.success(`Deleted report for ${dayjs(date, "YYYY-MM-DD").format("DD MMM YYYY")}`);
  };

  const handleEdit = (report: { date: string; data: Report }) => {
    navigate(`/edit-task`, {
      state: {
        report,
        bulletType: report.data.bulletType,
        subIcon: report.data.subIcon,
      },
    });
  };

  const handleHeatmapSelect = (date: string) => {
    const d = dayjs(date, "YYYY-MM-DD");
    setSelectedDateRange([d.format("DD-MM-YYYY"), d.format("DD-MM-YYYY")]);
  };

  const handleExport = async (key: string) => {
    if (key !== "pdf" && key !== "csv") return;

    const exportSettings = (() => {
      try {
        return JSON.parse(localStorage.getItem("exportSettings") || "{}");
      } catch {
        return {};
      }
    })();
    const toggles = {
      showID: exportSettings.showID === true,
      showDate: exportSettings.showDate === true,
      showStatus: exportSettings.showStatus === true,
      showHours: exportSettings.showHours === true,
      showProject: exportSettings.showProject === true,
    };
    const includeSubtasks = exportSettings.allowSubtask === true;
    const includeNextTask = exportSettings.showNextTask === true;
    const order = resolveColumnOrder(exportSettings.columnOrder);
    const columns = filterEnabledColumns(order, toggles);

    const sortedData = [...reportData];
    const dates = sortedData.map((i) => i.date);
    const fromDate = selectedDateRange?.[0] || (dates.length ? dates[0] : "");
    const toDate = selectedDateRange?.[1] || (dates.length ? dates[dates.length - 1] : "");

    // Build row dicts once (keyed by column key) and let each format pick columns.
    const rowDicts = sortedData.flatMap((entry) =>
      buildRows(entry.data, { includeSubtasks, includeNextTask })
    );

    if (key === "csv") {
      const csv = rowsToCsv(rowDicts, columns);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `task-report-${fromDate}-to-${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("CSV exported");
      return;
    }

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const HEADER_COLOR = "#8b5cf6";
    const HEADER_TEXT_COLOR = "#ffffff";
    const FONT_FAMILY = "Helvetica";

    doc.setFillColor(HEADER_COLOR);
    doc.rect(0, 0, 210, 30, "F");
    doc.setFont(FONT_FAMILY, "bold");
    doc.setFontSize(18);
    doc.setTextColor(HEADER_TEXT_COLOR);
    doc.text("Work Report", 105, 15, { align: "center" });

    doc.setFont(FONT_FAMILY, "normal");
    doc.setFontSize(12);
    doc.setTextColor(HEADER_TEXT_COLOR);
    const name = localStorage.getItem("name") || "";
    doc.text(`Name : ${name}`, 10, 28);
    doc.text(`Date: ${fromDate} to ${toDate}`, 200, 28, { align: "right" });

    const tableHeaders = columns.map((c) => c.label);
    const body = rowDicts.map((r) => columns.map((c) => r[c.key] || ""));

    const columnStyles: Record<number, { cellWidth: number | "auto" }> = {};
    columns.forEach((c, idx) => {
      columnStyles[idx] = { cellWidth: c.widthMm ?? "auto" };
    });

    autoTable(doc, {
      startY: 35,
      head: [tableHeaders],
      body,
      columnStyles,
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: "linebreak",
        font: FONT_FAMILY,
        fillColor: [245, 247, 252],
        cellWidth: "auto",
      },
      headStyles: { fillColor: HEADER_COLOR, textColor: HEADER_TEXT_COLOR, fontSize: 11, font: FONT_FAMILY },
      theme: "grid",
      alternateRowStyles: { fillColor: [228, 231, 242] },
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Page ${doc.getNumberOfPages()}`, 190, 285);

    doc.save(`task-report-${fromDate}-to-${toDate}.pdf`);
    message.success("PDF exported");
  };

  const calculateSummary = (reports: Array<{ date: string; data: Report }>) => {
    let totalHours = 0;
    let totalMinutes = 0;
    reports.forEach((report) => {
      const tasks = report.data.tasks || [];
      tasks.forEach((task) => {
        // If subtasks exist, only count them (parent hours/minutes are an aggregate
        // of the subtasks and would double-count if included here).
        if (task.subtasks?.length) {
          task.subtasks.forEach((s) => {
            totalHours += Number(s.hours) || 0;
            totalMinutes += Number(s.minutes) || 0;
          });
        } else {
          totalHours += Number(task.hours) || 0;
          totalMinutes += Number(task.minutes) || 0;
        }
      });
    });
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes %= 60;

    const totalWorkedHours = totalHours + totalMinutes / 60;
    const actualWorkingHours = reports.length * 8.5;
    const extra = totalWorkedHours > actualWorkingHours ? totalWorkedHours - actualWorkingHours : 0;
    const less = totalWorkedHours < actualWorkingHours ? actualWorkingHours - totalWorkedHours : 0;

    const formatTime = (hours: number, minutes: number) => {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60 + minutes);
      return `${h > 0 ? `${h}h` : "0h"} ${m > 0 ? `${m}m` : "0m"}`.trim();
    };

    return {
      totalHours,
      totalMinutes,
      actualWorkingHours: formatTime(Math.floor(actualWorkingHours), (actualWorkingHours % 1) * 60),
      extraHours: formatTime(Math.floor(extra), (extra % 1) * 60),
      lessHours: formatTime(Math.floor(less), (less % 1) * 60),
    };
  };

  const exportMenu = (
    <Menu
      onClick={({ key }) => handleExport(key as string)}
      items={[
        {
          key: "pdf",
          icon: <FilePdfOutlined style={{ color: "var(--danger)" }} />,
          label: "Export as PDF",
          disabled: reportData.length === 0,
        },
        {
          key: "csv",
          icon: <FileExcelOutlined style={{ color: "var(--success)" }} />,
          label: "Export as CSV",
          disabled: reportData.length === 0,
        },
      ]}
    />
  );

  const filledDates = useMemo(() => allReports.map((r) => r.date), [allReports]);

  const copyFirst = useCallback(() => {
    if (reportData.length > 0) handleCopy(reportData[0].data);
  }, [reportData, handleCopy]);
  useHotkey("ctrl+shift+c", copyFirst, reportData.length > 0);

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const query = searchQuery.toLowerCase();
    return reportData.filter((report) => {
      const data = report.data;
      const tasks = data.tasks || [];
      const projects = (data.selectedProjects || []).join(" ");
      const nextTask = data.nextTask || "";
      const name = data.name || "";
      const taskMatch = tasks.some((task) => {
        const taskText = `${task.title || ""} ${task.status || ""} ${task.taskId || ""} ${task.hours || ""} ${task.minutes || ""}`.toLowerCase();
        const subtaskMatch = task.subtasks?.some((sub) =>
          `${sub.title || ""} ${sub.status || ""} ${sub.taskId || ""} ${sub.hours || ""} ${sub.minutes || ""}`
            .toLowerCase()
            .includes(query)
        );
        return taskText.includes(query) || subtaskMatch;
      });
      return (
        report.date.toLowerCase().includes(query) ||
        projects.toLowerCase().includes(query) ||
        nextTask.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        taskMatch
      );
    });
  }, [reportData, searchQuery]);

  return (
    <div className="reports-page">
      <div className="reports-toolbar">
        <Search
          placeholder="Search title, status, project…"
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 320, flex: "1 1 260px" }}
        />
        <div className="reports-toolbar-right">
          <div className="quick-chips">
            <button
              type="button"
              className="chip"
              onClick={() => applyQuickRange(dayjs().startOf("week"), dayjs().endOf("week"))}
            >
              This week
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => applyQuickRange(dayjs().startOf("month"), dayjs().endOf("month"))}
            >
              This month
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => applyQuickRange(dayjs().subtract(30, "day"), dayjs())}
            >
              Last 30d
            </button>
          </div>
          <RangePicker
            onChange={handleDateRangeChange}
            format="DD-MM-YYYY"
            value={
              selectedDateRange
                ? [
                    dayjs(selectedDateRange[0], "DD-MM-YYYY"),
                    dayjs(selectedDateRange[1], "DD-MM-YYYY"),
                  ]
                : null
            }
          />
          <Select
            value={sortOrder}
            style={{ width: 140 }}
            onChange={setSortOrder}
            options={[
              { value: "desc", label: "Newest first" },
              { value: "asc", label: "Oldest first" },
            ]}
          />
          <Dropdown overlay={exportMenu} trigger={["click"]}>
            <Button>
              <span style={{ color: "var(--accent)", marginRight: 6 }}>{fileExportIcon}</span>
              Export
            </Button>
          </Dropdown>
        </div>
      </div>

      <Heatmap filledDates={filledDates} weeks={26} onSelect={handleHeatmapSelect} />

      {selectedDateRange && reportData.length > 0 && (
        <div className="summary-section">
          {(() => {
            const { totalHours, totalMinutes, actualWorkingHours, extraHours, lessHours } =
              calculateSummary(reportData);
            return (
              <>
                <div className="summary-stat">
                  <span className="summary-stat-label">Working hours</span>
                  <span className="summary-stat-value" style={{ color: "var(--success)" }}>
                    {actualWorkingHours}
                  </span>
                </div>
                <div className="summary-stat">
                  <span className="summary-stat-label">Actual worked</span>
                  <span className="summary-stat-value">
                    {totalHours}h {totalMinutes}m
                  </span>
                </div>
                <div className="summary-stat">
                  <span className="summary-stat-label">Overtime</span>
                  <span className="summary-stat-value" style={{ color: "var(--success)" }}>
                    {extraHours}
                  </span>
                </div>
                <div className="summary-stat">
                  <span className="summary-stat-label">Undertime</span>
                  <span className="summary-stat-value" style={{ color: "var(--warning)" }}>
                    {lessHours}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="reports-content">
        {(filteredReports.length === 0 || !selectedDateRange) && (
          <div className="reports-empty">
            {!selectedDateRange && <p>Select a date range to view reports.</p>}
            {filteredReports.length === 0 && selectedDateRange && (
              <p>No reports match the selected filters.</p>
            )}
          </div>
        )}
        <div className="report-grid">
          {filteredReports.map((report) => (
            <div key={report.date} className="report-card">
              <div className="task-preview-header">
                <h3>{dayjs(report.date, "YYYY-MM-DD").format("ddd · DD MMM YYYY")}</h3>
                <div className="button-group" style={{ gap: 4 }}>
                  <Tooltip title="Copy to clipboard">
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(report.data)}
                    />
                  </Tooltip>
                  <Tooltip title="Edit report">
                    <Button
                      type="text"
                      icon={<EditOutlined style={{ color: "var(--info)" }} />}
                      onClick={() => handleEdit(report)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this report?"
                    description={`This will permanently remove the ${dayjs(report.date, "YYYY-MM-DD").format("DD MMM YYYY")} entry.`}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                    onConfirm={() => handleDelete(report.date)}
                  >
                    <Tooltip title="Delete report">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined style={{ color: "var(--danger)" }} />}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>
              </div>
              <pre className="script-style">{buildPreview(report.data)}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
