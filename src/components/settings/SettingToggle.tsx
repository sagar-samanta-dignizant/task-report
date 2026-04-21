import type { ReactNode } from "react";
import "./SettingToggle.css";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  stacked?: boolean;
}

export const SettingToggle = ({ icon, title, description, children, stacked }: Props) => (
  <div className={`setting-row ${stacked ? "setting-row-stacked" : ""}`}>
    {icon && <span className="setting-row-icon">{icon}</span>}
    <div className="setting-row-text">
      <div className="setting-row-title">{title}</div>
      {description && <div className="setting-row-desc">{description}</div>}
    </div>
    <div className="setting-row-control">{children}</div>
  </div>
);

export default SettingToggle;
