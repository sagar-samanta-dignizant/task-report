import { ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import ReactDOM from "react-dom/client";
import App from "./App"; // Import the Task component

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <ConfigProvider theme={{
        algorithm: [theme.defaultAlgorithm, theme.darkAlgorithm],
        token: {
        },
      }}>
        <App /> {/* Wrap Task with BrowserRouter */}
      </ConfigProvider>
    </BrowserRouter>
);
