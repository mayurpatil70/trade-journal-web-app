// frontend/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Database,
  RefreshCw,
  FileText,
} from "lucide-react";

export default function Settings() {
  const [themeMode, setThemeMode] = useState("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeMode(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = (mode) => {
    setThemeMode(mode);
    if (mode === "dark" || mode === "midnight" || mode === "oled") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const themeOptionClass = (mode) =>
    `w-full p-4 rounded-[2px] border cursor-pointer text-left transition-all mb-3 ${themeMode === mode ? "border-[#2f8df4] bg-[#2f8df4]/5" : "border-gray-200 dark:border-[#1f2c3b] bg-gray-50 dark:bg-[#0b131d] hover:border-gray-300 dark:hover:border-white/20"}`;

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Trading Journal
          </p>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            Settings
          </h1>
        </div>
        <div className="flex gap-3 hidden sm:flex">
          <button className="px-4 py-2 text-sm font-bold bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 rounded-[2px]">
            + Quick Add
          </button>
          <button className="px-4 py-2 text-sm font-bold bg-[#2f8df4] text-white rounded-[2px]">
            + Add Trade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          {/* Appearance Panel */}
          <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Appearance
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Choose how Trade Journey looks. Your preference is saved locally.
            </p>

            <button
              onClick={() => toggleTheme("midnight")}
              className={themeOptionClass("midnight")}
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Midnight
              </h3>
              <p className="text-xs text-gray-500">
                Deep blue-black trading terminal
              </p>
            </button>
            <button
              onClick={() => toggleTheme("dark")}
              className={themeOptionClass("dark")}
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Dark
              </h3>
              <p className="text-xs text-gray-500">Classic dark workspace</p>
            </button>
            <button
              onClick={() => toggleTheme("light")}
              className={themeOptionClass("light")}
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Light
              </h3>
              <p className="text-xs text-gray-500">Clean light workspace</p>
            </button>
            <button
              onClick={() => toggleTheme("oled")}
              className={themeOptionClass("oled")}
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                OLED
              </h3>
              <p className="text-xs text-gray-500">
                Pure black, high-contrast mode
              </p>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6">
            <h2 className="text-lg font-bold text-red-500 mb-1">Danger Zone</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Delete all local trades after making a backup.
            </p>
            <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold rounded-[2px] text-sm transition-colors">
              Delete All Trades
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          {/* Private Storage */}
          <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Private Storage
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Trade Journey stores your journal in this browser using local
              storage. No account or server is required for this version.
            </p>
            <div className="flex flex-col xl:flex-row gap-3">
              <button className="flex-1 px-4 py-3 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-[2px] text-xs flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Backup
              </button>
              <button className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10">
                <Upload className="w-4 h-4" /> Import Backup
              </button>
            </div>
          </div>
        </div>

        {/* FULL WIDTH BOTTOM COLUMN */}
        <div className="lg:col-span-12">
          {/* Backup & Export */}
          <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#2f8df4]" /> Backup & Export
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Automatic local backup runs every 30 seconds. You can also create
              or restore a full backup.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <button className="px-5 py-2.5 bg-[#2f8df4]/10 text-[#2f8df4] border border-[#2f8df4]/20 font-bold rounded-[2px] text-xs flex items-center gap-2 hover:bg-[#2f8df4]/20">
                <Database className="w-4 h-4" /> Full Backup
              </button>
              <button className="px-5 py-2.5 bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10">
                <Upload className="w-4 h-4" /> Restore Backup
              </button>
              <button className="px-5 py-2.5 bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10">
                <RefreshCw className="w-4 h-4" /> Restore Auto Backup
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="px-5 py-2.5 bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10">
                <FileText className="w-4 h-4" /> Export CSV
              </button>
              <button className="px-5 py-2.5 bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white border border-gray-200 dark:border-white/5 font-bold rounded-[2px] text-xs flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10">
                <FileText className="w-4 h-4" /> Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
