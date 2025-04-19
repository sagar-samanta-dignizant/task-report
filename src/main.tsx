import "./index.css";
import { ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import React from "react";
import ReactDOM from "react-dom/client";
import Task from "./App"; // Import the Task component

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={{
        // 1. Use dark algorithm
        algorithm: theme.darkAlgorithm,

        // 2. Combine dark algorithm and compact algorithm
        // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
      }}>
        <Task /> {/* Wrap Task with BrowserRouter */}
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
