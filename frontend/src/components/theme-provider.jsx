import { createContext, useContext, useEffect, useMemo, useState } from "react"

export const THEME_KEY = "vite-ui-theme"

const readTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

const ThemeProviderContext = createContext({ theme: "light", setTheme: () => null, toggleTheme: () => null })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    root.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0C0E12" : "#FBFBFB")
  }, [theme])

  const value = useMemo(() => {
    const setTheme = (next) => {
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch { /* storage blocked */ }
      setThemeState(next)
    }
    return { theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") }
  }, [theme])

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeProviderContext)
