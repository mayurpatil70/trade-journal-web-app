import { useState, useMemo, useRef, useEffect } from "react";
import { Activity, Layers, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { normalizeTradeR } from "../../pages/Dashboard.jsx";

const TIMEFRAMES = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "ALL" },
];

/**
 * Accurately parses a trade's date and time into a millisecond timestamp
 */
export function getTradeTimestamp(trade) {
  if (!trade) return 0;
  const dateStr = trade.date || (trade.created_at ? trade.created_at.slice(0, 10) : "");
  let timeStr = trade.entry_time || trade.time || "";

  if (dateStr) {
    if (timeStr) {
      if (timeStr.length === 5) timeStr += ":00";
      const combined = `${dateStr}T${timeStr}`;
      const d = new Date(combined);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    // If no time string, parse date safely at 12:00 local to prevent day shifts
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }

  if (trade.created_at) {
    const d = new Date(trade.created_at);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  return 0;
}

/**
 * Format trade date for display on ticks and tooltips
 */
export function formatTradeDate(trade, includeTime = false) {
  if (!trade) return "";
  const ts = getTradeTimestamp(trade);
  if (!ts) return trade.date || "";
  const d = new Date(ts);
  if (includeTime && (trade.time || trade.entry_time)) {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PerformanceEquityCurve({ trades = [] }) {
  const [timeframe, setTimeframe] = useState("1M");
  const [viewMode, setViewMode] = useState("trades"); // "trades" (By Trade sequence) | "timeline" (Calendar Timeline)
  const [hoverData, setHoverData] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Dynamically measure container width with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    window.addEventListener("resize", updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Sort trades strictly chronologically (oldest to newest)
  // Ensures points never jump backwards in time or create self-intersecting loops
  const sortedTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    return [...trades].sort((a, b) => {
      const tA = getTradeTimestamp(a);
      const tB = getTradeTimestamp(b);
      if (tA !== tB) return tA - tB;
      const cA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const cB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (cA !== cB) return cA - cB;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }, [trades]);

  // Compute precise timeline bounds based on selected timeframe
  const { startTime, endTime } = useMemo(() => {
    const end = new Date();
    let start = new Date();

    if (timeframe === "1D") {
      start.setDate(end.getDate() - 1);
    } else if (timeframe === "1W") {
      start.setDate(end.getDate() - 7);
    } else if (timeframe === "1M") {
      start.setMonth(end.getMonth() - 1);
    } else if (timeframe === "1Y") {
      start.setFullYear(end.getFullYear() - 1);
    } else if (timeframe === "ALL") {
      if (sortedTrades.length > 0) {
        const earliest = getTradeTimestamp(sortedTrades[0]);
        start = new Date(earliest || end.getTime() - 365 * 24 * 3600 * 1000);
        start.setHours(0, 0, 0, 0);
      } else {
        start.setFullYear(end.getFullYear() - 1);
      }
    }

    return {
      startTime: start.getTime(),
      endTime: end.getTime(),
    };
  }, [timeframe, sortedTrades]);

  // Filter trades based on selected timeframe
  const filteredTrades = useMemo(() => {
    if (sortedTrades.length === 0) return [];
    if (timeframe === "ALL") return sortedTrades;

    return sortedTrades.filter((t) => {
      const tTime = getTradeTimestamp(t);
      return tTime >= startTime && tTime <= endTime + 24 * 60 * 60 * 1000;
    });
  }, [sortedTrades, timeframe, startTime, endTime]);

  // Cumulative equity calculation across filtered trades
  const equityData = useMemo(() => {
    let cumR = 0;
    let cumPnl = 0;
    let hasPnl = false;

    // Start baseline at 0
    const points = [
      {
        r: 0,
        pnl: 0,
        tradeR: 0,
        tradePnl: 0,
        tradeIndex: 0,
        timestamp: startTime,
        dateLabel: "Start",
        fullDateStr: new Date(startTime).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        trade: null,
      },
    ];

    filteredTrades.forEach((t, i) => {
      const r = normalizeTradeR(t);
      cumR += r;
      if (t.pnl !== null && t.pnl !== undefined && !isNaN(Number(t.pnl))) {
        cumPnl += Number(t.pnl);
        hasPnl = true;
      }

      const ts = getTradeTimestamp(t);
      const d = new Date(ts);
      const dateLabel = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : `T${i + 1}`;

      points.push({
        r: cumR,
        pnl: cumPnl,
        tradeR: r,
        tradePnl: t.pnl ? Number(t.pnl) : null,
        tradeIndex: i + 1,
        timestamp: ts,
        dateLabel,
        fullDateStr: formatTradeDate(t, true),
        trade: t,
      });
    });

    return {
      points,
      finalR: cumR,
      finalPnl: cumPnl,
      hasPnl,
    };
  }, [filteredTrades, startTime]);

  // SVG dimensions
  const chartWidth = Math.max(containerWidth, 600);
  const chartHeight = 310;
  const paddingX = 18;
  const paddingY = 28;

  // Compute SVG Points & Axis Ticks
  const svgData = useMemo(() => {
    const { points, hasPnl } = equityData;
    if (points.length <= 1) {
      return {
        svgPoints: [],
        polylinePoints: "",
        tradePoints: [],
        ticks: [],
        minVal: 0,
        maxVal: 1,
        range: 1,
        zeroY: chartHeight - paddingY,
      };
    }

    const dataValues = points.map((p) => (hasPnl ? p.pnl : p.r));
    const minVal = Math.min(0, ...dataValues);
    const maxVal = Math.max(1, ...dataValues);
    const range = maxVal - minVal || 1;
    const zeroY = chartHeight - paddingY - ((0 - minVal) / range) * (chartHeight - paddingY * 2);

    let svgPoints = [];
    let ticks = [];

    if (viewMode === "trades") {
      // ──────── MODE 1: BY TRADE SEQUENCE (EQUAL HORIZONTAL SPACING PER TRADE) ────────
      // Classic trading equity curve: every trade has its own distinct step.
      // Wins step UP, losses step DOWN! Zero vertical spikes, zero backwards lines!
      const totalPoints = points.length;
      svgPoints = points.map((p, idx) => {
        const val = hasPnl ? p.pnl : p.r;
        const x = paddingX + (idx / Math.max(1, totalPoints - 1)) * (chartWidth - paddingX * 2);
        const y = chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - paddingY * 2);
        return { x, y, point: p };
      });

      // Sample 5-7 evenly spaced date ticks across the trade progression
      const maxTicks = Math.min(7, totalPoints);
      for (let i = 0; i < maxTicks; i++) {
        const idx = Math.round((i / (maxTicks - 1)) * (totalPoints - 1));
        const pt = svgPoints[idx];
        ticks.push({
          label: pt.point.trade ? pt.point.dateLabel : "Start",
          subLabel: pt.point.trade ? `T${pt.point.tradeIndex}` : "",
          x: pt.x,
          ratio: idx / Math.max(1, totalPoints - 1),
        });
      }
    } else {
      // ──────── MODE 2: TIMELINE (SMART STEPPED EQUITY WITH CALENDAR TICKS) ────────
      // Preserves calendar timeline: flat during non-trading days, stepping on execution
      const timeSpan = Math.max(1000, endTime - startTime);

      let lastX = paddingX;
      const minStepPx = Math.min(24, (chartWidth - paddingX * 2) / Math.max(1, points.length));

      svgPoints = points.map((p, idx) => {
        const val = hasPnl ? p.pnl : p.r;
        let naturalRatio = (p.timestamp - startTime) / timeSpan;
        naturalRatio = Math.max(0, Math.min(1, naturalRatio));
        let x = paddingX + naturalRatio * (chartWidth - paddingX * 2);

        // Ensure strictly forward x progression so same-day trades never stack into a vertical needle
        if (idx > 0) {
          x = Math.max(lastX + minStepPx, x);
        }
        x = Math.min(chartWidth - paddingX, x);
        lastX = x;

        const y = chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - paddingY * 2);
        return { x, y, point: p };
      });

      // Calendar timeline ticks
      const tickCount = timeframe === "1D" ? 6 : 7;
      for (let i = 0; i < tickCount; i++) {
        const ratio = i / (tickCount - 1);
        const tickTime = startTime + ratio * timeSpan;
        const d = new Date(tickTime);
        let label = "";
        if (timeframe === "1D") {
          label = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
        } else if (timeframe === "1W") {
          label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
        } else if (timeframe === "1M") {
          label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } else {
          label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        }
        ticks.push({
          label,
          subLabel: "",
          x: paddingX + ratio * (chartWidth - paddingX * 2),
          ratio,
        });
      }
    }

    const polylinePoints = svgPoints.map((pt) => `${pt.x},${pt.y}`).join(" ");
    const tradePoints = svgPoints.filter((pt) => pt.point.trade);

    return {
      svgPoints,
      polylinePoints,
      tradePoints,
      ticks,
      minVal,
      maxVal,
      range,
      zeroY,
    };
  }, [equityData, viewMode, chartWidth, startTime, endTime, timeframe]);

  // Headline value display
  const isProfitable = (equityData.hasPnl ? equityData.finalPnl : equityData.finalR) >= 0;
  const strokeColor = isProfitable ? "#10b981" : "#ef4444";

  const headlineDisplay = useMemo(() => {
    if (filteredTrades.length === 0) return "+0.00R";
    if (equityData.hasPnl) {
      return `${equityData.finalPnl >= 0 ? "+" : ""}$${Math.abs(equityData.finalPnl).toFixed(2)}`;
    }
    return `${equityData.finalR >= 0 ? "+" : ""}${equityData.finalR.toFixed(2)}R`;
  }, [filteredTrades, equityData]);

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full relative overflow-hidden">
      {/* ── CARD HEADER ── */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Performance</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h2
              className={`text-3xl font-extrabold tracking-tight font-mono ${
                isProfitable ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {headlineDisplay}
            </h2>
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500">
              {filteredTrades.length} {filteredTrades.length === 1 ? "trade" : "trades"}
            </span>
          </div>
        </div>

        {/* Controls: Mode Switcher (By Trade / Timeline) + Timeframe Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setViewMode("trades")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "trades"
                  ? "bg-white dark:bg-[#1c2233] text-emerald-600 dark:text-emerald-400 shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Trade</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-[#1c2233] text-emerald-600 dark:text-emerald-400 shadow-sm border border-black/[0.04] dark:border-white/[0.08]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Timeframe Filter Buttons: 1D, 1W, 1M, 1Y, ALL */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => setTimeframe(tf.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeframe === tf.key
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHART CONTAINER ── */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 flex flex-col justify-between overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 pt-1"
      >
        {filteredTrades.length === 0 ? (
          <div className="w-full h-[280px] rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-white/[0.01]">
            <p className="text-sm font-medium">No trades taken in this timeframe</p>
          </div>
        ) : (
          <div
            className="relative select-none w-full"
            style={{
              width: `${chartWidth}px`,
              minWidth: "100%",
              height: `${chartHeight + 35}px`,
            }}
            onMouseLeave={() => setHoverData(null)}
          >
            <svg
              width={chartWidth}
              height={chartHeight}
              className="overflow-visible block w-full"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                if (svgData.tradePoints.length === 0) return;
                let nearest = svgData.tradePoints[0];
                let minDistance = Infinity;
                svgData.tradePoints.forEach((pt) => {
                  const dist = Math.abs(pt.x - mouseX);
                  if (dist < minDistance) {
                    minDistance = dist;
                    nearest = pt;
                  }
                });
                setHoverData(nearest);
              }}
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
                  <stop offset="65%" stopColor={strokeColor} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Zero baseline (Breakeven reference line if minVal < 0) */}
              {svgData.minVal < 0 && (
                <g>
                  <line
                    x1={paddingX}
                    x2={chartWidth - paddingX}
                    y1={svgData.zeroY}
                    y2={svgData.zeroY}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    className="text-black/10 dark:text-white/10"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX + 4}
                    y={svgData.zeroY - 4}
                    className="text-[9px] fill-neutral-400 font-mono font-bold"
                  >
                    0.00R (BE)
                  </text>
                </g>
              )}

              {/* Area under curve */}
              {svgData.svgPoints.length > 0 && (
                <polygon
                  fill="url(#curveGradient)"
                  points={`${svgData.svgPoints[0].x},${chartHeight - paddingY} ${svgData.polylinePoints} ${
                    svgData.svgPoints[svgData.svgPoints.length - 1].x
                  },${chartHeight - paddingY}`}
                />
              )}

              {/* Equity Curve Polyline (Authentic Up & Down trajectory) */}
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgData.polylinePoints}
              />

              {/* Data Points on completed trades */}
              {svgData.tradePoints.map((pt, idx) => {
                const isSelected = hoverData === pt;
                const isWin = (pt.point.tradeR || 0) >= 0;
                return (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6 : 3}
                    fill={isWin ? "#10b981" : "#ef4444"}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? "2.5" : "1"}
                    className="transition-all cursor-pointer"
                  />
                );
              })}

              {/* Hover crosshair guideline */}
              {hoverData && (
                <line
                  x1={hoverData.x}
                  x2={hoverData.x}
                  y1={paddingY}
                  y2={chartHeight - paddingY}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}
            </svg>

            {/* ── TIMELINE / TRADE DATES AT DOWN ROW ── */}
            <div className="absolute bottom-1 left-0 right-0 pointer-events-none text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {svgData.ticks.map((tick, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === svgData.ticks.length - 1;
                const transform = isFirst
                  ? "translateX(0%)"
                  : isLast
                  ? "translateX(-100%)"
                  : "translateX(-50%)";

                return (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${tick.x}px`,
                      transform,
                    }}
                    className="flex flex-col items-center select-none text-center"
                  >
                    <span className="whitespace-nowrap font-medium text-neutral-500 dark:text-neutral-400">
                      {tick.label}
                    </span>
                    {tick.subLabel && (
                      <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500">
                        {tick.subLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── HOVER TOOLTIP CARD ── */}
            {hoverData && hoverData.point && (
              <div
                className="absolute pointer-events-none z-30 rounded-2xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] p-3.5 shadow-2xl backdrop-blur-xl transition-all"
                style={{
                  left: `${Math.min(Math.max(hoverData.x, 90), chartWidth - 110)}px`,
                  top: `${Math.max(10, hoverData.y - 130)}px`,
                  transform: "translateX(-50%)",
                  minWidth: "170px",
                }}
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pb-1 border-b border-black/[0.05] dark:border-white/[0.06] mb-1.5">
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {hoverData.point.trade ? `Trade #${hoverData.point.tradeIndex}` : "Baseline"}
                  </span>
                  <span className="font-mono text-[10px]">{hoverData.point.dateLabel}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block">
                    Cumulative Equity
                  </span>
                  <p
                    className={`text-2xl font-extrabold font-mono tracking-tight ${
                      hoverData.point.r >= 0
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {hoverData.point.r >= 0 ? "+" : ""}
                    {hoverData.point.r.toFixed(2)}R
                  </p>
                </div>

                {hoverData.point.trade && (
                  <div className="mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-900 dark:text-white">
                        {hoverData.point.trade.asset || "Trade"}
                      </span>
                      <span
                        className={`font-mono text-xs flex items-center gap-0.5 ${
                          (hoverData.point.tradeR || 0) >= 0
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-rose-500 dark:text-rose-400"
                        }`}
                      >
                        {(hoverData.point.tradeR || 0) >= 0 ? (
                          <TrendingUp className="w-3 h-3 inline" />
                        ) : (
                          <TrendingDown className="w-3 h-3 inline" />
                        )}
                        {(hoverData.point.tradeR || 0) >= 0 ? "+" : ""}
                        {(hoverData.point.tradeR || 0).toFixed(2)}R
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="font-semibold">{hoverData.point.trade.direction}</span>
                      <span className="capitalize">{hoverData.point.trade.result || "Closed"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
