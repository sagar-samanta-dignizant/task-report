import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, Dropdown, Menu, Tooltip } from "antd";
import {
  HomeOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../theme/ThemeContext";
import "./Sidebar.css";

interface SidebarProps {
  name: string;
  profilePicture: string;
  onLogout: () => void;
}

const COLLAPSE_KEY = "app:sidebar";

export const Sidebar = ({ name, profilePicture, onLogout }: SidebarProps) => {
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "72px" : "240px"
    );
  }, [collapsed]);

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <Tooltip title={collapsed ? label : ""} placement="right">
      <NavLink
        to={to}
        className={({ isActive }) => `sidebar-nav-link ${isActive ? "active" : ""}`}
        end={to === "/"}
      >
        <span className="sidebar-nav-icon">{icon}</span>
        {!collapsed && <span className="sidebar-nav-label">{label}</span>}
      </NavLink>
    </Tooltip>
  );

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden>📊</span>
        {!collapsed && <span className="sidebar-brand-text">Report Manager</span>}
      </div>

      <nav className="sidebar-nav">
        {navItem("/", <HomeOutlined />, "Home")}
        {navItem("/reports", <FileTextOutlined />, "Reports")}
        {navItem("/settings", <SettingOutlined />, "Settings")}
      </nav>

      <div className="sidebar-footer">
        <Tooltip title={theme === "dark" ? "Light mode" : "Dark mode"} placement="right">
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </Tooltip>

        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="logout" onClick={onLogout}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <LogoutOutlined style={{ fontSize: 16 }} /> Logout
                </span>
              </Menu.Item>
            </Menu>
          }
          placement={collapsed ? "topRight" : "topLeft"}
          trigger={["click"]}
        >
          <button type="button" className="sidebar-user">
            <Avatar
              src={profilePicture || undefined}
              size={32}
              style={{
                backgroundColor: profilePicture ? "transparent" : "var(--accent)",
                flexShrink: 0,
              }}
            >
              {!profilePicture && name ? name[0].toUpperCase() : null}
            </Avatar>
            {!collapsed && (
              <span className="sidebar-user-name">{name || "Guest"}</span>
            )}
          </button>
        </Dropdown>

        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
