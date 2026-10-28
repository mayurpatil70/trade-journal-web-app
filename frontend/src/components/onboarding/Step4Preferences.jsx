import { DollarSign, Clock } from "lucide-react";
import MarketClock from "./MarketClock";
import AppleSelect from "../ui/AppleSelect";

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "SGD", label: "Singapore Dollar (S$)" },
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Step 04 • Preferences</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Calibrate the dashboard.
          </h2>

          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
            Pick your home currency and timezone — every chart, log entry, and economic event will adopt them across the app.
          </p>
        </div>

        {/* 1. Display Currency Selector (Apple macOS / iOS Frosted Dropdown) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            <span>Display currency</span>
          </label>
          <AppleSelect
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={CURRENCIES}
            placeholder="Select display currency"
          />
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            P&L, balances, and statistics will display in this currency.
          </p>
        </div>

        {/* 2. Timezone Selector (Apple macOS / iOS Frosted Dropdown) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
            <span>Timezone</span>
          </label>
          <AppleSelect
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={TIMEZONES}
            placeholder="Select timezone"
          />
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Trade timestamps and the economic calendar are anchored to this zone.
          </p>
        </div>

        {/* Setup Summary Card */}
        <div className="p-5 rounded-3xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-sm space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-black block">
            Setup Summary
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium block">Currency</span>
              <span className="font-mono font-black text-neutral-900 dark:text-white text-sm block mt-0.5">{currency}</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.05]">
              <span className="text-neutral-500 dark:text-neutral-400 font-medium block">Timezone</span>
              <span className="font-mono font-black text-neutral-900 dark:text-white text-xs block mt-0.5 truncate">{timezone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
