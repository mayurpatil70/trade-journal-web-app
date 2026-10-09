import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export default function ThemeToggle({ className = "", onDark = false }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`relative h-9 w-9 shrink-0 rounded-xl border backdrop-blur-md transition-colors ${onDark ? "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10" : "border-border bg-card text-foreground/70 hover:text-foreground hover:bg-accent"} ${className}`}
    >
      <Sun className={`absolute inset-0 m-auto h-[18px] w-[18px] transition-all duration-300 ${dark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} />
      <Moon className={`absolute inset-0 m-auto h-[18px] w-[18px] transition-all duration-300 ${dark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`} />
    </button>
  );
}
