// frontend/src/components/BrandLogo.jsx

export default function BrandLogo({ className = "", showText = true, size = "md", ...rest }) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none font-sans ${className}`}
      {...rest}
    >
      <img
        src="/brand/fn-mark-256.webp"
        alt=""
        aria-hidden="true"
        className={`object-contain shrink-0 ${isSm ? "w-6 h-6" : isLg ? "w-10 h-10" : "w-8 h-8"}`}
      />

      {/* ── Wordmark: ForexNotes ── */}
      {showText && (
        <span
          className={`font-black tracking-tight leading-none flex items-center ${
            isSm ? "text-sm" : isLg ? "text-xl" : "text-[17px] sm:text-[19px]"
          }`}
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          <span className="text-[#0F172A] dark:text-white">Forex</span>
          <span className="text-[#0066FF]">Notes</span>
        </span>
      )}
    </div>
  );
}
