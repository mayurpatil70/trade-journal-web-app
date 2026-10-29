// frontend/src/components/dashboard/TradeShareModal.jsx
// Faithful replication of TradeFXBook's Share Trade 3-Poster Architecture
// Generates Story (1080x1920), Post (1080x1080), and Landscape (1920x1080) shareable cards
// Powered by ForexNotes custom branding & user profile metadata

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Download, Share2, Check, Sparkles } from "lucide-react";

export default function TradeShareModal({ isOpen, onClose, trade }) {
  const [aspect, setAspect] = useState("post"); // "story" | "post" | "landscape"
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const canvasRef = useRef(null);

  // Fetch logged-in user details
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
    const lots = trade.quantity || trade.lot_size || trade.lots || "0.2";

    // PnL calculation
    let pnlValue = 0;
    if (trade.pnl !== null && trade.pnl !== undefined && !Number.isNaN(Number(trade.pnl))) {
      pnlValue = Number(trade.pnl);
    } else {
      const entry = Number(trade.entry || trade.entry_price || 0);
      const exit = Number(trade.exit || trade.exit_price || 0);
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

    const entryPrice = trade.entry || trade.entry_price ? Number(trade.entry || trade.entry_price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—";
    const exitPrice = trade.exit || trade.exit_price ? Number(trade.exit || trade.exit_price).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—";

    // Timestamp formatting
    let dateStr = "Today";
    if (trade.date) {
      dateStr = `${trade.date} ${trade.time || ""}`.trim();
    } else {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const y = d.getFullYear();
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      dateStr = `${m}-${day}-${y} ${h}:${min}`;
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

  if (!isOpen || !trade || !tradeMetrics) return null;

  // Aspect configurations
  const aspectConfigs = {
    post: {
      label: "Post",
      dims: "1080×1080",
      width: 1080,
      height: 1080,
      previewWidth: "w-[340px] sm:w-[380px]",
      previewHeight: "h-[340px] sm:h-[380px]",
      aspectRatio: "aspect-square",
    },
    story: {
      label: "Story",
      dims: "1080×1920",
      width: 1080,
      height: 1920,
      previewWidth: "w-[240px] sm:w-[270px]",
      previewHeight: "h-[426px] sm:h-[480px]",
      aspectRatio: "aspect-[9/16]",
    },
    landscape: {
      label: "Landscape",
      dims: "1920×1080",
      width: 1920,
      height: 1080,
      previewWidth: "w-[380px] sm:w-[480px]",
      previewHeight: "h-[214px] sm:h-[270px]",
      aspectRatio: "aspect-[16/9]",
    },
  };

  const currentCfg = aspectConfigs[aspect];

  // Helper to draw canvas
  const renderCardToCanvas = async (targetWidth, targetHeight) => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    // 1. Background deep midnight blue gradient
    const bgGrad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    bgGrad.addColorStop(0, "#050914");
    bgGrad.addColorStop(0.4, "#0a1329");
    bgGrad.addColorStop(0.7, "#0d1b3a");
    bgGrad.addColorStop(1, "#040710");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 2. Subtle institutional grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;
    const gridSize = 40;
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

    // 3. Huge Glowing Directional Arrow in background
    ctx.save();
    const arrowGrad = ctx.createLinearGradient(
      targetWidth * 0.4,
      targetHeight * 0.6,
      targetWidth * 0.9,
      targetHeight * 0.1
    );
    if (tradeMetrics.isProfit) {
      arrowGrad.addColorStop(0, "rgba(0, 102, 255, 0.0)");
      arrowGrad.addColorStop(0.4, "rgba(0, 102, 255, 0.18)");
      arrowGrad.addColorStop(1, "rgba(56, 189, 248, 0.35)");
    } else {
      arrowGrad.addColorStop(0, "rgba(244, 63, 94, 0.0)");
      arrowGrad.addColorStop(0.4, "rgba(244, 63, 94, 0.18)");
      arrowGrad.addColorStop(1, "rgba(251, 113, 133, 0.35)");
    }
    ctx.fillStyle = arrowGrad;

    // Draw stylized diagonal arrow pointing up-right or down-right
    const isUp = tradeMetrics.isProfit;
    const ax = targetWidth * 0.72;
    const ay = isUp ? targetHeight * 0.28 : targetHeight * 0.65;
    const asize = targetWidth * 0.38;

    ctx.translate(ax, ay);
    ctx.rotate(isUp ? -Math.PI / 4 : Math.PI / 4);

    // Draw arrow shape
    ctx.beginPath();
    ctx.moveTo(0, -asize * 0.5);
    ctx.lineTo(asize * 0.4, -asize * 0.5);
    ctx.lineTo(asize * 0.4, -asize * 0.9);
    ctx.lineTo(asize, 0);
    ctx.lineTo(asize * 0.4, asize * 0.9);
    ctx.lineTo(asize * 0.4, asize * 0.5);
    ctx.lineTo(0, asize * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Preload and Draw FN Logo (/brand/fn-logo.jpg)
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
        logoImg.src = "/brand/fn-logo.jpg";
      });

      const logoX = targetWidth * 0.07;
      const logoY = targetHeight * 0.07;
      const logoSize = Math.max(64, targetWidth * 0.08);

      if (logoImg.width > 0) {
        ctx.save();
        // Rounded squircle clip for logo
        const radius = logoSize * 0.24;
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, radius);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        // Stroke border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, radius);
        ctx.stroke();
      }

      // Brand Title & Tagline next to Logo
      const textX = logoX + logoSize + 18;
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(logoSize * 0.46)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("ForexNotes", textX, logoY + logoSize * 0.45);

      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.font = `600 ${Math.round(logoSize * 0.22)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText("Track Trades. Analyze PnL. Master Markets.", textX, logoY + logoSize * 0.82);
    } catch {
      // Fallback text if logo fails
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(targetWidth * 0.045)}px sans-serif`;
      ctx.fillText("ForexNotes", targetWidth * 0.07, targetHeight * 0.1);
    }

    // 5. Body: Trade P&L Header
    const contentY = targetHeight * 0.36;
    const padX = targetWidth * 0.07;

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `600 ${Math.round(targetWidth * 0.038)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Trade P&L", padX, contentY);

    // Subtitle Pill: [Sell/Buy] | [Lots] Lots | [Symbol]
    const pillY = contentY + targetHeight * 0.048;
    const pillFontSize = Math.round(targetWidth * 0.026);
    ctx.font = `700 ${pillFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;

    // Direction (Red for sell, Emerald for buy)
    ctx.fillStyle = tradeMetrics.isSell ? "#f43f5e" : "#10b981";
    ctx.fillText(tradeMetrics.directionLabel, padX, pillY);
    const dirWidth = ctx.measureText(tradeMetrics.directionLabel).width;

    // Separator & Lots
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("  |  ", padX + dirWidth, pillY);
    const sep1Width = ctx.measureText("  |  ").width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    const lotsText = `${tradeMetrics.lots} Lots`;
    ctx.fillText(lotsText, padX + dirWidth + sep1Width, pillY);
    const lotsWidth = ctx.measureText(lotsText).width;

    // Separator & Symbol
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("  |  ", padX + dirWidth + sep1Width + lotsWidth, pillY);
    const sep2Width = ctx.measureText("  |  ").width;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(tradeMetrics.symbol, padX + dirWidth + sep1Width + lotsWidth + sep2Width, pillY);

    // 6. Huge Hero P&L (+$600.00 USD)
    const pnlY = pillY + targetHeight * 0.1;
    ctx.font = `900 ${Math.round(targetWidth * 0.082)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#f43f5e";
    ctx.fillText(tradeMetrics.formattedPnl, padX, pnlY);

    // 7. Entry & Exit Price Columns
    const priceY = pnlY + targetHeight * 0.08;
    const col2X = padX + targetWidth * 0.28;

    // Entry label & value
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = `600 ${Math.round(targetWidth * 0.022)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Entry Price", padX, priceY);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(targetWidth * 0.038)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.entryPrice, padX, priceY + targetHeight * 0.045);

    // Exit label & value
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = `600 ${Math.round(targetWidth * 0.022)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Exit Price", col2X, priceY);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(targetWidth * 0.038)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.exitPrice, col2X, priceY + targetHeight * 0.045);

    // 8. Footer: Respective User Profile & FN Watermark
    const footerY = targetHeight * 0.88;
    const avatarSize = Math.max(52, targetWidth * 0.065);
    const avatarX = padX;
    const avatarY = footerY;

    // Draw user avatar or initial circle
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
      // Fallback gradient monogram avatar
      ctx.save();
      const aGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
      aGrad.addColorStop(0, "#0066FF");
      aGrad.addColorStop(1, "#38bdf8");
      ctx.fillStyle = aGrad;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Initials
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(avatarSize * 0.44)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initial = (userInfo.name || "T")[0].toUpperCase();
      ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);
      ctx.restore();
    }

    // Avatar ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // User name & Timestamp text
    const metaX = avatarX + avatarSize + 14;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(avatarSize * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(userInfo.name, metaX, avatarY + avatarSize * 0.46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = `500 ${Math.round(avatarSize * 0.3)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.dateStr, metaX, avatarY + avatarSize * 0.88);

    // Watermark Logo / Badge on bottom right
    const wmX = targetWidth * 0.93;
    const wmY = avatarY + avatarSize * 0.65;
    ctx.textAlign = "right";
    ctx.font = `900 ${Math.round(avatarSize * 0.72)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText("FN", wmX, wmY);

    return canvas;
  };

  // Download Handler
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas(currentCfg.width, currentCfg.height);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `ForexNotes-${tradeMetrics.symbol}-${aspect}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setToastMessage("Card downloaded successfully!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      console.error("Failed to generate download:", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Share Handler
  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas(currentCfg.width, currentCfg.height);

      // Check if navigator.share with files is supported
      if (navigator.share && canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `trade-${tradeMetrics.symbol}.png`, { type: "image/png" });
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
              // Fallback to clipboard
            }
          }
          // Copy image to clipboard
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

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#10141f] rounded-3xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
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

        {/* Modal Content / Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-neutral-100/60 dark:bg-black/40">
          {/* Card Preview Container */}
          <div
            className={`relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 ${currentCfg.previewWidth} ${currentCfg.previewHeight} flex flex-col justify-between p-5 select-none text-white`}
            style={{
              background: "linear-gradient(145deg, #050914 0%, #0a1329 45%, #0d1b3a 75%, #040710 100%)",
            }}
          >
            {/* Subtle Grid Lines overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Glowing Arrow Backdrop */}
            <div
              className={`absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none blur-3xl ${
                tradeMetrics.isProfit ? "bg-blue-500/25" : "bg-rose-500/25"
              }`}
            />

            {/* Giant diagonal vector arrow */}
            <div
              className={`absolute top-6 right-6 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none transition-transform ${
                tradeMetrics.isProfit ? "text-blue-500/30" : "text-rose-500/30 rotate-90"
              }`}
            >
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <path d="M 20 80 L 70 30 M 70 30 L 40 30 M 70 30 L 70 60" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            {/* Header: Uploaded 3D FN Logo + ForexNotes Title + Tagline */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-white/20 shadow-md shrink-0 bg-black/40">
                <img
                  src="/brand/fn-logo.jpg"
                  alt="ForexNotes Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
                  ForexNotes
                </h4>
                <p className="text-[9px] sm:text-[10px] font-medium text-white/60 tracking-tight leading-tight">
                  Track Trades. Analyze PnL. Master Markets.
                </p>
              </div>
            </div>

            {/* Body: Trade P&L, direction pill, hero figure, price grid */}
            <div className="relative z-10 my-auto py-2">
              <p className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wider mb-1">
                Trade P&L
              </p>

              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold mb-2">
                <span className={tradeMetrics.isSell ? "text-rose-400 font-extrabold" : "text-emerald-400 font-extrabold"}>
                  {tradeMetrics.directionLabel}
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/70">{tradeMetrics.lots} Lots</span>
                <span className="text-white/30">|</span>
                <span className="text-white font-extrabold">{tradeMetrics.symbol}</span>
              </div>

              {/* Big Hero P&L */}
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-3 ${
                  tradeMetrics.isProfit ? "text-[#38bdf8]" : "text-rose-400"
                }`}
              >
                {tradeMetrics.formattedPnl}
              </h2>

              {/* 2-Column Price Grid */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-semibold">Entry Price</p>
                  <p className="text-xs sm:text-sm font-bold font-mono text-white">{tradeMetrics.entryPrice}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-semibold">Exit Price</p>
                  <p className="text-xs sm:text-sm font-bold font-mono text-white">{tradeMetrics.exitPrice}</p>
                </div>
              </div>
            </div>

            {/* Footer: User profile photo + Name + Timestamp + Watermark */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                {userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0066FF] to-sky-400 flex items-center justify-center text-white text-xs font-bold border border-white/30">
                    {(userInfo.name || "T")[0].toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate leading-tight">{userInfo.name}</p>
                  <p className="text-[10px] font-mono text-white/50 leading-tight">{tradeMetrics.dateStr}</p>
                </div>
              </div>

              {/* FN Watermark */}
              <div className="text-base sm:text-lg font-black tracking-tighter text-white/90">
                FN
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Selector (Exact replication of Screenshot 3 tabs) */}
        <div className="px-6 pt-4 pb-2 bg-white dark:bg-[#10141f]">
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-white/[0.04] rounded-2xl border border-black/[0.05] dark:border-white/[0.06]">
            {Object.entries(aspectConfigs).map(([key, cfg]) => {
              const isActive = aspect === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAspect(key)}
                  className={`py-2 px-3 rounded-xl text-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-[#1b2133] shadow-sm text-neutral-900 dark:text-white font-bold border border-black/[0.04] dark:border-white/[0.08]"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{cfg.label}</div>
                  <div className="text-[10px] font-mono opacity-60">{cfg.dims}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions Footer: Download & Share */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#10141f] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/[0.04] hover:bg-neutral-50 dark:hover:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? "Exporting..." : "Download"}</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/25"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>

        {/* Animated Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
