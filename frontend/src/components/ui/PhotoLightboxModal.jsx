// frontend/src/components/ui/PhotoLightboxModal.jsx
// High-resolution photo viewer lightbox for trade chart screenshots
// Supports zoom, pan, full-screen expansion, and download

import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from "lucide-react";

export default function PhotoLightboxModal({ isOpen, onClose, src, title = "Trade Chart Screenshot" }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, src]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setScale((s) => Math.min(3.5, s + 0.3));
  const handleZoomOut = () => setScale((s) => Math.max(0.6, s - 0.3));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `Trade-Chart-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Floating Controls Bar */}
      <div
        className="fixed top-4 inset-x-4 max-w-2xl mx-auto z-10 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-xl text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-bold tracking-tight truncate max-w-[200px] sm:max-w-md">
          {title}
        </span>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
        />
      </div>

      {/* Bottom hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/50 pointer-events-none">
        Click outside or press ESC to exit • Scroll/controls to zoom
      </div>
    </div>
  );
}

