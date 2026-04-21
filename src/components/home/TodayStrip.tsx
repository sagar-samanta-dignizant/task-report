import dayjs from "dayjs";
import "./TodayStrip.css";

interface Props {
  date: string;
  workingHours: number;
  usedHours: number;
  taskCount: number;
  hiddenCount: number;
}

const fmt = (h: number) => {
  const hours = Math.floor(Math.abs(h));
  const mins = Math.round((Math.abs(h) - hours) * 60);
  return `${hours}h ${mins}m`;
};

export const TodayStrip = ({ date, workingHours, usedHours, taskCount, hiddenCount }: Props) => {
  const pct = Math.max(0, Math.min(100, (usedHours / workingHours) * 100));
  const overtime = usedHours > workingHours;
  const label = dayjs(date, "YYYY-MM-DD").format("dddd · DD MMM YYYY");

  return (
    <div className="today-strip">
      <div className="today-left">
        <div className="today-date">
          <span className="today-date-icon" aria-hidden>📅</span>
          <span>{label}</span>
        </div>
        <div className="today-progress">
          <div
            className={`today-progress-bar ${overtime ? "overtime" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="today-progress-text">
          <span className={overtime ? "overtime-text" : ""}>
            {fmt(usedHours)}
          </span>
          <span className="today-divider">/</span>
          <span className="today-total">{fmt(workingHours)}</span>
        </div>
      </div>

      <div className="today-stats">
        <div className="today-stat">
          <span className="today-stat-value">{taskCount}</span>
          <span className="today-stat-label">Tasks</span>
        </div>
        {hiddenCount > 0 && (
          <div className="today-stat">
            <span className="today-stat-value">{hiddenCount}</span>
            <span className="today-stat-label">Hidden</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayStrip;
