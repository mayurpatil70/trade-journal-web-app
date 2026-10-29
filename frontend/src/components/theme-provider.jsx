import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";

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
    if (!root.classList.contains(theme)) {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
    root.style.colorScheme = theme;

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#0A0C10" : "#F5F6F9");
    }
  }, [theme]);

  const value = useMemo(() => {
    const applyThemeChange = (next, event = null) => {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* storage blocked */
      }

      if (typeof document === "undefined") {
        setThemeState(next);
        return;
      }

      const root = document.documentElement;

      // Check if View Transition API is supported and user doesn't prefer reduced motion
      const isReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || isReducedMotion) {
        root.classList.remove("light", "dark");
        root.classList.add(next);
        root.style.colorScheme = next;
        setThemeState(next);
        return;
      }

      // Circular motion wave origin coordinates
      let x = window.innerWidth / 2;
      let y = 0;

      if (event) {
        const target =
          event.currentTarget ||
          (event.target && event.target.closest ? event.target.closest("button") : null);

        if (target && typeof target.getBoundingClientRect === "function") {
          const rect = target.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        } else if (
          typeof event.clientX === "number" &&
          typeof event.clientY === "number" &&
          (event.clientX !== 0 || event.clientY !== 0)
        ) {
          x = event.clientX;
          y = event.clientY;
        }
      }

      // Calculate maximum distance to the furthest screen corner
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Execute synchronous DOM commit via flushSync to guarantee zero React re-render jank during the animation
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          root.classList.remove("light", "dark");
          root.classList.add(next);
          root.style.colorScheme = next;
          setThemeState(next);
        });
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 400,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {});
    };

    return {
      theme,
      isDark: theme === "dark",
      setTheme: (next, event = null) => applyThemeChange(next, event),
      toggleTheme: (event = null) => applyThemeChange(theme === "dark" ? "light" : "dark", event),
    };
  }, [theme]);

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeProviderContext);
