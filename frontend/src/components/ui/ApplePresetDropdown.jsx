// frontend/src/components/ui/ApplePresetDropdown.jsx
// Apple iOS / macOS Frosted Glass Preset Dropdown
// Matches the application's native Apple Bento design system and AccountFilter (Image 3)
// Eliminates Windows / browser native OS select popovers (Image 5)

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export default function ApplePresetDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select preset",
  className = "",
  align = "right", // "left" | "right"
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

  // Normalize options array into { value, label } objects
  const normalizedOptions = options.map((opt) =>
    typeof opt === "object" && opt !== null
      ? opt
      : { value: String(opt), label: String(opt) }
  );

  // Find active option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value).toLowerCase() === String(value || "").toLowerCase()
  );

  // Position calculation with viewport boundary safety
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(normalizedOptions.length * 36 + 16, 260);
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    // Minimum dropdown menu width is 150px
    const menuWidth = Math.max(rect.width, 160);
    let leftPos = align === "right" ? rect.right - menuWidth : rect.left;

    // Ensure within viewport bounds
    if (leftPos < 8) leftPos = 8;
    if (leftPos + menuWidth > window.innerWidth - 8) {
      leftPos = window.innerWidth - menuWidth - 8;
    }

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: leftPos,
      width: menuWidth,
      placeAbove,
    });
  }, [normalizedOptions.length, align]);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
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

    const handleWindowChange = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (val) => {
    if (onChange) {
      onChange(val);
    }
    setIsOpen(false);
  };

  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* iOS / macOS Styled Pill Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`inline-flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all duration-150 cursor-pointer backdrop-blur-xl shadow-2xs select-none ${
          isOpen
            ? "bg-white dark:bg-white/[0.12] border-blue-500/50 ring-2 ring-blue-500/20 text-neutral-900 dark:text-white"
            : "bg-neutral-100 hover:bg-neutral-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-black/[0.08] dark:border-white/[0.1] text-neutral-800 dark:text-neutral-200 hover:border-black/15 dark:hover:border-white/20"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[130px] font-medium">{displayText}</span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 dark:text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-500" : ""
          }`}
        />
      </button>

      {/* Floating Apple-Style Frosted Glass Menu (Portaled) */}
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
              zIndex: 999999,
            }}
            className="bg-white/95 dark:bg-[#121622]/95 border border-black/[0.08] dark:border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-0.5 select-none"
            role="listbox"
          >
            {normalizedOptions.map((opt) => {
              const isSelected =
                String(opt.value).toLowerCase() === String(value || "").toLowerCase();
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
                      : "text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

