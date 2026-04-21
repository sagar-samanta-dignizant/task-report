import React, { useState } from "react";
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import "./LoginPage.css";
import { USERS } from "../constant/users.constant";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    if (!trimmedUsername || !trimmedPassword) {
      setError("Username and password are required");
      return;
    }
    const found = USERS.find(
      (user) => user.username === trimmedUsername && user.password === trimmedPassword
    );
    if (found) {
      localStorage.setItem("isLoggedIn", "true");
      onLogin();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden>📊</span>
          <span>Report Manager</span>
        </div>
        <h1 className="login-headline">
          Ship your daily update
          <br />
          in under a minute.
        </h1>
        <p className="login-sub">
          Build a clean, formatted work report with tasks, subtasks, and
          per-day history — all local-first.
        </p>
        <ul className="login-features">
          <li>
            <ThunderboltOutlined className="login-feature-icon" />
            <div>
              <strong>Keyboard-driven</strong>
              <span>Ctrl+Enter to add, Ctrl+S to save, Ctrl+Shift+C to copy.</span>
            </div>
          </li>
          <li>
            <CheckCircleOutlined className="login-feature-icon" />
            <div>
              <strong>One-click preview</strong>
              <span>See the exact text going into Slack, Teams, or email.</span>
            </div>
          </li>
          <li>
            <BarChartOutlined className="login-feature-icon" />
            <div>
              <strong>Weekly summary</strong>
              <span>Heatmap, hours logged, and PDF export in Reports.</span>
            </div>
          </li>
        </ul>
      </div>

      <div className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className="login-form-sub">Sign in to continue.</p>
          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              placeholder="your-handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit">Sign in</button>
          <p className="login-footnote">
            Data is stored locally on this device.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
