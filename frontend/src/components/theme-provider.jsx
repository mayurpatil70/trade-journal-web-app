import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const THEME_KEY = "vite-ui-theme";

const readInitialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  } catch {
    return "light";
  }
};

const ThemeProviderContext = createContext({
  theme: "light",
  isDark: false,
  setTheme: () => null,
  toggleTheme: () => null,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    // Enable temporary smooth transition class for buttery cross-fade
    root.classList.add("theme-transitioning");

    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#0A0C10" : "#F5F6F9");
    }

    const timer = setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 350);

    return () => clearTimeout(timer);
  }, [theme]);

  const value = useMemo(() => {
    const setTheme = (next) => {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage blocked */
      }
      setThemeState(next);
    };

    return {
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    };
  }, [theme]);

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeProviderContext);
