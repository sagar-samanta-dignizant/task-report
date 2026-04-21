import { useCallback, useEffect, useRef, useState } from "react";
import "./ResizableSplit.css";

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  storageKey?: string;
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

export const ResizableSplit = ({
  left,
  right,
  storageKey,
  defaultRatio = 0.62,
  minRatio = 0.35,
  maxRatio = 0.8,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [ratio, setRatio] = useState<number>(() => {
    if (!storageKey) return defaultRatio;
    try {
      const raw = localStorage.getItem(storageKey);
      const v = raw ? parseFloat(raw) : NaN;
      if (Number.isFinite(v) && v >= minRatio && v <= maxRatio) return v;
    } catch {
      // ignore
    }
    return defaultRatio;
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, String(ratio));
    } catch {
      // ignore
    }
  }, [ratio, storageKey]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = (e.clientX - rect.left) / rect.width;
      setRatio(Math.max(minRatio, Math.min(maxRatio, next)));
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [minRatio, maxRatio]);

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const resetRatio = useCallback(() => setRatio(defaultRatio), [defaultRatio]);

  return (
    <div
      ref={containerRef}
      className={`resizable-split ${dragging ? "is-dragging" : ""}`}
      style={{ gridTemplateColumns: `${ratio * 100}% 18px 1fr` }}
    >
      <div className="resizable-pane">{left}</div>
      <div
        className="resizable-divider"
        onPointerDown={startDrag}
        onDoubleClick={resetRatio}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        title="Drag to resize · double-click to reset"
        tabIndex={0}
      >
        <span className="resizable-divider-bar" />
      </div>
      <div className="resizable-pane">{right}</div>
    </div>
  );
};

export default ResizableSplit;
