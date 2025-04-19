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
        // Combine default algorithm and dark algorithm for a hybrid theme
        algorithm: [theme.defaultAlgorithm, theme.darkAlgorithm],
        token: {
          colorPrimary: "#131629", // Set custom primary color
          colorText: "#d1d9e6", // Set a light blue-tinted text color
        },
      }}>
        <Task /> {/* Wrap Task with BrowserRouter */}
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
