// frontend/src/components/dashboard/TradeShareModal.jsx
// Faithful replication of TradeFXBook Share Trade 3-Poster Architecture
// Styled with institutional IB Card aesthetics, transparent FN 3D logo, and responsive layouts
// Generates Story (1080x1920), Post (1080x1080), and Landscape (1920x1080) shareable posters

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Download, Share2, Check, Loader2 } from "lucide-react";

// Aspect configurations defined at module level
const ASPECT_CONFIGS = {
  post: {
    label: "Post",
    dims: "1080×1080",
    width: 1080,
    height: 1080,
    previewClasses: "w-[340px] sm:w-[380px] h-[340px] sm:h-[380px] aspect-square",
  },
  story: {
    label: "Story",
    dims: "1080×1920",
    width: 1080,
    height: 1920,
    previewClasses: "w-[240px] sm:w-[270px] h-[426px] sm:h-[480px] aspect-[9/16]",
  },
  landscape: {
    label: "Landscape",
    dims: "1920×1080",
    width: 1920,
    height: 1080,
    previewClasses: "w-[360px] sm:w-[480px] h-[202px] sm:h-[270px] aspect-[16/9]",
  },
};

export default function TradeShareModal({ isOpen, onClose, trade }) {
  const [aspect, setAspect] = useState("post"); // "post" | "story" | "landscape"
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(true);

  // Fetch logged-in user profile info
  const userInfo = useMemo(() => {
    const uid = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "trader";
    const email = localStorage.getItem("userEmail") || "";
    const name =
      localStorage.getItem("userName") ||
      localStorage.getItem("userDisplayName") ||
      (email ? email.split("@")[0] : "Trader");
    const avatar =
      localStorage.getItem("userAvatar") ||
      localStorage.getItem(`user_avatar_${uid}`) ||
      "";
    return { uid, name, email, avatar };
  }, []);

  // Compute trade metrics
  const tradeMetrics = useMemo(() => {
    if (!trade) return null;
    const direction = (trade.direction || "LONG").toUpperCase();
    const isSell = direction === "SHORT" || direction === "SELL";
    const directionLabel = isSell ? "Sell" : "Buy";

    const symbol = (trade.asset || trade.symbol || "XAUUSD").toUpperCase();
    const rawLots = trade.quantity ?? trade.lot_size ?? trade.lots ?? trade.size ?? trade.volume ?? "0.1";
    const lots = String(rawLots);

    // PnL calculation
    let pnlValue = 0;
    const directPnl = trade.pnl ?? trade.net_pnl ?? trade.profit ?? trade.realized_pnl;
    if (directPnl !== null && directPnl !== undefined && !Number.isNaN(Number(directPnl))) {
      pnlValue = Number(directPnl);
    } else {
      const entry = Number(trade.entry || trade.entry_price || trade.entryPrice || 0);
      const exit = Number(trade.exit || trade.exit_price || trade.exitPrice || 0);
      if (entry > 0 && exit > 0) {
        const diff = isSell ? entry - exit : exit - entry;
        pnlValue = diff * Number(lots || 1) * 100;
      }
    }

    const isProfit = pnlValue >= 0;
    const formattedPnl = `${isProfit ? "+" : "-"}$${Math.abs(pnlValue).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;

    const rawEntry = trade.entry ?? trade.entry_price ?? trade.entryPrice ?? trade.open_price ?? trade.price;
    const rawExit = trade.exit ?? trade.exit_price ?? trade.exitPrice ?? trade.close_price;

    const formatPrice = (val) => {
      if (val === null || val === undefined || val === "" || Number.isNaN(Number(val))) return "—";
      const num = Number(val);
      const isForex = /EUR|GBP|USD|AUD|NZD|CAD|CHF/i.test(symbol) && !/XAU|XAG|BTC|ETH/i.test(symbol);
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: isForex ? 5 : 2,
      });
    };

    const entryPrice = formatPrice(rawEntry);
    const exitPrice = formatPrice(rawExit);

    // R-Multiple / Return
    const rawR = trade.r_multiple ?? trade.rMultiple ?? trade.r;
    let returnLabel = "";
    if (rawR !== null && rawR !== undefined && !Number.isNaN(Number(rawR))) {
      const rNum = Number(rawR);
      returnLabel = `${rNum >= 0 ? "+" : ""}${rNum.toFixed(1)}R`;
    } else if (trade.roi || trade.return_pct) {
      const roi = Number(trade.roi || trade.return_pct);
      returnLabel = `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`;
    }

    // Duration
    const rawDur = trade.duration ?? trade.hold_duration ?? (trade.hold_duration_minutes ? `${Math.floor(trade.hold_duration_minutes / 60)}h ${trade.hold_duration_minutes % 60}m` : null);
    const durationStr = rawDur || (trade.status === "OPEN" ? "Active" : "Closed");

    // Timestamp formatting
    let dateStr = "Today";
    const rawDate = trade.close_date || trade.exit_date || trade.date || trade.entry_date || trade.created_at;
    const rawTime = trade.close_time || trade.exit_time || trade.time || trade.entry_time;
    if (rawDate) {
      dateStr = `${rawDate} ${rawTime || "08:00:00"}`.trim();
    } else {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const y = d.getFullYear();
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      dateStr = `${y}-${m}-${day} ${h}:${min}:00`;
    }

    return {
      direction,
      directionLabel,
      isSell,
      symbol,
      lots,
      pnlValue,
      isProfit,
      formattedPnl,
      entryPrice,
      exitPrice,
      returnLabel,
      durationStr,
      dateStr,
    };
  }, [trade]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const currentCfg = ASPECT_CONFIGS[aspect] || ASPECT_CONFIGS.post;

  // Canvas Exporter
  const renderCardToCanvas = useCallback(async (targetWidth, targetHeight) => {
    if (!tradeMetrics) return null;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    // 1. Dark Institutional Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    bgGrad.addColorStop(0, "#050914");
    bgGrad.addColorStop(0.45, "#0a1329");
    bgGrad.addColorStop(0.75, "#0d1b38");
    bgGrad.addColorStop(1, "#040710");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Subtle Vector Grid Overlay
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    const gridSize = 45;
    for (let x = 0; x < targetWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, targetHeight);
      ctx.stroke();
    }
    for (let y = 0; y < targetHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(targetWidth, y);
      ctx.stroke();
    }

    // 3. Glowing Directional Vector Arrow in Background (Subtle & Polished, No Top-Right Clash)
    ctx.save();
    const arrowGrad = ctx.createLinearGradient(
      targetWidth * 0.35,
      targetHeight * 0.65,
      targetWidth * 0.82,
      targetHeight * 0.25
    );
    if (tradeMetrics.isProfit) {
      arrowGrad.addColorStop(0, "rgba(0, 102, 255, 0.0)");
      arrowGrad.addColorStop(0.5, "rgba(0, 102, 255, 0.06)");
      arrowGrad.addColorStop(1, "rgba(56, 189, 248, 0.14)");
    } else {
      arrowGrad.addColorStop(0, "rgba(244, 63, 94, 0.0)");
      arrowGrad.addColorStop(0.5, "rgba(244, 63, 94, 0.06)");
      arrowGrad.addColorStop(1, "rgba(251, 113, 133, 0.14)");
    }
    ctx.fillStyle = arrowGrad;

    const isUp = tradeMetrics.isProfit;
    const ax = targetWidth * 0.70;
    const ay = isUp ? targetHeight * 0.36 : targetHeight * 0.58;
    const asize = targetWidth * 0.30;

    ctx.translate(ax, ay);
    ctx.rotate(isUp ? -Math.PI / 4 : Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(0, -asize * 0.45);
    ctx.lineTo(asize * 0.38, -asize * 0.45);
    ctx.lineTo(asize * 0.38, -asize * 0.85);
    ctx.lineTo(asize, 0);
    ctx.lineTo(asize * 0.38, asize * 0.85);
    ctx.lineTo(asize * 0.38, asize * 0.45);
    ctx.lineTo(0, asize * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Preload Transparent FN Logo (/brand/fn-logo.png)
    let logoImg = null;
    try {
      logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
        logoImg.src = "/brand/fn-logo.png";
      });
    } catch {
      logoImg = null;
    }

    const baseDim = Math.min(targetWidth, targetHeight);
    const padX = targetWidth * (aspect === "landscape" ? 0.055 : 0.07);
    const topY = targetHeight * (aspect === "story" ? 0.05 : 0.07);
    const logoSize = Math.max(64, Math.round(baseDim * 0.082));

    if (logoImg && logoImg.width > 0) {
      ctx.drawImage(logoImg, padX, topY, logoSize, logoSize);
    }

    const brandTextX = padX + (logoImg && logoImg.width > 0 ? logoSize + 16 : 0);
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.round(baseDim * 0.038)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("ForexNotes", brandTextX, topY + logoSize * 0.46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = `600 ${Math.round(baseDim * 0.016)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Track Trades. Analyze PnL. Master Markets.", brandTextX, topY + logoSize * 0.82);

    // Top-Right Institutional Badge (IB Card style)
    const rightPillX = targetWidth - padX;
    const badgeText = "VERIFIED";
    ctx.font = `800 ${Math.round(baseDim * 0.016)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const badgeWidth = ctx.measureText(badgeText).width + 28;
    const badgeHeight = Math.round(baseDim * 0.036);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.beginPath();
    ctx.roundRect(rightPillX - badgeWidth, topY + 4, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, rightPillX - badgeWidth / 2, topY + 4 + badgeHeight / 2);

    // Reset alignment
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 5. Body Section: Trade Performance
    const bodyY = targetHeight * (aspect === "story" ? 0.27 : aspect === "landscape" ? 0.32 : 0.33);

    // Category Pill / Tag
    ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#fb7185";
    ctx.font = `800 ${Math.round(baseDim * 0.02)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("TRADE PERFORMANCE", padX, bodyY);

    // Subtitle Execution Bar: [Sell / Buy] | [Lots] | [Symbol]
    const subY = bodyY + targetHeight * (aspect === "story" ? 0.035 : 0.048);
    const subFontSize = Math.round(baseDim * 0.026);
    ctx.font = `800 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;

    // Direction Pill
    ctx.fillStyle = tradeMetrics.isSell ? "#f43f5e" : "#10b981";
    ctx.fillText(tradeMetrics.directionLabel, padX, subY);
    const dirW = ctx.measureText(tradeMetrics.directionLabel).width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("  |  ", padX + dirW, subY);
    const sep1W = ctx.measureText("  |  ").width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    const lotsText = `${tradeMetrics.lots} Lots`;
    ctx.fillText(lotsText, padX + dirW + sep1W, subY);
    const lotsW = ctx.measureText(lotsText).width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("  |  ", padX + dirW + sep1W + lotsW, subY);
    const sep2W = ctx.measureText("  |  ").width;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(tradeMetrics.symbol, padX + dirW + sep1W + lotsW + sep2W, subY);

    // Giant Hero P&L Headline
    const heroY = subY + targetHeight * (aspect === "story" ? 0.08 : aspect === "landscape" ? 0.15 : 0.13);
    const heroFontSize = Math.round(baseDim * (aspect === "story" ? 0.086 : aspect === "landscape" ? 0.088 : 0.086));
    ctx.font = `900 ${heroFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#fb7185";

    // Text Shadow for vibrancy
    ctx.shadowColor = tradeMetrics.isProfit ? "rgba(56, 189, 248, 0.45)" : "rgba(251, 113, 133, 0.45)";
    ctx.shadowBlur = 35;
    ctx.fillText(tradeMetrics.formattedPnl, padX, heroY);
    ctx.shadowBlur = 0; // reset

    // 6. Bento Grid Execution Details (Responsive to Post, Story, Landscape)
    if (aspect === "story") {
      const boxHeight = targetHeight * 0.088;
      const bentoY1 = heroY + targetHeight * 0.045;
      const bentoY2 = bentoY1 + boxHeight + 16;
      const boxWidth = (targetWidth - padX * 2 - 18) / 2;
      const box2X = padX + boxWidth + 18;

      // Box 1: Entry Price
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(padX, bentoY1, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("ENTRY PRICE", padX + 22, bentoY1 + boxHeight * 0.38);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.entryPrice, padX + 22, bentoY1 + boxHeight * 0.80);

      // Box 2: Exit Price
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(box2X, bentoY1, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("EXIT PRICE", box2X + 22, bentoY1 + boxHeight * 0.38);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.exitPrice, box2X + 22, bentoY1 + boxHeight * 0.80);

      // Box 3: Hold Duration
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(padX, bentoY2, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("HOLD DURATION", padX + 22, bentoY2 + boxHeight * 0.38);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.durationStr, padX + 22, bentoY2 + boxHeight * 0.80);

      // Box 4: Return / R-Multiple or Status
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(box2X, bentoY2, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(tradeMetrics.returnLabel ? "RETURN / R" : "EXECUTION", box2X + 22, bentoY2 + boxHeight * 0.38);
      ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#fb7185";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.returnLabel || (tradeMetrics.isProfit ? "WIN" : "LOSS"), box2X + 22, bentoY2 + boxHeight * 0.80);
    } else if (aspect === "landscape") {
      const boxHeight = targetHeight * 0.16;
      const bentoY = heroY + targetHeight * 0.065;
      const boxGap = 20;
      const boxWidth = (targetWidth - padX * 2 - boxGap * 2) / 3;
      const box2X = padX + boxWidth + boxGap;
      const box3X = padX + (boxWidth + boxGap) * 2;

      // Box 1: Entry
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(padX, bentoY, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("ENTRY PRICE", padX + 22, bentoY + boxHeight * 0.38);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.entryPrice, padX + 22, bentoY + boxHeight * 0.80);

      // Box 2: Exit
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(box2X, bentoY, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("EXIT PRICE", box2X + 22, bentoY + boxHeight * 0.38);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.exitPrice, box2X + 22, bentoY + boxHeight * 0.80);

      // Box 3: Return & Duration
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(box3X, bentoY, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(tradeMetrics.returnLabel ? "RETURN / DURATION" : "HOLD DURATION", box3X + 22, bentoY + boxHeight * 0.38);
      ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      const box3Val = tradeMetrics.returnLabel ? `${tradeMetrics.returnLabel} • ${tradeMetrics.durationStr}` : tradeMetrics.durationStr;
      ctx.fillText(box3Val, box3X + 22, bentoY + boxHeight * 0.80);
    } else {
      // Post (1080x1080)
      const bentoY = heroY + targetHeight * 0.06;
      const boxHeight = targetHeight * 0.135;
      const boxWidth = (targetWidth - padX * 2 - 18) / 2;
      const box2X = padX + boxWidth + 18;

      // Draw Box 1 (Entry)
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(padX, bentoY, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("ENTRY PRICE", padX + 22, bentoY + boxHeight * 0.38);

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.entryPrice, padX + 22, bentoY + boxHeight * 0.80);

      // Draw Box 2 (Exit)
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(box2X, bentoY, boxWidth, boxHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `700 ${Math.round(baseDim * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(tradeMetrics.returnLabel ? `EXIT (${tradeMetrics.returnLabel})` : "EXIT PRICE", box2X + 22, bentoY + boxHeight * 0.38);

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(baseDim * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(tradeMetrics.exitPrice, box2X + 22, bentoY + boxHeight * 0.80);
    }

    // 7. Hairline Separator Line
    const sepLineY = targetHeight * 0.85;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, sepLineY);
    ctx.lineTo(targetWidth - padX, sepLineY);
    ctx.stroke();

    // 8. Footer: User Avatar & Metadata (Left) + Transparent Logo Watermark (Right)
    const footerY = sepLineY + targetHeight * 0.025;
    const avatarSize = Math.max(52, Math.round(baseDim * 0.065));
    const avatarX = padX;
    const avatarY = footerY;

    // Draw User Avatar
    let avatarLoaded = false;
    if (userInfo.avatar) {
      try {
        const aImg = new Image();
        aImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          aImg.onload = () => {
            avatarLoaded = true;
            resolve();
          };
          aImg.onerror = resolve;
          aImg.src = userInfo.avatar;
        });

        if (avatarLoaded && aImg.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(aImg, avatarX, avatarY, avatarSize, avatarSize);
          ctx.restore();
        }
      } catch {
        avatarLoaded = false;
      }
    }

    if (!avatarLoaded) {
      // Fallback gradient monogram
      ctx.save();
      const aGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      aGrad.addColorStop(0, "#0066FF");
      aGrad.addColorStop(1, "#38bdf8");
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(avatarSize * 0.44)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initial = (userInfo.name || "T")[0].toUpperCase();
      ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);
      ctx.restore();
    }

    // Avatar glowing ring
    ctx.strokeStyle = tradeMetrics.isProfit ? "rgba(56, 189, 248, 0.6)" : "rgba(251, 113, 133, 0.6)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // User Text
    const userTextX = avatarX + avatarSize + 16;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(avatarSize * 0.44)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`@${userInfo.name}`, userTextX, avatarY + avatarSize * 0.45);

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = `600 ${Math.round(avatarSize * 0.30)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.dateStr, userTextX, avatarY + avatarSize * 0.88);

    // Bottom-Right Watermark: In place of raw "FN", render the 3D transparent Logo!
    const wmLogoSize = avatarSize * 0.95;
    const wmX = targetWidth - padX - wmLogoSize;
    const wmY = avatarY;

    if (logoImg && logoImg.width > 0) {
      ctx.drawImage(logoImg, wmX, wmY, wmLogoSize, wmLogoSize);
    } else {
      ctx.textAlign = "right";
      ctx.font = `900 ${Math.round(avatarSize * 0.65)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText("ForexNotes", targetWidth - padX, avatarY + avatarSize * 0.68);
    }

    return canvas;
  }, [aspect, tradeMetrics, userInfo]);

  // Synchronously update poster preview whenever aspect, trade, or user changes
  useEffect(() => {
    let active = true;
    if (!isOpen || !trade || !tradeMetrics) {
      setPreviewDataUrl(null);
      setIsRenderingPreview(false);
      return;
    }
    const generatePreview = async () => {
      setIsRenderingPreview(true);
      try {
        const cfg = ASPECT_CONFIGS[aspect] || ASPECT_CONFIGS.post;
        const canvas = await renderCardToCanvas(cfg.width, cfg.height);
        if (active && canvas) {
          setPreviewDataUrl(canvas.toDataURL("image/png"));
        }
      } catch (err) {
        console.error("Preview render failed:", err);
      } finally {
        if (active) setIsRenderingPreview(false);
      }
    };
    generatePreview();
    return () => {
      active = false;
    };
  }, [isOpen, aspect, trade, tradeMetrics, renderCardToCanvas]);

  // Download Handler
  const handleDownload = async () => {
    if (!tradeMetrics) return;
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas(currentCfg.width, currentCfg.height);
      if (!canvas) throw new Error("Canvas generation failed");
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `forexnotes_trade_card_${tradeMetrics.symbol}_${aspect}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setToastMessage("Trade card downloaded!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      console.error("Failed to export trade card:", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (canvas) => {
    try {
      if (canvas && window.ClipboardItem && navigator.clipboard?.write) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            setCopied(true);
            setToastMessage("Trade poster copied to clipboard!");
            setTimeout(() => {
              setCopied(false);
              setToastMessage("");
            }, 3000);
          }
        }, "image/png");
      } else {
        const shareText = `Trade on ${tradeMetrics.symbol}: ${tradeMetrics.directionLabel} (${tradeMetrics.formattedPnl}) logged on ForexNotes. https://forexnotes.in`;
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setToastMessage("Trade summary copied to clipboard!");
        setTimeout(() => {
          setCopied(false);
          setToastMessage("");
        }, 3000);
      }
    } catch {
      alert("Unable to copy to clipboard.");
    }
  };

  // Share Handler
  const handleShare = async () => {
    if (!tradeMetrics) return;
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas(currentCfg.width, currentCfg.height);
      if (!canvas) throw new Error("Canvas generation failed");

      if (navigator.share && canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `forexnotes-${tradeMetrics.symbol}.png`, { type: "image/png" });
            try {
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: `${tradeMetrics.symbol} Trade Result - ForexNotes`,
                  text: `Check out my ${tradeMetrics.directionLabel} trade on ${tradeMetrics.symbol} (${tradeMetrics.formattedPnl}) tracked on ForexNotes!`,
                  files: [file],
                });
                return;
              }
            } catch {
              // fallback
            }
          }
          copyToClipboard(canvas);
        }, "image/png");
      } else {
        copyToClipboard(canvas);
      }
    } catch {
      copyToClipboard();
    } finally {
      setIsGenerating(false);
    }
  };

  // UNCONDITIONAL HOOKS ARE COMPLETE. SAFE EARLY RETURN ONLY HERE:
  if (!isOpen || !trade || !tradeMetrics) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#121622] rounded-3xl border border-black/[0.1] dark:border-white/[0.12] shadow-2xl flex flex-col max-h-[96vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121622]">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#0066FF]" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Share Trade</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Preview Area (Renders Exact Poster Image from Canvas) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-neutral-100/90 dark:bg-black/60 min-h-[380px] sm:min-h-[460px]">
          {isRenderingPreview || !previewDataUrl ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-[#0066FF] animate-spin" />
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Generating {currentCfg.label} poster preview...
              </span>
            </div>
          ) : (
            <div className="relative group max-w-full flex items-center justify-center animate-in fade-in duration-200">
              <img
                src={previewDataUrl}
                alt={`ForexNotes Trade Poster - ${currentCfg.label}`}
                className="max-h-[50vh] sm:max-h-[56vh] max-w-[90vw] object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-black/10 dark:border-white/10"
              />
            </div>
          )}
        </div>

        {/* Aspect Ratio Selector Tabs */}
        <div className="px-6 pt-3 pb-2 bg-white dark:bg-[#121622] border-t border-black/[0.05] dark:border-white/[0.06]">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-white/[0.05] rounded-2xl border border-black/[0.05] dark:border-white/[0.08]">
            {Object.entries(ASPECT_CONFIGS).map(([key, cfg]) => {
              const isActive = aspect === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAspect(key)}
                  className={`py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-[#1f2639] shadow-sm text-neutral-900 dark:text-white font-bold border border-black/[0.05] dark:border-white/[0.1]"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{cfg.label}</div>
                  <div className="text-[10px] font-mono opacity-65">{cfg.dims}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons: Download & Share */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#121622] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3">
          <button
            type="button"
            disabled={isGenerating || isRenderingPreview}
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl border border-black/[0.1] dark:border-white/10 bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] text-neutral-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? "Exporting..." : "Download"}</span>
          </button>

          <button
            type="button"
            disabled={isGenerating || isRenderingPreview}
            onClick={handleShare}
            style={{ backgroundColor: "#0066FF", color: "#ffffff" }}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/25 btn-primary-blue share-modal-btn-primary"
          >
            {copied ? <Check className="w-4 h-4 text-white stroke-[2.5]" /> : <Share2 className="w-4 h-4 text-white stroke-[2.5]" />}
            <span className="text-white font-bold" style={{ color: "#ffffff" }}>{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>

        {/* Animated Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Check className="w-3.5 h-3.5 text-blue-500" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
