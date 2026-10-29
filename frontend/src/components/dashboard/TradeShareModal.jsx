// frontend/src/components/dashboard/TradeShareModal.jsx
// Faithful replication of TradeFXBook Share Trade 3-Poster Architecture
// Styled with institutional IB Card aesthetics, transparent FN 3D logo, and responsive layouts
// Generates Story (1080x1920), Post (1080x1080), and Landscape (1920x1080) shareable posters

import { useState, useRef, useEffect, useMemo } from "react";
import { X, Download, Share2, Check } from "lucide-react";

export default function TradeShareModal({ isOpen, onClose, trade }) {
  const [aspect, setAspect] = useState("post"); // "post" | "story" | "landscape"
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

    const entryPrice =
      trade.entry || trade.entry_price
        ? Number(trade.entry || trade.entry_price).toLocaleString("en-US", { minimumFractionDigits: 2 })
        : "—";
    const exitPrice =
      trade.exit || trade.exit_price
        ? Number(trade.exit || trade.exit_price).toLocaleString("en-US", { minimumFractionDigits: 2 })
        : "—";

    // Timestamp formatting
    let dateStr = "Today";
    if (trade.date) {
      dateStr = `${trade.date} ${trade.time || "08:00:00"}`.trim();
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

  const currentCfg = aspectConfigs[aspect];

  // Canvas Exporter
  const renderCardToCanvas = async (targetWidth, targetHeight) => {
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

    // 3. Glowing Directional Vector Arrow in Background
    ctx.save();
    const arrowGrad = ctx.createLinearGradient(
      targetWidth * 0.4,
      targetHeight * 0.6,
      targetWidth * 0.9,
      targetHeight * 0.1
    );
    if (tradeMetrics.isProfit) {
      arrowGrad.addColorStop(0, "rgba(0, 102, 255, 0.0)");
      arrowGrad.addColorStop(0.4, "rgba(0, 102, 255, 0.16)");
      arrowGrad.addColorStop(1, "rgba(56, 189, 248, 0.32)");
    } else {
      arrowGrad.addColorStop(0, "rgba(244, 63, 94, 0.0)");
      arrowGrad.addColorStop(0.4, "rgba(244, 63, 94, 0.16)");
      arrowGrad.addColorStop(1, "rgba(251, 113, 133, 0.32)");
    }
    ctx.fillStyle = arrowGrad;

    const isUp = tradeMetrics.isProfit;
    const ax = targetWidth * 0.74;
    const ay = isUp ? targetHeight * 0.28 : targetHeight * 0.62;
    const asize = targetWidth * 0.34;

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

    // Draw Top-Left Brand Header with Transparent Logo
    const padX = targetWidth * 0.07;
    const topY = targetHeight * 0.07;
    const logoSize = Math.max(72, targetWidth * 0.085);

    if (logoImg && logoImg.width > 0) {
      ctx.drawImage(logoImg, padX, topY, logoSize, logoSize);
    }

    const brandTextX = padX + (logoImg && logoImg.width > 0 ? logoSize + 16 : 0);
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.round(targetWidth * 0.038)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("ForexNotes", brandTextX, topY + logoSize * 0.46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = `600 ${Math.round(targetWidth * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("Track Trades. Analyze PnL. Master Markets.", brandTextX, topY + logoSize * 0.82);

    // Top-Right Institutional Badge (IB Card style)
    const rightPillX = targetWidth * 0.93;
    const badgeText = "VERIFIED TRADE";
    ctx.font = `800 ${Math.round(targetWidth * 0.016)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const badgeWidth = ctx.measureText(badgeText).width + 28;
    const badgeHeight = Math.round(targetWidth * 0.036);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    ctx.roundRect(rightPillX - badgeWidth, topY + 6, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, rightPillX - badgeWidth / 2, topY + 6 + badgeHeight / 2);

    // Reset alignment
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 5. Body Section: Trade Performance
    const bodyY = targetHeight * (aspect === "story" ? 0.32 : aspect === "landscape" ? 0.36 : 0.34);

    // Category Pill / Tag
    ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#fb7185";
    ctx.font = `800 ${Math.round(targetWidth * 0.02)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("TRADE PERFORMANCE", padX, bodyY);

    // Subtitle Execution Bar: [Sell / Buy] | [Lots] | [Symbol]
    const subY = bodyY + targetHeight * 0.045;
    const subFontSize = Math.round(targetWidth * 0.026);
    ctx.font = `800 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;

    // Direction Pill
    ctx.fillStyle = tradeMetrics.isSell ? "#f43f5e" : "#10b981";
    ctx.fillText(tradeMetrics.directionLabel, padX, subY);
    const dirW = ctx.measureText(tradeMetrics.directionLabel).width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("  |  ", padX + dirW, subY);
    const sep1W = ctx.measureText("  |  ").width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    const lotsText = `${tradeMetrics.lots} Lots`;
    ctx.fillText(lotsText, padX + dirW + sep1W, subY);
    const lotsW = ctx.measureText(lotsText).width;

    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("  |  ", padX + dirW + sep1W + lotsW, subY);
    const sep2W = ctx.measureText("  |  ").width;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(tradeMetrics.symbol, padX + dirW + sep1W + lotsW + sep2W, subY);

    // Giant Hero P&L Headline
    const heroY = subY + targetHeight * 0.11;
    ctx.font = `900 ${Math.round(targetWidth * 0.088)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = tradeMetrics.isProfit ? "#38bdf8" : "#fb7185";
    ctx.fillText(tradeMetrics.formattedPnl, padX, heroY);

    // 6. Bento Metrics Boxes (Entry & Exit Prices)
    const bentoY = heroY + targetHeight * 0.07;
    const boxWidth = targetWidth * 0.38;
    const boxHeight = targetHeight * (aspect === "story" ? 0.09 : 0.13);
    const box2X = padX + boxWidth + 18;

    // Draw Box 1 (Entry)
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(padX, bentoY, boxWidth, boxHeight, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = `700 ${Math.round(targetWidth * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("ENTRY PRICE", padX + 22, bentoY + boxHeight * 0.4);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(targetWidth * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.entryPrice, padX + 22, bentoY + boxHeight * 0.82);

    // Draw Box 2 (Exit)
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.beginPath();
    ctx.roundRect(box2X, bentoY, boxWidth, boxHeight, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = `700 ${Math.round(targetWidth * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText("EXIT PRICE", box2X + 22, bentoY + boxHeight * 0.4);

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.round(targetWidth * 0.034)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.exitPrice, box2X + 22, bentoY + boxHeight * 0.82);

    // 7. Hairline Separator Line
    const sepLineY = targetHeight * 0.86;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, sepLineY);
    ctx.lineTo(targetWidth * 0.93, sepLineY);
    ctx.stroke();

    // 8. Footer: User Avatar & Metadata (Left) + Transparent Logo Watermark (Right)
    const footerY = sepLineY + targetHeight * 0.03;
    const avatarSize = Math.max(56, targetWidth * 0.065);
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
    ctx.font = `800 ${Math.round(avatarSize * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`@${userInfo.name}`, userTextX, avatarY + avatarSize * 0.45);

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = `600 ${Math.round(avatarSize * 0.28)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(tradeMetrics.dateStr, userTextX, avatarY + avatarSize * 0.88);

    // Bottom-Right Watermark: In place of raw "FN", render the 3D transparent Logo!
    const wmLogoSize = avatarSize * 0.95;
    const wmX = targetWidth * 0.93 - wmLogoSize;
    const wmY = avatarY;

    if (logoImg && logoImg.width > 0) {
      ctx.drawImage(logoImg, wmX, wmY, wmLogoSize, wmLogoSize);
    } else {
      ctx.textAlign = "right";
      ctx.font = `900 ${Math.round(avatarSize * 0.65)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText("ForexNotes", targetWidth * 0.93, avatarY + avatarSize * 0.68);
    }

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

  // Share Handler
  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCardToCanvas(currentCfg.width, currentCfg.height);

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

        {/* Modal Content / Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-neutral-100/80 dark:bg-black/50">
          {/* Card Preview Container */}
          <div
            className={`relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 ${currentCfg.previewClasses} flex flex-col justify-between p-4 sm:p-5 select-none text-white`}
            style={{
              background: "linear-gradient(155deg, #050914 0%, #0a1329 45%, #0d1b38 75%, #040710 100%)",
            }}
          >
            {/* Subtle Grid Lines overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Glowing Arrow Backdrop */}
            <div
              className={`absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none blur-3xl ${
                tradeMetrics.isProfit ? "bg-blue-500/25" : "bg-rose-500/25"
              }`}
            />

            {/* Diagonal Vector Arrow */}
            <div
              className={`absolute top-5 right-5 w-20 h-20 sm:w-28 sm:h-28 pointer-events-none transition-transform ${
                tradeMetrics.isProfit ? "text-blue-500/30" : "text-rose-500/30 rotate-90"
              }`}
            >
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <path d="M 20 80 L 70 30 M 70 30 L 40 30 M 70 30 L 70 60" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>

            {/* Header: Transparent 3D Logo + ForexNotes Title + Institutional Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/brand/fn-logo.png"
                  alt="ForexNotes Logo"
                  className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-black tracking-tight text-white leading-tight">
                    ForexNotes
                  </h4>
                  <p className="text-[8px] sm:text-[9px] font-medium text-white/60 tracking-tight leading-tight">
                    Track Trades. Analyze PnL. Master Markets.
                  </p>
                </div>
              </div>

              {/* IB Card Style Institutional Pill */}
              <div className="px-2.5 py-0.5 rounded-full border border-white/20 bg-white/[0.04] text-[9px] font-extrabold uppercase tracking-widest text-white/80">
                VERIFIED
              </div>
            </div>

            {/* Body: Section Header, direction, lots, hero P&L, bento boxes */}
            <div className="relative z-10 my-auto py-2">
              <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 ${
                tradeMetrics.isProfit ? "text-[#38bdf8]" : "text-rose-400"
              }`}>
                TRADE PERFORMANCE
              </p>

              {/* Subtitle Line: Sell | 0.2 Lots | XAUUSD */}
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold mb-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${
                  tradeMetrics.isSell ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {tradeMetrics.directionLabel}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">{tradeMetrics.lots} Lots</span>
                <span className="text-white/40">•</span>
                <span className="text-white font-extrabold tracking-tight">{tradeMetrics.symbol}</span>
              </div>

              {/* Big Hero P&L */}
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2 sm:mb-3 leading-tight ${
                  tradeMetrics.isProfit ? "text-[#38bdf8] drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]" : "text-[#fb7185] drop-shadow-[0_0_20px_rgba(251,113,133,0.35)]"
                }`}
              >
                {tradeMetrics.formattedPnl}
              </h2>

              {/* Bento Metrics Box (IB Card Style) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/[0.035] border border-white/[0.08]">
                  <p className="text-[8px] sm:text-[9px] text-white/50 uppercase font-bold tracking-wider">ENTRY PRICE</p>
                  <p className="text-xs sm:text-sm font-extrabold font-mono text-white mt-0.5">{tradeMetrics.entryPrice}</p>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/[0.035] border border-white/[0.08]">
                  <p className="text-[8px] sm:text-[9px] text-white/50 uppercase font-bold tracking-wider">EXIT PRICE</p>
                  <p className="text-xs sm:text-sm font-extrabold font-mono text-white mt-0.5">{tradeMetrics.exitPrice}</p>
                </div>
              </div>
            </div>

            {/* Footer: User Profile + Transparent 3D Logo Watermark (In Place of FN) */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                {userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#0066FF] to-sky-400 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white/30">
                    {(userInfo.name || "T")[0].toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-[11px] sm:text-xs font-bold text-white truncate leading-tight">@{userInfo.name}</p>
                  <p className="text-[9px] sm:text-[10px] font-mono text-white/50 leading-tight">{tradeMetrics.dateStr}</p>
                </div>
              </div>

              {/* 3D Transparent Logo Watermark */}
              <div className="flex items-center gap-1.5 opacity-90">
                <img
                  src="/brand/fn-logo.png"
                  alt="ForexNotes"
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Selector Tabs */}
        <div className="px-6 pt-3 pb-2 bg-white dark:bg-[#121622] border-t border-black/[0.05] dark:border-white/[0.06]">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-white/[0.05] rounded-2xl border border-black/[0.05] dark:border-white/[0.08]">
            {Object.entries(aspectConfigs).map(([key, cfg]) => {
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
            disabled={isGenerating}
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl border border-black/[0.08] dark:border-white/10 bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] text-neutral-900 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? "Exporting..." : "Download"}</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-blue-500/25"
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
