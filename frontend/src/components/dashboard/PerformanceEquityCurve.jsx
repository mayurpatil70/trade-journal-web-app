import { useState, useMemo, useRef, useEffect } from "react";
import { Activity } from "lucide-react";
import { normalizeTradeR } from "../../pages/Dashboard.jsx";

const TIMEFRAMES = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "ALL" },
];

export default function PerformanceEquityCurve({ trades = [] }) {
  const [timeframe, setTimeframe] = useState("1M");
  const [hoverData, setHoverData] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Dynamically measure container width with ResizeObserver to ensure full-width stretch
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

  // Filter trades based on selected timeframe
  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    const now = new Date();
    const sorted = [...trades].sort(
      (a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at)
    );

    if (timeframe === "ALL") return sorted;

    let cutoff = new Date();
    if (timeframe === "1D") {
      cutoff.setDate(now.getDate() - 1);
    } else if (timeframe === "1W") {
      cutoff.setDate(now.getDate() - 7);
    } else if (timeframe === "1M") {
      cutoff.setMonth(now.getMonth() - 1);
    } else if (timeframe === "1Y") {
      cutoff.setFullYear(now.getFullYear() - 1);
    }

    return sorted.filter((t) => {
      const tradeDate = new Date(t.date || t.created_at);
      return tradeDate >= cutoff;
    });
  }, [trades, timeframe]);

  // Compute cumulative equity data points
  const equityPoints = useMemo(() => {
    let cumulativeR = 0;
    let cumulativePnl = 0;
    let hasPnl = false;

    // Start point
    const points = [
      {
        r: 0,
        pnl: 0,
        date: "Start",
        fullDateStr: new Date().toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        trade: null,
      },
    ];

    filteredTrades.forEach((t) => {
      const r = normalizeTradeR(t);
      cumulativeR += r;
      if (t.pnl !== null && t.pnl !== undefined) {
        cumulativePnl += Number(t.pnl);
        hasPnl = true;
      }

      const d = t.date ? new Date(t.date) : new Date();
      points.push({
        r: cumulativeR,
        pnl: cumulativePnl,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDateStr: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        trade: t,
      });
    });

    return { points, hasPnl, finalR: cumulativeR, finalPnl: cumulativePnl };
  }, [filteredTrades]);

  // Headline value
  const isProfitable = (equityPoints.hasPnl ? equityPoints.finalPnl : equityPoints.finalR) >= 0;
  const strokeColor = isProfitable ? "#10b981" : "#ef4444"; // Emerald green or rose red

  const headlineDisplay = useMemo(() => {
    if (filteredTrades.length === 0) return "+$0.00";
    if (equityPoints.hasPnl) {
      return `${equityPoints.finalPnl >= 0 ? "+" : ""}$${Math.abs(equityPoints.finalPnl).toFixed(2)}`;
    }
    return `${equityPoints.finalR >= 0 ? "+" : ""}${equityPoints.finalR.toFixed(2)}R`;
  }, [filteredTrades, equityPoints]);

  // SVG dimensions: full width edge-to-edge, minimal side padding
  const minWidthPerPoint = 48;
  const dynamicPointsWidth = equityPoints.points.length * minWidthPerPoint;
  const chartWidth = Math.max(containerWidth, dynamicPointsWidth);
  const chartHeight = 310;
  const paddingX = 12; // minimal side padding: stretches curve across full width
  const paddingY = 28;

  const dataValues = equityPoints.points.map((p) => (equityPoints.hasPnl ? p.pnl : p.r));
  const minVal = Math.min(0, ...dataValues);
  const maxVal = Math.max(1, ...dataValues);
  const range = maxVal - minVal || 1;

  const svgPoints = equityPoints.points.map((p, idx) => {
    const val = equityPoints.hasPnl ? p.pnl : p.r;
    const x =
      equityPoints.points.length <= 1
        ? chartWidth / 2
        : paddingX + (idx / (equityPoints.points.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - paddingY * 2);
    return { x, y, point: p };
  });

  const polylinePoints = svgPoints.map((pt) => `${pt.x},${pt.y}`).join(" ");

  // Date labels along the bottom
  const dateInterval = Math.max(1, Math.floor(svgPoints.length / 8));
  const bottomDateLabels = svgPoints.filter(
    (_, i) => i % dateInterval === 0 || i === svgPoints.length - 1
  );

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-[#121622] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between h-full relative overflow-hidden">
      {/* ── CARD HEADER ── */}
      <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Performance</span>
          </div>
          <h2
            className={`text-3xl font-extrabold mt-1 tracking-tight font-mono ${
              isProfitable ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {headlineDisplay}
          </h2>
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

      {/* ── CHART CONTAINER (Full width, plane background without grid lines) ── */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 flex flex-col justify-between overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 pt-1"
      >
        {filteredTrades.length === 0 ? (
          <div className="w-full h-[280px] rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-white/[0.01]">
            <p className="text-sm font-medium">No trades taken</p>
          </div>
        ) : (
          <div
            className="relative select-none"
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
              className="overflow-visible block"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                let nearest = svgPoints[0];
                let minDistance = Infinity;
                svgPoints.forEach((pt) => {
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

              {/* Pure Plane Canvas: NO dashed horizontal grid lines or vertical grid lines */}

              {/* Area under curve */}
              {svgPoints.length > 0 && (
                <polygon
                  fill="url(#curveGradient)"
                  points={`${svgPoints[0].x},${chartHeight - paddingY} ${polylinePoints} ${svgPoints[svgPoints.length - 1].x},${chartHeight - paddingY}`}
                />
              )}

              {/* Equity Curve Line (Stretches full width) */}
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Data Points */}
              {svgPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverData === pt ? 5.5 : 2.5}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth={hoverData === pt ? "2.5" : "1"}
                  className="transition-all"
                />
              ))}

              {/* Hover guideline */}
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

            {/* ── DATES AT DOWN (Spanning full width edge-to-edge) ── */}
            <div className="absolute bottom-1 left-0 right-0 pointer-events-none text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {bottomDateLabels.map((lbl, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === bottomDateLabels.length - 1;
                const transform = isFirst
                  ? "translateX(0%)"
                  : isLast
                  ? "translateX(-100%)"
                  : "translateX(-50%)";

                return (
                  <span
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${lbl.x}px`,
                      transform,
                    }}
                    className="whitespace-nowrap select-none"
                  >
                    {lbl.point.date}
                  </span>
                );
              })}
            </div>

            {/* ── HOVER TOOLTIP CARD ── */}
            {hoverData && (
              <div
                className="absolute pointer-events-none z-30 rounded-2xl bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] p-3.5 shadow-2xl backdrop-blur-xl transition-all"
                style={{
                  left: `${Math.min(Math.max(hoverData.x, 80), chartWidth - 110)}px`,
                  top: `${Math.max(10, hoverData.y - 120)}px`,
                  transform: "translateX(-50%)",
                  minWidth: "160px",
                }}
              >
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                  {hoverData.point.fullDateStr}
                </p>
                <p
                  className={`text-xl font-bold font-mono mt-0.5 ${
                    hoverData.point.r >= 0
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-rose-500 dark:text-rose-400"
                  }`}
                >
                  {hoverData.point.r >= 0 ? "+" : ""}
                  {hoverData.point.r.toFixed(2)}R
                </p>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Cumulative P&L
                </p>

                {hoverData.point.trade && (
                  <div className="mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {hoverData.point.trade.asset}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                          hoverData.point.trade.direction === "LONG"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                        }`}
                      >
                        {hoverData.point.trade.direction}
                      </span>
                    </div>
                    {hoverData.point.trade.setup && (
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        {hoverData.point.trade.setup}
                      </p>
                    )}
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
