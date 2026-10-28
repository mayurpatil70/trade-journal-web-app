import { useState, useEffect } from "react";

export default function MarketClock({ timezone = "UTC" }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute angles based on timezone
  let hour = time.getUTCHours();
  let minute = time.getUTCMinutes();
  let second = time.getUTCSeconds();

  if (timezone !== "UTC") {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      }).formatToParts(time);

      const hPart = parts.find((p) => p.type === "hour");
      const mPart = parts.find((p) => p.type === "minute");
      const sPart = parts.find((p) => p.type === "second");
      if (hPart) hour = parseInt(hPart.value, 10);
      if (mPart) minute = parseInt(mPart.value, 10);
      if (sPart) second = parseInt(sPart.value, 10);
    } catch (e) {
      // Fallback to UTC
    }
  }

  const secondAngle = second * 6;
  const minuteAngle = minute * 6 + second * 0.1;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;

  const formattedDigital = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center justify-center p-6 select-none">
      {/* Luxury Swiss / Apple macOS Clock Dial */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-[#0a0d14] border-2 border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_0_40px_rgba(0,0,0,0.9)] flex items-center justify-center">
        {/* Subtle radial ambient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/10 via-transparent to-white/[0.03] pointer-events-none" />

        {/* 12 Cardinal Ticks and Minor Hashes */}
        {Array.from({ length: 60 }).map((_, i) => {
          const isMajor = i % 5 === 0;
          return (
            <div
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom"
              style={{
                height: "50%",
                transform: `rotate(${i * 6}deg)`,
              }}
            >
              <div
                className={`mx-auto rounded-full ${
                  isMajor
                    ? "w-[2px] h-3 bg-white/70"
                    : "w-[1px] h-1.5 bg-white/20"
                }`}
              />
            </div>
          );
        })}

        {/* Hour Numbers: 12, 3, 6, 9 */}
        <span className="absolute top-5 text-xs font-mono font-bold text-neutral-300">12</span>
        <span className="absolute right-5 text-xs font-mono font-bold text-neutral-300">3</span>
        <span className="absolute bottom-5 text-xs font-mono font-bold text-neutral-300">6</span>
        <span className="absolute left-5 text-xs font-mono font-bold text-neutral-300">9</span>

        {/* Hour Hand */}
        <div
          className="absolute w-1.5 h-16 sm:h-20 bg-white rounded-full shadow-md origin-bottom bottom-1/2"
          style={{
            transform: `rotate(${hourAngle}deg)`,
            transition: "transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
          }}
        />

        {/* Minute Hand */}
        <div
          className="absolute w-1 h-22 sm:h-26 bg-neutral-200 rounded-full shadow-md origin-bottom bottom-1/2"
          style={{
            transform: `rotate(${minuteAngle}deg)`,
            transition: "transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
          }}
        />

        {/* Second Hand (Emerald Green with Counterweight) */}
        <div
          className="absolute w-[2px] h-26 sm:h-30 bg-emerald-400 origin-bottom bottom-1/2 z-10"
          style={{
            transform: `rotate(${secondAngle}deg)`,
            transition: second === 0 ? "none" : "transform 0.15s cubic-bezier(0.4, 2.08, 0.55, 0.44)",
          }}
        >
          {/* Circular Counterweight below pivot */}
          <div className="absolute -bottom-4 -left-[3px] w-2 h-2 rounded-full bg-emerald-400" />
        </div>

        {/* Center Pivot Metallic Pin */}
        <div className="w-3.5 h-3.5 rounded-full bg-neutral-100 border-2 border-emerald-500 shadow-md z-20" />
      </div>

      {/* Digital Time Readout */}
      <div className="mt-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-wider">
          {formattedDigital}
        </h2>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-300">
          <span className="text-emerald-400 font-bold">{timezone.split("/").pop().replace("_", " ")}</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400">Market Sync</span>
        </div>
      </div>
    </div>
  );
}
