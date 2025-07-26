import { ConfigProvider, theme } from "antd";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter
import ReactDOM from "react-dom/client";
import App from "./App"; // Import the Task component
import VersionChecker from "./components/VersionChecker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ConfigProvider theme={{
      algorithm: [theme.defaultAlgorithm, theme.darkAlgorithm],
      token: {
      },
    }}>
      <>
        {/* <VersionChecker /> */}
        <App />
      </>
    </ConfigProvider>
  </BrowserRouter>
);
