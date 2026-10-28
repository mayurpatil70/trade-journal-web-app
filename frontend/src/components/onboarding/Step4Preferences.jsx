import { DollarSign, Clock, Check } from "lucide-react";
import MarketClock from "./MarketClock";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen (¥)" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar (A$)" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar (C$)" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc (CHF)" },
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "AED", symbol: "AED", label: "UAE Dirham (AED)" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (S$)" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT — New York Close)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST — London Open)" },
  { value: "Europe/Frankfurt", label: "Europe/Frankfurt (CET/CEST — Frankfurt)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST — Dubai)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST — Mumbai / New Delhi)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT — Singapore)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST — Tokyo)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT — Sydney)" },
];

export default function Step4Preferences({
  currency,
  setCurrency,
  timezone,
  setTimezone,
}) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4 lg:py-8">
      {/* ── LEFT COLUMN: Luxury Swiss / macOS Market Clock ── */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <MarketClock timezone={timezone} />
      </div>

      {/* ── RIGHT COLUMN: Preferences Calibration Form ── */}
      <div className="lg:col-span-7 space-y-6 max-w-xl animate-in fade-in duration-300">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 mb-3">
            <span className="w-4 h-[2px] bg-emerald-400 rounded-full" />
            <span>Step 04 • Preferences</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Calibrate the dashboard.
          </h2>

          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
            Pick your home currency and timezone — every chart, log entry, and economic event will adopt them across the app.
          </p>
        </div>

        {/* 1. Display Currency Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Display currency</span>
          </label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl border border-white/[0.08] bg-[#0c1017] text-white text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none shadow-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#121622] text-white">
                  {c.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs font-bold">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            P&L, balances, and statistics will display in this currency.
          </p>
        </div>

        {/* 2. Timezone Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Timezone</span>
          </label>
          <div className="relative">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl border border-white/[0.08] bg-[#0c1017] text-white text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer appearance-none shadow-sm"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-[#121622] text-white">
                  {tz.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs font-bold">
              ▼
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            Trade timestamps and the economic calendar are anchored to this zone.
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
            Setup Summary
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-neutral-400">Currency: <span className="font-bold text-white">{currency}</span></div>
            <div className="text-neutral-400">Timezone: <span className="font-bold text-white">{timezone}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
