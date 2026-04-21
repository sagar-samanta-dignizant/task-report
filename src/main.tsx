import "./theme/tokens.css";

import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import App from "./App";
import VersionChecker from "./components/VersionChecker";
import NotificationScheduler from "./components/NotificationScheduler";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";

const ThemedApp = () => {
  const { theme, accent } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: accent.color,
          colorInfo: accent.color,
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          borderRadius: 10,
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
          // Base palette — keep in sync with src/theme/tokens.css.
          // Inputs/Selects/DatePickers sit on the sunken surface so they
          // visibly recess from the surface cards they live in.
          colorBgBase: theme === "dark" ? "#0a0b12" : "#f6f7fb",
          colorBgContainer: theme === "dark" ? "#0f121d" : "#f4f6fb",
          colorBgElevated: theme === "dark" ? "#1d2234" : "#ffffff",
          colorBgLayout: theme === "dark" ? "#0a0b12" : "#f6f7fb",
          colorBorder: theme === "dark" ? "#2a3048" : "#dfe3ec",
          colorBorderSecondary: theme === "dark" ? "#1f2436" : "#eef0f7",
          colorText: theme === "dark" ? "#e6e8ef" : "#0f172a",
          colorTextSecondary: theme === "dark" ? "#b8bdcc" : "#334155",
          colorTextTertiary: theme === "dark" ? "#8891a6" : "#64748b",
          controlHeight: 36,
        },
      }}
    >
      <AntdApp>
        <ErrorBoundary>
          <VersionChecker />
          <NotificationScheduler />
          <App />
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </BrowserRouter>
);
