import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "app:theme";
const ACCENT_KEY = "app:accent";

// Named accent palettes the user can pick from.
export interface AccentPalette {
  name: string;
  color: string; // main accent (--accent)
  gradient: string; // full gradient (--gradient-accent)
  soft: string; // --accent-soft
}

export const ACCENT_PRESETS: AccentPalette[] = [
  {
    name: "Violet",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #ec4899 100%)",
    soft: "rgba(139, 92, 246, 0.18)",
  },
  {
    name: "Blue",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
    soft: "rgba(59, 130, 246, 0.18)",
  },
  {
    name: "Teal",
    color: "#14b8a6",
    gradient: "linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #06b6d4 100%)",
    soft: "rgba(20, 184, 166, 0.18)",
  },
  {
    name: "Green",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #84cc16 0%, #22c55e 50%, #14b8a6 100%)",
    soft: "rgba(34, 197, 94, 0.18)",
  },
  {
    name: "Amber",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #fbbf24 100%)",
    soft: "rgba(245, 158, 11, 0.2)",
  },
  {
    name: "Rose",
    color: "#f43f5e",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #fb7185 100%)",
    soft: "rgba(244, 63, 94, 0.18)",
  },
  {
    name: "Slate",
    color: "#64748b",
    gradient: "linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)",
    soft: "rgba(100, 116, 139, 0.2)",
  },
];

const DEFAULT_ACCENT = ACCENT_PRESETS[0];

// Parse a hex like "#rrggbb" into rgb parts.
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

// Build a palette from a user-chosen color. The gradient is a single-color
// variant (same hue with darkened start + lightened end) so it stays cohesive.
export const buildCustomPalette = (hex: string): AccentPalette => {
  const rgb = hexToRgb(hex) || { r: 139, g: 92, b: 246 };
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const shade = (factor: number) =>
    `#${[rgb.r, rgb.g, rgb.b]
      .map((c) => clamp(c * factor).toString(16).padStart(2, "0"))
      .join("")}`;
  const start = shade(0.72);
  const mid = hex.startsWith("#") ? hex : `#${hex}`;
  const end = shade(1.22);
  return {
    name: "Custom",
    color: mid,
    gradient: `linear-gradient(135deg, ${start} 0%, ${mid} 50%, ${end} 100%)`,
    soft: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
  };
};

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return "dark";
};

const getInitialAccent = (): AccentPalette => {
  try {
    const raw = localStorage.getItem(ACCENT_KEY);
    if (!raw) return DEFAULT_ACCENT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.color) {
      return parsed as AccentPalette;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACCENT;
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  accent: AccentPalette;
  setAccent: (p: AccentPalette) => void;
  resetAccent: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [accent, setAccentState] = useState<AccentPalette>(getInitialAccent);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accent.color);
    root.style.setProperty("--accent-2", accent.color);
    root.style.setProperty("--gradient-accent", accent.gradient);
    root.style.setProperty("--accent-soft", accent.soft);
    try {
      localStorage.setItem(ACCENT_KEY, JSON.stringify(accent));
    } catch {
      // ignore
    }
  }, [accent]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    []
  );
  const setAccent = useCallback((p: AccentPalette) => setAccentState(p), []);
  const resetAccent = useCallback(() => setAccentState(DEFAULT_ACCENT), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle, accent, setAccent, resetAccent }),
    [theme, setTheme, toggle, accent, setAccent, resetAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
