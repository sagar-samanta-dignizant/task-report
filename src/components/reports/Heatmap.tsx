import dayjs, { Dayjs } from "dayjs";
import { useMemo } from "react";
import { Tooltip } from "antd";
import "./Heatmap.css";

interface Props {
  filledDates: string[]; // YYYY-MM-DD
  weeks?: number;
  onSelect?: (date: string) => void;
}

const DOW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export const Heatmap = ({ filledDates, weeks = 26, onSelect }: Props) => {
  const filledSet = useMemo(() => new Set(filledDates), [filledDates]);

  const { grid, monthLabels, filledCount, totalDays } = useMemo(() => {
    const today = dayjs().endOf("day");
    const endWeekStart = today.startOf("week");
    const startWeekStart = endWeekStart.subtract(weeks - 1, "week");

    const grid: Array<Array<{ date: Dayjs | null; key: string }>> = [];
    const monthLabels: Array<{ col: number; label: string }> = [];

    let lastMonth = -1;
    let filled = 0;
    let total = 0;

    for (let w = 0; w < weeks; w++) {
      const col: Array<{ date: Dayjs | null; key: string }> = [];
      const weekStart = startWeekStart.add(w, "week");
      for (let d = 0; d < 7; d++) {
        const day = weekStart.add(d, "day");
        if (day.isAfter(today)) {
          col.push({ date: null, key: `empty-${w}-${d}` });
          continue;
        }
        col.push({ date: day, key: day.format("YYYY-MM-DD") });
        total++;
        if (filledSet.has(day.format("YYYY-MM-DD"))) filled++;
      }
      grid.push(col);

      const firstDayOfWeek = weekStart;
      if (firstDayOfWeek.month() !== lastMonth) {
        if (firstDayOfWeek.date() <= 7) {
          monthLabels.push({ col: w, label: firstDayOfWeek.format("MMM") });
        }
        lastMonth = firstDayOfWeek.month();
      }
    }

    return { grid, monthLabels, filledCount: filled, totalDays: total };
  }, [weeks, filledSet]);

  return (
    <div className="heatmap">
      <div className="heatmap-head">
        <div className="heatmap-title">Last {weeks} weeks</div>
        <div className="heatmap-summary">
          <strong>{filledCount}</strong>
          <span className="heatmap-summary-sep">of</span>
          <strong>{totalDays}</strong>
          <span className="heatmap-summary-sep">days logged</span>
        </div>
      </div>

      <div className="heatmap-chart">
        <div className="heatmap-dow">
          {DOW_LABELS.map((label, i) => (
            <div key={i} className="heatmap-dow-label">
              {label}
            </div>
          ))}
        </div>
        <div className="heatmap-grid-wrap">
          <div className="heatmap-month-row">
            {monthLabels.map((m) => (
              <div
                key={`${m.col}-${m.label}`}
                className="heatmap-month-label"
                style={{ left: `${m.col * 14}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>
          <div className="heatmap-grid">
            {grid.map((col, ci) => (
              <div key={ci} className="heatmap-col">
                {col.map((cell) => {
                  if (!cell.date) {
                    return <div key={cell.key} className="heatmap-cell is-empty" />;
                  }
                  const dateStr = cell.date.format("YYYY-MM-DD");
                  const isFilled = filledSet.has(dateStr);
                  const isToday = cell.date.isSame(dayjs(), "day");
                  return (
                    <Tooltip
                      key={cell.key}
                      title={`${cell.date.format("ddd · DD MMM YYYY")} — ${isFilled ? "logged" : "no report"}`}
                      mouseEnterDelay={0.2}
                    >
                      <button
                        type="button"
                        className={`heatmap-cell ${isFilled ? "is-filled" : ""} ${isToday ? "is-today" : ""}`}
                        onClick={() => onSelect?.(dateStr)}
                        aria-label={`${dateStr} ${isFilled ? "has report" : "no report"}`}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <span className="heatmap-cell is-legend" />
        <span className="heatmap-cell is-legend is-filled" style={{ opacity: 0.55 }} />
        <span className="heatmap-cell is-legend is-filled" />
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
