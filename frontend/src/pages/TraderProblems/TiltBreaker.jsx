// frontend/src/pages/TraderProblems/TiltBreaker.jsx
import { useState, useEffect } from "react";
import {
  Flame,
  ShieldCheck,
  AlertOctagon,
  HeartPulse,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Play,
  Pause,
  Timer,
  CheckCircle2,
} from "lucide-react";

export default function TiltBreaker() {
  // Lockout parameters
  const [maxLossCount, setMaxLossCount] = useState(2);
  const [todayLossCount, setTodayLossCount] = useState(1);

  // Tilt Diagnostic Questions
  const [q1Revenge, setQ1Revenge] = useState(false); // Want to make back money
  const [q2InPlaybook, setQ2InPlaybook] = useState(true); // Is it in playbook?
  const [q3HeartRate, setQ3HeartRate] = useState("calm"); // 'calm', 'elevated', 'pounding'
  const [q4IncreasedLot, setQ4IncreasedLot] = useState(false); // Increased lot size?

  // Box Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState("Inhale");
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [cyclesRemaining, setCyclesRemaining] = useState(4);

  // Box breathing timer (4s Inhale, 4s Hold, 4s Exhale, 4s Hold)
  useEffect(() => {
    let interval = null;
    if (breathingActive) {
      interval = setInterval(() => {
        setPhaseSeconds((prev) => {
          if (prev > 1) return prev - 1;
          // Phase transition
          setBreathingPhase((curr) => {
            if (curr === "Inhale") return "Hold (Full)";
            if (curr === "Hold (Full)") return "Exhale";
            if (curr === "Exhale") return "Hold (Empty)";
            // Completed 1 full cycle
            setCyclesRemaining((c) => {
              if (c <= 1) {
                setBreathingActive(false);
                return 4;
              }
              return c - 1;
            });
            return "Inhale";
          });
          return 4;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  // Calculate Tilt Score (0 to 100)
  let tiltScore = 10;
  if (q1Revenge) tiltScore += 35;
  if (!q2InPlaybook) tiltScore += 30;
  if (q3HeartRate === "elevated") tiltScore += 15;
  if (q3HeartRate === "pounding") tiltScore += 30;
  if (q4IncreasedLot) tiltScore += 25;
  tiltScore = Math.min(100, tiltScore);

  const isLockoutActive = todayLossCount >= maxLossCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 border border-purple-500/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(168,85,247,0.1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Revenge Trading & Tilt Circuit Breaker
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Psychology Shield
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                90% of account wipeouts happen within 30 minutes of a bad loss. Stop revenge trading with cold biological discipline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <HeartPulse className="w-4 h-4 text-pink-400" />
            <span>Emotional Tilt Detector</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Tilt Diagnostics (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Loss Lockout Enforcer */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-purple-400" />
                Session Loss Lockout Rule
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  isLockoutActive
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isLockoutActive ? "Lockout Enforced" : "Trading Permitted"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">
                  Max Allowed Losses Today
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxLossCount(num)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        maxLossCount === num
                          ? "bg-purple-500 text-white border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                          : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {num} {num === 1 ? "Loss" : "Losses"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 block mb-1">
                  My Losses Logged Today
                </label>
                <div className="flex items-center gap-2">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTodayLossCount(num)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        todayLossCount === num
                          ? "bg-red-500 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
                          : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isLockoutActive && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <span>
                  HARD CIRCUIT BREAKER HIT: You have reached your {maxLossCount}-loss limit. Step away from your charts immediately for 2 hours to avoid account damage.
                </span>
              </div>
            )}
          </div>

          {/* Quick Tilt Test */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-[#121418]/90 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-pink-400" />
              Pre-Trade Emotional Audit
            </h3>

            <div className="space-y-3">
              {/* Question 1 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/5">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Am I feeling an urgent urge to "win back" my previous loss?
                </span>
                <button
                  type="button"
                  onClick={() => setQ1Revenge(!q1Revenge)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    q1Revenge
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10"
                  }`}
                >
                  {q1Revenge ? "YES (Tilted)" : "NO"}
                </button>
              </div>

              {/* Question 2 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/5">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Is this trade setup 100% written in my verified playbook?
                </span>
                <button
                  type="button"
                  onClick={() => setQ2InPlaybook(!q2InPlaybook)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    q2InPlaybook
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-red-500 text-white border-red-500"
                  }`}
                >
                  {q2InPlaybook ? "YES (Disciplined)" : "NO (Gambling)"}
                </button>
              </div>

              {/* Question 3 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/5">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Physical heart rate / nervous system state:
                </span>
                <div className="flex gap-1.5">
                  {["calm", "elevated", "pounding"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setQ3HeartRate(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all border ${
                        q3HeartRate === st
                          ? st === "calm"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4 */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-[#0b131d] border border-gray-200 dark:border-white/5">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Did I increase my lot size above my normal risk plan?
                </span>
                <button
                  type="button"
                  onClick={() => setQ4IncreasedLot(!q4IncreasedLot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    q4IncreasedLot
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10"
                  }`}
                >
                  {q4IncreasedLot ? "YES (Danger)" : "NO"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tilt Gauge & Tactical Breathing Reset (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tilt Score Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#121418] via-[#1a121f] to-[#0c1219] border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.2)] text-white space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Live Psychological Tilt Score
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  tiltScore > 60
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : tiltScore > 30
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {tiltScore > 60 ? "Severe Tilt" : tiltScore > 30 ? "Caution Zone" : "Clear Mind"}
              </span>
            </div>

            <div className="text-center py-2">
              <span
                className={`text-6xl font-black drop-shadow-lg ${
                  tiltScore > 60
                    ? "text-red-400"
                    : tiltScore > 30
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {tiltScore}%
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {tiltScore > 60
                  ? "High probability of emotional execution. Do NOT enter new trades."
                  : tiltScore > 30
                    ? "Mind is mildly unsettled. Take a short pause before trading."
                    : "Optimal psychological condition. Stick to your risk rules."}
              </p>
            </div>

            {/* Tactical Box Breathing Reset */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  Tactical Reset (Box Breathing)
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">
                  {cyclesRemaining} Cycles Remaining
                </span>
              </div>

              {/* Animated Glowing Breathing Visualizer */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center border-4 transition-all duration-1000 ${
                    breathingActive
                      ? breathingPhase === "Inhale"
                        ? "scale-110 border-cyan-400 bg-cyan-500/20 shadow-[0_0_35px_rgba(6,182,212,0.6)]"
                        : breathingPhase === "Hold (Full)"
                          ? "scale-110 border-purple-400 bg-purple-500/20 shadow-[0_0_35px_rgba(168,85,247,0.6)]"
                          : breathingPhase === "Exhale"
                            ? "scale-90 border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            : "scale-90 border-gray-400 bg-white/5"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl font-black text-white block">
                      {breathingActive ? phaseSeconds : "4"}s
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-300">
                      {breathingActive ? breathingPhase : "Ready"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBreathingActive(!breathingActive)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2"
                >
                  {breathingActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause Exercise
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-cyan-400" /> Start 2-Min Reset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
