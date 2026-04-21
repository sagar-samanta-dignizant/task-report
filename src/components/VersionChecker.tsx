import { useEffect, useRef, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import "./VersionChecker.css";

const POLL_MS = 5 * 60 * 1000; // 5 minutes

const VersionChecker = () => {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const currentVersionRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkVersion = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/version.json", { cache: "no-cache" });
        if (!response.ok) return;
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const data = (await response.json()) as { version?: string };
        if (cancelled || !data.version) return;
        if (currentVersionRef.current == null) {
          currentVersionRef.current = data.version;
        } else if (data.version !== currentVersionRef.current) {
          setShowUpdateNotice(true);
          setNewVersion(data.version);
        }
      } catch {
        // network hiccup — ignore, we'll retry on next tick
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") checkVersion();
    };

    checkVersion();
    const interval = window.setInterval(checkVersion, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!showUpdateNotice) return null;

  return (
    <div className="version-checker-notice">
      <span className="version-checker-text">
        New version available :
        {newVersion && (
          <span style={{ color: "#43a047", fontWeight: 700, marginLeft: 8 }}>
            {newVersion}
          </span>
        )}
      </span>
      <button
        className="version-checker-reload"
        onClick={() => window.location.reload()}
      >
        <ReloadOutlined style={{ marginRight: 6 }} />
        Reload
      </button>
    </div>
  );
};

export default VersionChecker;
