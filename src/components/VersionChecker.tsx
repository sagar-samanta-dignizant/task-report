import { useEffect, useRef, useState } from "react";
import { ReloadOutlined, RocketOutlined } from "@ant-design/icons";
import "./VersionChecker.css";

const POLL_MS = 5 * 60 * 1000; // 5 minutes
const SEEN_KEY = "app:seen-version";

// Heuristic: the user has used the app before if any of these keys exist in
// localStorage. Used to decide whether to show the "updated" welcome banner.
const RETURNING_USER_MARKERS = [
  "taskSettings",
  "previewSettings",
  "reports",
  "reports:index",
  "name",
];

const hasPriorAppData = (): boolean => {
  try {
    return RETURNING_USER_MARKERS.some((k) => localStorage.getItem(k) !== null);
  } catch {
    return false;
  }
};

const VersionChecker = () => {
  // "update" = a newer version was detected while the user was already running
  //   the app (offers Reload).
  // "updated" = the user has just loaded a newer version than the one they
  //   last saw (one-time welcome banner).
  const [mode, setMode] = useState<"hidden" | "update" | "updated">("hidden");
  const [bannerVersion, setBannerVersion] = useState<string | null>(null);
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
          // First successful fetch this session — compare against the last
          // version we persisted locally. If it's different and the user has
          // prior app data, show the one-time "updated" welcome.
          currentVersionRef.current = data.version;
          try {
            const seen = localStorage.getItem(SEEN_KEY);
            if (seen && seen !== data.version && hasPriorAppData()) {
              setMode("updated");
              setBannerVersion(data.version);
            }
            localStorage.setItem(SEEN_KEY, data.version);
          } catch {
            // ignore storage failures — not critical
          }
        } else if (data.version !== currentVersionRef.current) {
          // Live poll: a newer version is available mid-session.
          setMode("update");
          setBannerVersion(data.version);
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

  if (mode === "hidden") return null;

  if (mode === "updated") {
    return (
      <div className="version-checker-notice version-checker-notice-updated">
        <RocketOutlined className="version-checker-icon-accent" />
        <span className="version-checker-text">
          You&apos;re now on
          {bannerVersion && (
            <span className="version-checker-version">{bannerVersion}</span>
          )}
          <span className="version-checker-muted">
            {" · "}
            New UI, templates, quick-add, and more
          </span>
        </span>
        <button
          className="version-checker-reload"
          onClick={() => setMode("hidden")}
        >
          Got it
        </button>
      </div>
    );
  }

  return (
    <div className="version-checker-notice">
      <span className="version-checker-text">
        New version available
        {bannerVersion && (
          <span className="version-checker-version">{bannerVersion}</span>
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
