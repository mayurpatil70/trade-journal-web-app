// frontend/src/pages/EconomicCalendar.jsx
import { useEffect, useRef } from "react";
import { Globe, ExternalLink, CalendarDays } from "lucide-react";

export default function EconomicCalendar() {
  const container = useRef(null);

  useEffect(() => {
    // Prevent multiple script injections during React strict mode renders
    if (container.current && container.current.children.length === 0) {
      const isDark = document.documentElement.classList.contains("dark");

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
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
    }
  }, []);

  return (
    <div
      className="w-full max-w-7xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8 box-border flex flex-col h-[calc(100vh-100px)]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] bg-[#ffb84d]/10 flex items-center justify-center border border-[#ffb84d]/20 shrink-0">
            <Globe className="w-5 h-5 md:w-6 md:h-6 text-[#ffb84d]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
              Economic Calendar
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Live macroeconomic events, forecasts, and market impact data.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            window.open("https://www.forexfactory.com/calendar", "_blank")
          }
          className="px-6 py-3 bg-gray-100 dark:bg-[#1a1d24] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold rounded-[2px] border border-gray-200 dark:border-white/5 transition-all shadow-sm text-sm flex items-center justify-center gap-2"
        >
          Forex Factory <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* TradingView Widget Container */}
      <div className="flex-1 w-full bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 p-4" ref={container}>
          {/* The TradingView script will automatically inject the calendar iframe here */}
        </div>
      </div>

      {/* Pro Tip Footer */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-white/5 rounded-[2px] shrink-0">
        <p className="text-[10px] font-bold text-[#ffb84d] uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" /> News Trading Rule
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Avoid taking new technical setups 15 minutes before and after
          high-impact (red) news releases due to unpredictable spread widening
          and slippage.
        </p>
      </div>
    </div>
  );
}
