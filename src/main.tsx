import "./index.css";

import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import React from "react";
import ReactDOM from "react-dom/client";
import Task from "./App"; // Import the Task component

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Task /> {/* Wrap Task with BrowserRouter */}
    </BrowserRouter>
  </React.StrictMode>
);
