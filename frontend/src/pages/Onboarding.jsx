import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, X, Sparkles, Check } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import Step1Welcome from "../components/onboarding/Step1Welcome";
import Step2Identity from "../components/onboarding/Step2Identity";
import Step3Discipline from "../components/onboarding/Step3Discipline";
import Step4Preferences from "../components/onboarding/Step4Preferences";
import api from "../api/axios";

const STEPS = [
  { id: 1, key: "WELCOME", label: "01 / 04 — WELCOME", progress: 25 },
  { id: 2, key: "IDENTITY", label: "02 / 04 — IDENTITY", progress: 50 },
  { id: 3, key: "DISCIPLINE", label: "03 / 04 — DISCIPLINE", progress: 75 },
  { id: 4, key: "PREFERENCES", label: "04 / 04 — PREFERENCES", progress: 100 },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail") || "trader";
  const userEmail = localStorage.getItem("userEmail") || "";

  // Step 2: Identity State
  const [displayName, setDisplayName] = useState(() => {
    return userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ") : "Trader";
  });
  const [username, setUsername] = useState(() => {
    return userEmail ? userEmail.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() : "trader";
  });
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Step 3: Discipline State
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(2);
  const [dailyLossCap, setDailyLossCap] = useState(5);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(5);
  const [lossStreakBreak, setLossStreakBreak] = useState(3);
  const [targetRR, setTargetRR] = useState("1:2");
  const [preferredSessions, setPreferredSessions] = useState(["London", "New York"]);
  const [favoritePairs, setFavoritePairs] = useState(["EUR/USD", "XAU/USD", "US30"]);

  // Step 4: Preferences State
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  // Save all setup data to localStorage & backend
  const handleComplete = async (isSkipped = false) => {
    setIsFinishing(true);
    const completedUserId = userId;

    try {
      // 1. Mark onboarding completed
      localStorage.setItem(`onboarding_completed_${completedUserId}`, "true");
      localStorage.setItem("onboarding_completed", "true");

      if (!isSkipped) {
        // 2. Persist profile
        const profileData = {
          displayName,
          username: username.replace(/^@/, ""),
          bio,
          avatarUrl,
        };
        localStorage.setItem(`trader_profile_${completedUserId}`, JSON.stringify(profileData));

        // 3. Persist discipline rules
        const disciplineData = {
          maxRiskPerTrade,
          dailyLossCap,
          maxTradesPerDay,
          lossStreakBreak,
          targetRR,
          preferredSessions,
          favoritePairs,
        };
        localStorage.setItem(`trader_discipline_${completedUserId}`, JSON.stringify(disciplineData));

        // 4. Persist preferences
        const preferencesData = {
          currency,
          timezone,
        };
        localStorage.setItem(`trader_preferences_${completedUserId}`, JSON.stringify(preferencesData));
        localStorage.setItem("display_currency", currency);
        localStorage.setItem("timezone", timezone);
      }
    } catch (err) {
      console.warn("Error saving onboarding details:", err);
    } finally {
      // Smooth route transition directly into the Dashboard
      navigate("/dashboard", { replace: true });
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleComplete(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keyboard Navigation: Enter advances, Escape skips
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in textarea
      if (e.target.tagName === "TEXTAREA") return;

      if (e.key === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleComplete(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, displayName, username, bio, currency, timezone, maxRiskPerTrade]);

  const activeStepConfig = STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      {/* ── AMBIENT BACKGROUND GLOW (macOS / iOS frosted style) ── */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[400px] bg-teal-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* ── TOP PROGRESS BAR (Thin emerald line with animated glow) ── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/[0.06] z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)] transition-all duration-500 ease-out"
          style={{ width: `${activeStepConfig.progress}%` }}
        />
      </div>

      {/* ── TOP HEADER (Logo, Step Indicator, Skip for now Button) ── */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-7 w-auto object-contain" />
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              TradeJournal
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/[0.1]">
            <span className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">
              {activeStepConfig.label}
            </span>
          </div>
        </div>

        {/* Mobile Step Badge */}
        <span className="text-[11px] font-mono font-bold tracking-wider text-neutral-400 sm:hidden">
          {activeStepConfig.label}
        </span>

        {/* Skip for now ✕ Button (Top Right Corner) */}
        <button
          type="button"
          onClick={() => handleComplete(true)}
          className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:bg-white/[0.06] cursor-pointer"
        >
          <span>Skip for now</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* ── MAIN CONTENT AREA (Step views) ── */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-8 flex-1 flex flex-col justify-center my-auto z-10">
        {currentStep === 1 && <Step1Welcome onNext={handleNext} />}
        {currentStep === 2 && (
          <Step2Identity
            displayName={displayName}
            setDisplayName={setDisplayName}
            username={username}
            setUsername={setUsername}
            bio={bio}
            setBio={setBio}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            targetRR={targetRR}
          />
        )}
        {currentStep === 3 && (
          <Step3Discipline
            maxRiskPerTrade={maxRiskPerTrade}
            setMaxRiskPerTrade={setMaxRiskPerTrade}
            dailyLossCap={dailyLossCap}
            setDailyLossCap={setDailyLossCap}
            maxTradesPerDay={maxTradesPerDay}
            setMaxTradesPerDay={setMaxTradesPerDay}
            lossStreakBreak={lossStreakBreak}
            setLossStreakBreak={setLossStreakBreak}
            targetRR={targetRR}
            setTargetRR={setTargetRR}
            preferredSessions={preferredSessions}
            setPreferredSessions={setPreferredSessions}
            favoritePairs={favoritePairs}
            setFavoritePairs={setFavoritePairs}
          />
        )}
        {currentStep === 4 && (
          <Step4Preferences
            currency={currency}
            setCurrency={setCurrency}
            timezone={timezone}
            setTimezone={setTimezone}
          />
        )}
      </main>

      {/* ── BOTTOM STICKY NAVIGATION BAR (Press Enter / Back / Continue) ── */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-5 border-t border-white/[0.06] flex items-center justify-between z-40 bg-[#07090e]/80 backdrop-blur-xl">
        {/* Helper text on Left */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-medium">
          <span>Press</span>
          <kbd className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.12] text-white font-mono text-[10px] font-bold">
            Enter ↵
          </kbd>
          <span>to {currentStep === 4 ? "finish" : "continue"}</span>
        </div>

        {/* Action Buttons on Right */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Begin onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep > 1 && currentStep < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={() => handleComplete(false)}
              disabled={isFinishing}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isFinishing ? "Configuring..." : "Review setup"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
