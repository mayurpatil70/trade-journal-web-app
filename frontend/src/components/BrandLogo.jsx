// frontend/src/components/BrandLogo.jsx
// Faithful replication of modern FN ForexNotes Institutional Branding (Screenshot 5)
// Slanted 'F' in electric blue #0066FF, 'N' in #0F172A (dark: #FFFFFF), and 'ForexNotes' ('Forex' dark, 'Notes' #0066FF)

export default function BrandLogo({ className = "", showText = true, size = "md", ...rest }) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none font-sans ${className}`}
      {...rest}
    >
      {/* ── Monogram: Slanted FN ── */}
      <span
        className={`font-black italic tracking-tighter leading-none flex items-center ${
          isSm ? "text-xl" : isLg ? "text-3xl" : "text-2xl"
        }`}
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        <span className="text-[#0066FF]">F</span>
        <span className="text-[#0F172A] dark:text-white -ml-0.5">N</span>
      </span>

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
