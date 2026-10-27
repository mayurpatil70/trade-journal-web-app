import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export default function ThemeToggle({ className = "", onDark = false }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const dark = isDark ?? theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to Light Mode (macOS Glass)" : "Switch to Dark Mode (macOS Obsidian)"}
      className={`group relative h-9 w-9 shrink-0 rounded-xl border backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center overflow-hidden ${
        onDark
          ? "border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
          : dark
          ? "border-white/[0.12] bg-[#161a24]/80 text-amber-300/90 hover:text-amber-200 hover:bg-[#1f2433] shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]"
          : "border-black/[0.08] bg-white/80 text-amber-500 hover:text-amber-600 hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.95)] hover:shadow-[0_0_18px_rgba(245,158,11,0.2)]"
      } ${className}`}
    >
      {/* Specular highlight rim */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 dark:via-white/30 to-transparent" />

      {/* Sun Icon */}
      <Sun
        className={`absolute inset-0 m-auto h-[18px] w-[18px] transition-all duration-300 transform ${
          dark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
        }`}
        strokeWidth={2.2}
      />

      {/* Moon Icon */}
      <Moon
        className={`absolute inset-0 m-auto h-[18px] w-[18px] transition-all duration-300 transform ${
          dark ? "scale-100 rotate-0 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "scale-0 rotate-90 opacity-0"
        }`}
        strokeWidth={2.2}
      />
    </button>
  );
}
