import { useEffect, useRef } from "react";

type HotkeyMatcher = (e: KeyboardEvent) => boolean;
type Binding = { match: HotkeyMatcher; handler: (e: KeyboardEvent) => void };

const parse = (combo: string): HotkeyMatcher => {
  const parts = combo.toLowerCase().split("+").map((s) => s.trim());
  const needCtrl = parts.includes("ctrl") || parts.includes("mod");
  const needShift = parts.includes("shift");
  const needAlt = parts.includes("alt");
  const key = parts.filter((p) => !["ctrl", "shift", "alt", "mod", "meta"].includes(p))[0];
  return (e: KeyboardEvent) => {
    if (!!e.ctrlKey !== needCtrl && !!e.metaKey !== needCtrl) return false;
    if (!!e.shiftKey !== needShift) return false;
    if (!!e.altKey !== needAlt) return false;
    return e.key.toLowerCase() === key || e.code.toLowerCase() === key;
  };
};

export const useHotkey = (
  combo: string,
  handler: (e: KeyboardEvent) => void,
  enabled = true
) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const match = parse(combo);
    const onKeyDown = (e: KeyboardEvent) => {
      if (match(e)) {
        e.preventDefault();
        handlerRef.current(e);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled]);
};

export const useHotkeys = (bindings: Array<{ combo: string; handler: (e: KeyboardEvent) => void }>, enabled = true) => {
  const handlersRef = useRef<Binding[]>([]);
  handlersRef.current = bindings.map((b) => ({ match: parse(b.combo), handler: b.handler }));

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      for (const { match, handler } of handlersRef.current) {
        if (match(e)) {
          e.preventDefault();
          handler(e);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
};
