// frontend/src/pages/Customize.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Palette, Sun, Moon, Check, Sparkles } from "lucide-react";

export default function Customize() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState("dark");
  const [accentColor, setAccentColor] = useState("#2f8df4");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) navigate("/login");

    // Check initial theme state
    const isDark = document.documentElement.classList.contains("dark");
    setThemeMode(isDark ? "dark" : "light");
  }, [navigate]);

  const toggleTheme = (mode) => {
    setThemeMode(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const colors = [
    { name: "Electric Blue", hex: "#2f8df4" },
    { name: "Emerald Mint", hex: "#21d4a3" },
    { name: "Neon Purple", hex: "#a78bfa" },
    { name: "Sunset Amber", hex: "#ffb84d" },
    { name: "Rose Pink", hex: "#f472b6" },
  ];

  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 md:mb-10 flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#10b981]/10 flex items-center justify-center border border-[#10b981]/20 shrink-0">
          <Palette className="w-5 h-5 md:w-6 md:h-6 text-[#10b981]" />
        </div>
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Customize Theme
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            Personalize your interface appearance, color accents, and dark/light
            modes.
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[2px] text-emerald-500 text-sm font-bold text-center">
          Theme preferences successfully saved!
        </div>
      )}

      <div className="space-y-8">
        {/* Appearance Mode */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
            <Sun className="w-5 h-5 text-[#ffb84d]" /> Interface Theme Mode
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              onClick={() => toggleTheme("light")}
              className={`p-6 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${themeMode === "light" ? "border-[#2f8df4] bg-[#2f8df4]/5 shadow-sm" : "border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0b131d]"}`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Light Mode
                  </h3>
                  <p className="text-xs text-gray-500">
                    Clean white and crisp dark text layout.
                  </p>
                </div>
              </div>
              {themeMode === "light" && (
                <Check className="w-5 h-5 text-[#2f8df4]" />
              )}
            </div>

            <div
              onClick={() => toggleTheme("dark")}
              className={`p-6 rounded-[2px] border cursor-pointer flex items-center justify-between transition-all ${themeMode === "dark" ? "border-[#2f8df4] bg-[#2f8df4]/5 shadow-sm" : "border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0b131d]"}`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-6 h-6 text-[#2f8df4]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Dark Mode
                  </h3>
                  <p className="text-xs text-gray-500">
                    Deep OLED dark environment optimized for night sessions.
                  </p>
                </div>
              </div>
              {themeMode === "dark" && (
                <Check className="w-5 h-5 text-[#2f8df4]" />
              )}
            </div>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
            <Sparkles className="w-5 h-5 text-[#a78bfa]" /> Accent Color Palette
          </h2>

          <div className="flex flex-wrap gap-4">
            {colors.map((c) => (
              <div
                key={c.hex}
                onClick={() => setAccentColor(c.hex)}
                className={`flex items-center gap-3 px-5 py-3 rounded-[2px] border cursor-pointer transition-all ${accentColor === c.hex ? "border-gray-900 dark:border-white shadow-md" : "border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0b131d]"}`}
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: c.hex }}
                ></span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {c.name}
                </span>
                {accentColor === c.hex && (
                  <Check className="w-4 h-4 text-gray-900 dark:text-white ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-10 py-4 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] shadow-lg transition-all text-sm"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
