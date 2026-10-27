// frontend/src/components/ui/AppleSelect.jsx
// Apple iOS / macOS Frosted Glass Custom Dropdown
// Replaces native OS <select> to eliminate Windows/browser system-blue popovers
// Uses React Portal into document.body to prevent clipping and z-index issues

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export default function AppleSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error = false,
  className = "",
  name,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  // Normalize options: supports string[] or { value, label }[]
  const normalizedOptions = options.map((opt) =>
    typeof opt === "object" && opt !== null
      ? opt
      : { value: opt, label: String(opt) },
  );

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value),
  );

  // Measure and position dropdown
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(normalizedOptions.length * 40 + 20, 260);
    const placeAbove =
      spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    setCoords({
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      placeAbove,
    });
  }, [normalizedOptions.length]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { name: name || "", value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Button (iOS Squircle Frosted Glass) */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200 cursor-pointer text-left backdrop-blur-xl ${
          error
            ? "border border-rose-500/80 ring-1 ring-rose-500/50 bg-rose-500/[0.04]"
            : isOpen
              ? "border border-emerald-500/60 ring-2 ring-emerald-500/20 bg-white/95 dark:bg-white/[0.09]"
              : "border border-black/[0.08] dark:border-white/10 bg-white/70 dark:bg-white/[0.05] hover:bg-white/90 dark:hover:bg-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/20"
        } text-neutral-900 dark:text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-neutral-900 dark:text-white font-medium"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
        />
      </button>

      {/* iOS / macOS Frosted Glass Popover Menu (Portaled into document.body to prevent clipping) */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.placeAbove ? undefined : coords.top,
              bottom: coords.placeAbove
                ? window.innerHeight - coords.top
                : undefined,
              left: coords.left,
              width: coords.width,
              zIndex: 99999,
            }}
            className="bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="space-y-0.5">
              {normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20"
                        : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
