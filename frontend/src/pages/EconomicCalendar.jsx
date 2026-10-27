// frontend/src/pages/EconomicCalendar.jsx
import { useEffect, useRef } from "react";
import { Globe, ExternalLink, CalendarDays, ShieldAlert } from "lucide-react";
import { useTheme } from "../components/theme-provider";

export default function EconomicCalendar() {
  const container = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget before injecting new theme script
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: isDark ? "dark" : "light",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      currencyFilter: "USD,EUR,GBP,JPY,AUD,CAD,CHF,NZD,CNY",
    });

    container.current.appendChild(script);
  }, [isDark]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/10">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-medium text-neutral-800 dark:text-neutral-100">
              Economic Calendar
            </h1>
            <p className="text-xs md:text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live macroeconomic events, forecasts, and market impact data.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.open("https://www.forexfactory.com/calendar", "_blank")}
          className="self-start sm:self-auto px-5 py-2.5 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/75 dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 text-xs font-semibold backdrop-blur-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <span>Forex Factory</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* ── TradingView Calendar Widget Container ── */}
      <div className="w-full h-[640px] md:h-[700px] bg-white/70 dark:bg-[#10131b]/70 border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl overflow-hidden relative p-2 md:p-3 transition-colors duration-300">
        <div className="absolute inset-2 md:inset-3" ref={container} />
      </div>

      {/* ── Risk Management Rule Footer ── */}
      <div className="p-5 rounded-3xl bg-white/70 dark:bg-[#10131b]/70 border border-black/[0.08] dark:border-white/[0.12] shadow-sm backdrop-blur-2xl flex items-start gap-3.5 transition-colors duration-300">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
            News Execution Rule
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
            Avoid taking new technical setups 15 minutes before and after high-impact (red folder) news releases due to unpredictable spread widening and slippage.
          </p>
        </div>
      </div>
    </div>
  );
}
