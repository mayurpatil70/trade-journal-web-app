import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import {
  Save,
  X,
  Brain,
  Image as ImageIcon,
  Target,
  TrendingUp,
  Loader2,
  CheckCircle,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Activity,
  Check,
  UploadCloud,
  Briefcase,
  Plus,
  AlertCircle,
  Calculator,
} from "lucide-react";
import {
  DEFAULT_ACCOUNT_BALANCE,
  BALANCE_PRESETS,
  LOT_PRESETS,
  RISK_PERCENT_PRESETS,
  getAssetMultiplier,
  calculateStopDistance,
  calculateCashRisk,
  calculateRiskPercent,
  calculateLotSize,
} from "../utils/lotSizeCalculator.js";

export default function AddTrade() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editTradeId = searchParams.get("edit");
  const isEditing = Boolean(editTradeId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  // Account management
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [accountInputMode, setAccountInputMode] = useState("select"); // 'select' | 'new'
  const [newAccountName, setNewAccountName] = useState("");

  const assets = ["XAUUSD", "BTCUSD", "ETHUSD", "XAGUSD", "Other"];
  const setups = [
    "FVG",
    "SMC",
    "Liquidity Sweep",
    "Order Block",
    "Breakout",
    "Pullback",
    "Other",
  ];
  const emotions = [
    "Calm",
    "Confident",
    "Focused",
    "Neutral",
    "Excited",
    "FOMO",
    "Anxious",
    "Fearful",
    "Revenge",
    "Impatient",
    "Greedy",
    "Tired",
    "Frustrated",
    "Overconfident",
    "Other",
  ];

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    asset: location?.state?.asset || "XAUUSD",
    direction: location?.state?.direction || "LONG",
    session: "London",
    setup: "FVG",
    entry: "",
    sl: "",
    tp: "",
    lotSize: "",
    risk: "1.00",
    result: "win",
    rMultiple: "",
    r_multiple: "",
    ruleBreak: "no",
    reason: "",
    lesson: "",
    emotionBefore: "",
    emotionAfter: "",
    psychNote: "",
    accountName: "",
  });

  const [accountBalance, setAccountBalance] = useState(() => {
    const saved = localStorage.getItem("journal_account_balance");
    return saved && Number(saved) > 0 ? Number(saved) : DEFAULT_ACCOUNT_BALANCE;
  });

  const [customFields, setCustomFields] = useState({});
  const [images, setImages] = useState([null, null]);

  // Real-time R:R Calculations
  const [calcRR, setCalcRR] = useState(0);

  // Fetch existing accounts from user's trades
  useEffect(() => {
    const fetchAccounts = async () => {
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return;
      try {
        const res = await api.get(`/api/trades?userId=${userId}`);
        const trades = res.data?.data || [];
        const names = new Set();
        trades.forEach((t) => {
          if (
            t.account_name &&
            t.account_name.trim() &&
            t.account_name !== "Default Account"
          ) {
            names.add(t.account_name.trim());
          }
        });
        const accountList = Array.from(names).sort();
        setExistingAccounts(accountList);
        if (accountList.length > 0) {
          setAccountInputMode("select");
          setFormData((prev) => ({ ...prev, accountName: accountList[0] }));
        } else {
          setAccountInputMode("new");
        }
      } catch (e) {
        setAccountInputMode("new");
      }
    };
    fetchAccounts();
  }, []);

  // Fetch trade data when editing an existing trade
  useEffect(() => {
    if (!editTradeId) return;
    const fetchTradeToEdit = async () => {
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("userEmail");
      if (!userId) return;
      try {
        const res = await api.get(`/api/trades?userId=${userId}`);
        const trades = res.data?.data || [];
        const t = trades.find((x) => x.id === editTradeId);
        if (t) {
          const resResult = (t.result || "win").toLowerCase();
          const rVal = t.r_multiple !== null && t.r_multiple !== undefined ? String(t.r_multiple) : "";
          setFormData({
            date: t.date || new Date().toISOString().slice(0, 10),
            time: t.time || "12:00",
            asset: t.asset || "XAUUSD",
            direction: t.direction || "LONG",
            session: t.session || "London",
            setup: t.setup || "FVG",
            entry: t.entry !== null && t.entry !== undefined ? String(t.entry) : "",
            sl: t.sl !== null && t.sl !== undefined ? String(t.sl) : "",
            tp: t.tp !== null && t.tp !== undefined ? String(t.tp) : "",
            lotSize:
              t.lot_size !== null && t.lot_size !== undefined
                ? String(t.lot_size)
                : t.executions?.[0]?.lot_size !== null && t.executions?.[0]?.lot_size !== undefined
                ? String(t.executions[0].lot_size)
                : "",
            risk:
              t.risk !== null && t.risk !== undefined
                ? Number.isInteger(Number(t.risk))
                  ? String(t.risk)
                  : Number(t.risk).toFixed(2)
                : "1.00",
            result: resResult,
            rMultiple: rVal,
            r_multiple: rVal,
            ruleBreak: t.rule_break || "no",
            reason: t.reason || "",
            lesson: t.lesson || "",
            emotionBefore: t.emotion_before || "",
            emotionAfter: t.emotion_after || "",
            psychNote: t.psych_note || "",
            accountName: t.account_name || "",
          });
          if (t.account_name) {
            setAccountInputMode("select");
          }
        }
      } catch (err) {
        console.error("Failed to load trade for editing:", err);
      }
    };
    fetchTradeToEdit();
  }, [editTradeId]);

  // Auto-detect account balance from account name if present
  useEffect(() => {
    if (!formData.accountName) return;
    const lower = formData.accountName.toLowerCase();
    let detected = null;
    if (lower.includes("200k") || lower.includes("200000")) detected = 200000;
    else if (lower.includes("100k") || lower.includes("100000")) detected = 100000;
    else if (lower.includes("50k") || lower.includes("50000")) detected = 50000;
    else if (lower.includes("25k") || lower.includes("25000")) detected = 25000;
    else if (lower.includes("10k") || lower.includes("10000")) detected = 10000;
    else if (lower.includes("5k") || lower.includes("5000")) detected = 5000;

    if (detected && detected !== accountBalance) {
      setAccountBalance(detected);
    }
  }, [formData.accountName]);

  const handleBalanceChange = (newBal) => {
    const val = Number(newBal);
    if (!val || val <= 0) return;
    setAccountBalance(val);
    try {
      localStorage.setItem("journal_account_balance", String(val));
    } catch (e) {}

    // Recalculate risk % if lot size is present
    const activeAsset =
      formData.asset === "Other" && customFields.asset
        ? customFields.asset
        : formData.asset;
    if (
      formData.lotSize &&
      formData.entry &&
      formData.sl &&
      !Number.isNaN(Number(formData.entry)) &&
      !Number.isNaN(Number(formData.sl))
    ) {
      const calcRisk = calculateRiskPercent({
        asset: activeAsset,
        entry: formData.entry,
        sl: formData.sl,
        lotSize: formData.lotSize,
        balance: val,
      });
      if (calcRisk !== null) {
        setFormData((p) => ({ ...p, risk: calcRisk.toFixed(2) }));
      }
    } else if (
      formData.risk &&
      formData.entry &&
      formData.sl &&
      !Number.isNaN(Number(formData.entry)) &&
      !Number.isNaN(Number(formData.sl))
    ) {
      const calcLots = calculateLotSize({
        asset: activeAsset,
        entry: formData.entry,
        sl: formData.sl,
        riskPercent: formData.risk,
        balance: val,
      });
      if (calcLots !== null) {
        setFormData((p) => ({ ...p, lotSize: String(calcLots) }));
      }
    }
  };

  const stopDist = useMemo(() => {
    return calculateStopDistance(formData.entry, formData.sl);
  }, [formData.entry, formData.sl]);

  const activeAssetSymbol = useMemo(() => {
    return formData.asset === "Other" && customFields.asset
      ? customFields.asset
      : formData.asset;
  }, [formData.asset, customFields.asset]);

  const cashRisk = useMemo(() => {
    return calculateCashRisk({
      asset: activeAssetSymbol,
      entry: formData.entry,
      sl: formData.sl,
      lotSize: formData.lotSize,
    });
  }, [activeAssetSymbol, formData.entry, formData.sl, formData.lotSize]);

  const assetMultiplier = useMemo(() => {
    return getAssetMultiplier(activeAssetSymbol, formData.entry);
  }, [activeAssetSymbol, formData.entry]);

  useEffect(() => {
    if (formData.entry && formData.sl && formData.tp) {
      const entry = parseFloat(formData.entry);
      const sl = parseFloat(formData.sl);
      const tp = parseFloat(formData.tp);
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      if (risk > 0) {
        setCalcRR((reward / risk).toFixed(2));
      } else {
        setCalcRR(0);
      }
    }
  }, [formData.entry, formData.sl, formData.tp]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      const currentAsset =
        updated.asset === "Other" && customFields.asset
          ? customFields.asset
          : updated.asset;

      if (name === "rMultiple" || name === "r_multiple") {
        let val = value;
        // If result is loss and user typed a positive number, keep negative formatting
        if (updated.result === "loss" && val && Number(val) > 0) {
          val = `-${val}`;
        }
        updated.rMultiple = val;
        updated.r_multiple = val;
      }

      // If user is editing lot size, calculate risk % automatically
      if (name === "lotSize") {
        updated.lotSize = value;
        if (
          value &&
          updated.entry &&
          updated.sl &&
          !Number.isNaN(Number(updated.entry)) &&
          !Number.isNaN(Number(updated.sl))
        ) {
          const calcRisk = calculateRiskPercent({
            asset: currentAsset,
            entry: updated.entry,
            sl: updated.sl,
            lotSize: value,
            balance: accountBalance,
          });
          if (calcRisk !== null) {
            updated.risk = calcRisk.toFixed(2);
          }
        }
      }

      // If user is editing risk %, calculate lot size automatically
      if (name === "risk") {
        updated.risk = value;
        if (
          value &&
          updated.entry &&
          updated.sl &&
          !Number.isNaN(Number(updated.entry)) &&
          !Number.isNaN(Number(updated.sl))
        ) {
          const calcLots = calculateLotSize({
            asset: currentAsset,
            entry: updated.entry,
            sl: updated.sl,
            riskPercent: value,
            balance: accountBalance,
          });
          if (calcLots !== null) {
            updated.lotSize = String(calcLots);
          }
        }
      }

      if (["entry", "sl", "tp", "direction", "asset"].includes(name)) {
        const entry =
          name === "entry" ? Number(value) : Number(updated.entry || 0);
        const sl = name === "sl" ? Number(value) : Number(updated.sl || 0);
        const tp = name === "tp" ? Number(value) : Number(updated.tp || 0);
        const direction = name === "direction" ? value : updated.direction;
        const assetForCalc =
          name === "asset"
            ? value === "Other" && customFields.asset
              ? customFields.asset
              : value
            : currentAsset;

        // Recalculate Risk % if lot size is filled
        if (
          updated.lotSize &&
          !Number.isNaN(entry) &&
          !Number.isNaN(sl) &&
          entry > 0 &&
          sl > 0
        ) {
          const calcRisk = calculateRiskPercent({
            asset: assetForCalc,
            entry,
            sl,
            lotSize: updated.lotSize,
            balance: accountBalance,
          });
          if (calcRisk !== null) {
            updated.risk = calcRisk.toFixed(2);
          }
        } else if (
          updated.risk &&
          !Number.isNaN(entry) &&
          !Number.isNaN(sl) &&
          entry > 0 &&
          sl > 0
        ) {
          // If risk % is filled but not lot size, calculate lot size
          const calcLots = calculateLotSize({
            asset: assetForCalc,
            entry,
            sl,
            riskPercent: updated.risk,
            balance: accountBalance,
          });
          if (calcLots !== null) {
            updated.lotSize = String(calcLots);
          }
        }

        if (
          !Number.isNaN(entry) &&
          !Number.isNaN(sl) &&
          !Number.isNaN(tp) &&
          entry !== 0 &&
          sl !== entry
        ) {
          const rMultipleVal =
            direction === "SHORT"
              ? (entry - tp) / (sl - entry)
              : (tp - entry) / (entry - sl);

          if (Number.isFinite(rMultipleVal)) {
            if (updated.result === "win") {
              updated.rMultiple = rMultipleVal.toFixed(2);
              updated.r_multiple = rMultipleVal.toFixed(2);
            } else if (updated.result === "loss") {
              if (!updated.rMultiple || Number(updated.rMultiple) >= 0) {
                updated.rMultiple = "-1.00";
                updated.r_multiple = "-1.00";
              }
            } else if (updated.result === "be") {
              updated.rMultiple = "0.00";
              updated.r_multiple = "0.00";
            }
          }
        }
      }

      return updated;
    });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (name === "rMultiple" && fieldErrors.r_multiple) {
      setFieldErrors((prev) => ({ ...prev, r_multiple: null }));
    }
  };

  const handleCustomChange = (e) =>
    setCustomFields({ ...customFields, [e.target.name]: e.target.value });

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const newImages = [...images];
      newImages[index] = file;
      setImages(newImages);
    }
  };

  // Resolve final account name
  const resolvedAccountName =
    accountInputMode === "new"
      ? newAccountName.trim() || "Default Account"
      : formData.accountName || existingAccounts[0] || "Default Account";

  const validateStep = (s) => {
    const errors = {};
    if (s === 1) {
      const acc =
        accountInputMode === "new"
          ? newAccountName
          : formData.accountName || resolvedAccountName;
      if (!acc || !acc.trim()) {
        errors.account_name = "Trading account is required";
      }
      if (
        !formData.asset?.trim() ||
        (formData.asset === "Other" && !customFields.asset?.trim())
      ) {
        errors.asset = "Asset/pair is required";
      }
      if (!formData.direction) errors.direction = "Direction is required";
      if (!formData.date) errors.date = "Date is required";
      if (!formData.session) errors.session = "Session is required";
    }
    if (s === 2) {
      if (!formData.entry) errors.entry = "Entry price is required";
      if (!formData.sl) errors.sl = "Stop loss is required";
      if (!formData.result) errors.result = "Result is required";
      const rVal =
        formData.r_multiple !== undefined && formData.r_multiple !== ""
          ? formData.r_multiple
          : formData.rMultiple;
      if (!rVal && rVal !== 0 && rVal !== "0") {
        errors.r_multiple = "R-multiple is required";
      }
    }
    if (s === 3) {
      const setupValue =
        formData.setup === "Other" ? customFields.setup : formData.setup;
      if (!setupValue || !String(setupValue).trim()) {
        errors.setup = "Setup is required";
      }
    }
    if (s === 4) {
      if (!formData.emotionBefore)
        errors.emotionBefore = "Emotion before trade is required";
      if (!formData.emotionAfter)
        errors.emotionAfter = "Emotion after trade is required";
      if (!formData.psychNote || !String(formData.psychNote).trim()) {
        errors.psychNote = "Psychology notes are required";
      }
    }
    if (s === 5) {
      if (!formData.reason || !String(formData.reason).trim()) {
        errors.reason = "Trade analysis is required";
      }
      if (!formData.lesson || !String(formData.lesson).trim()) {
        errors.lesson = "Lessons are required";
      }
    }
    return errors;
  };

  const handleContinue = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    nextStep();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step !== 6) {
      handleContinue();
      return;
    }

    const s1Errors = validateStep(1);
    const s2Errors = validateStep(2);
    const allErrors = { ...s1Errors, ...s2Errors };
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      if (Object.keys(s1Errors).length > 0) setStep(1);
      else if (Object.keys(s2Errors).length > 0) setStep(2);
      alert("Please fill in all mandatory fields before submitting.");
      return;
    }

    if (!isEditing && (!images[0] || !images[1])) {
      alert("Please upload both Before and After chart images before saving.");
      return;
    }

    setIsSubmitting(true);

    const userId =
      localStorage.getItem("userId") || localStorage.getItem("userEmail");
    if (!userId) {
      alert("Session expired. Please log in again.");
      setIsSubmitting(false);
      return navigate("/login");
    }

    try {
      const submitData = new FormData();
      submitData.append("userId", userId);
      submitData.append("accountName", resolvedAccountName);
      Object.keys(formData).forEach((key) => {
        if (key === "accountName") return; // already appended above
        const val =
          formData[key] === "Other" && customFields[key]
            ? customFields[key]
            : formData[key];
        submitData.append(key, val);
      });
      images.forEach((img) => {
        if (img) submitData.append("images", img);
      });

      if (isEditing) {
        await api.put(`/api/trades/${editTradeId}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/trades", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      navigate("/trades");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to save trade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const steps = [
    { num: 1, title: "Market" },
    { num: 2, title: "Execution" },
    { num: 3, title: "Setup" },
    { num: 4, title: "Psychology" },
    { num: 5, title: "Review" },
    { num: 6, title: "Evidence" },
  ];

  const inputClass =
    "w-full bg-[#15181D] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[15px] transition-all";
  const selectClass =
    "appearance-none w-full bg-[#15181D] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[15px] transition-all pr-10 cursor-pointer";
  const textareaClass =
    "w-full min-h-[120px] bg-[#15181D] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-[15px] resize-y transition-all";
  const labelClass =
    "text-[12px] font-semibold text-gray-400 mb-2 block uppercase tracking-wider";

  return (
    <div className="w-full max-w-4xl mx-auto font-sans pb-24 px-4 md:px-8 mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" /> {isEditing ? "Edit Trade" : "Log Trade"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? "Update your trade parameters and outcome." : "Capture your edge efficiently."}
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/5 z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-emerald-500 z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / 5) * 100}%` }}
        ></div>

        {steps.map((s) => (
          <div
            key={s.num}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${step >= s.num ? "bg-emerald-500 text-white" : "bg-[#15181D] border border-white/10 text-gray-500"}`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest absolute -bottom-6 whitespace-nowrap font-semibold ${step >= s.num ? "text-emerald-400" : "text-gray-600"}`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* FORM CONTAINER */}
      <div className="bg-[#101216] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[400px]">
        {/* INLINE VALIDATION ALERT */}
        {Object.keys(fieldErrors).some((k) => fieldErrors[k]) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-bold">Please complete all mandatory fields:</p>
              <p className="text-[11px] text-red-300/80 mt-0.5">
                {Object.values(fieldErrors).filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10">
          {/* STEP 1: MARKET */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">
                Market Context
              </h2>

              {/* ── ACCOUNT SELECTOR (above Asset/Pair) ── */}
              <div className="bg-[#0A0B0D] border border-emerald-500/15 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                  </div>
                  <label className="text-[13px] font-semibold text-white">
                    Trading Account <span className="text-red-400">*</span>
                  </label>
                </div>

                {existingAccounts.length === 0 || accountInputMode === "new" ? (
                  // No existing accounts — show text input
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. FTMO Challenge, Personal Account..."
                        value={newAccountName}
                        onChange={(e) => {
                          setNewAccountName(e.target.value);
                          if (fieldErrors.account_name) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              account_name: null,
                            }));
                          }
                        }}
                        className={`${inputClass} ${fieldErrors.account_name ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                      />
                    </div>
                    {fieldErrors.account_name && (
                      <p className="text-red-400 text-xs mt-1">
                        {fieldErrors.account_name}
                      </p>
                    )}
                    {existingAccounts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAccountInputMode("select")}
                        className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        ← Back to existing accounts
                      </button>
                    )}
                    <p className="text-[11px] text-gray-500 mt-2">
                      Enter a name to identify this trading account.
                    </p>
                  </div>
                ) : (
                  // Has existing accounts — show dropdown
                  <div>
                    <div className="relative">
                      <select
                        value={formData.accountName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            accountName: e.target.value,
                          });
                          if (fieldErrors.account_name) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              account_name: null,
                            }));
                          }
                        }}
                        className={`${selectClass} ${fieldErrors.account_name ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                      >
                        {existingAccounts.map((acc) => (
                          <option
                            key={acc}
                            value={acc}
                            className="bg-[#15181D] text-white"
                          >
                            {acc}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {fieldErrors.account_name && (
                      <p className="text-red-400 text-xs mt-1">
                        {fieldErrors.account_name}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountInputMode("new");
                        setNewAccountName("");
                      }}
                      className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/20 px-3 py-1.5 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10"
                    >
                      <Plus className="w-3 h-3" /> Add New Account
                    </button>
                  </div>
                )}
              </div>

              {/* Asset & Direction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    Asset / Pair <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="asset"
                      value={formData.asset}
                      onChange={handleChange}
                      className={`${selectClass} ${fieldErrors.asset ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                    >
                      {assets.map((a) => (
                        <option
                          key={a}
                          value={a}
                          className="bg-[#15181D] text-white"
                        >
                          {a}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {fieldErrors.asset && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.asset}
                    </p>
                  )}
                  {formData.asset === "Other" && (
                    <input
                      type="text"
                      name="asset"
                      placeholder="Custom asset"
                      value={customFields.asset || ""}
                      onChange={handleCustomChange}
                      className={`${inputClass} mt-3`}
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    Direction <span className="text-red-400">*</span>
                  </label>
                  <div
                    className={`flex gap-3 p-0.5 rounded-xl ${fieldErrors.direction ? "border border-red-500 ring-1 ring-red-500" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, direction: "LONG" });
                        if (fieldErrors.direction) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            direction: null,
                          }));
                        }
                      }}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.direction === "LONG" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      LONG ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, direction: "SHORT" });
                        if (fieldErrors.direction) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            direction: null,
                          }));
                        }
                      }}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.direction === "SHORT" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      SHORT ▼
                    </button>
                  </div>
                  {fieldErrors.direction && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.direction}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    Session <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="session"
                      value={formData.session}
                      onChange={handleChange}
                      className={`${selectClass} ${fieldErrors.session ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                    >
                      {["London", "New York", "Asian", "Sydney", "Other"].map(
                        (s) => (
                          <option
                            key={s}
                            value={s}
                            className="bg-[#15181D] text-white"
                          >
                            {s}
                          </option>
                        ),
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {fieldErrors.session && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.session}
                    </p>
                  )}
                </div>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className={`${inputClass} dark:[color-scheme:dark] [color-scheme:light] ${fieldErrors.date ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                      required
                    />
                    {fieldErrors.date && (
                      <p className="text-red-400 text-xs mt-1">
                        {fieldErrors.date}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={`${inputClass} dark:[color-scheme:dark] [color-scheme:light]`}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXECUTION & VISUALIZATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">
                Execution Parameters
              </h2>

              {/* Real-time Visualization */}
              <div className="bg-[#15181D] border border-white/5 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                    Trade Architecture
                  </span>
                  {calcRR > 0 && (
                    <span className="text-sm font-bold text-emerald-400">
                      1 : {calcRR} R:R
                    </span>
                  )}
                </div>

                <div className="relative h-20 flex flex-col justify-center">
                  <div className="w-full flex items-center">
                    {formData.direction === "LONG" ? (
                      <>
                        <div className="w-1/4 flex flex-col items-center">
                          <span className="text-[10px] text-red-400 mb-1 block">
                            STOP LOSS
                          </span>
                          <div className="w-full h-1 bg-red-500/50 rounded-l-full relative">
                            <div className="w-2 h-2 rounded-full bg-red-400 absolute right-0 top-1/2 -translate-y-1/2"></div>
                          </div>
                          <span className="text-xs text-gray-300 mt-1">
                            {formData.sl || "---"}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center border-l-2 border-white/20">
                          <span className="text-[10px] text-gray-400 mb-1 block">
                            ENTRY
                          </span>
                          <div className="w-full h-1 bg-white/20"></div>
                          <span className="text-xs text-white mt-1 font-bold">
                            {formData.entry || "---"}
                          </span>
                        </div>
                        <div className="w-1/2 flex flex-col items-center">
                          <span className="text-[10px] text-emerald-400 mb-1 block">
                            TAKE PROFIT
                          </span>
                          <div className="w-full h-1 bg-emerald-500/50 rounded-r-full relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 absolute left-0 top-1/2 -translate-y-1/2"></div>
                          </div>
                          <span className="text-xs text-gray-300 mt-1">
                            {formData.tp || "---"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-1/2 flex flex-col items-center">
                          <span className="text-[10px] text-emerald-400 mb-1 block">
                            TAKE PROFIT
                          </span>
                          <div className="w-full h-1 bg-emerald-500/50 rounded-l-full relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 absolute right-0 top-1/2 -translate-y-1/2"></div>
                          </div>
                          <span className="text-xs text-gray-300 mt-1">
                            {formData.tp || "---"}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center border-r-2 border-white/20">
                          <span className="text-[10px] text-gray-400 mb-1 block">
                            ENTRY
                          </span>
                          <div className="w-full h-1 bg-white/20"></div>
                          <span className="text-xs text-white mt-1 font-bold">
                            {formData.entry || "---"}
                          </span>
                        </div>
                        <div className="w-1/4 flex flex-col items-center">
                          <span className="text-[10px] text-red-400 mb-1 block">
                            STOP LOSS
                          </span>
                          <div className="w-full h-1 bg-red-500/50 rounded-r-full relative">
                            <div className="w-2 h-2 rounded-full bg-red-400 absolute left-0 top-1/2 -translate-y-1/2"></div>
                          </div>
                          <span className="text-xs text-gray-300 mt-1">
                            {formData.sl || "---"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 1: Price Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>
                    Entry Price <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="entry"
                    value={formData.entry}
                    onChange={handleChange}
                    className={`${inputClass} ${fieldErrors.entry ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                    placeholder="0.00"
                  />
                  {fieldErrors.entry && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.entry}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
                      Stop Loss <span className="text-red-400">*</span>
                    </label>
                    {stopDist > 0 && (
                      <span className="text-[11px] text-gray-400 font-mono">
                        ({stopDist.toFixed(2)} pts)
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    name="sl"
                    value={formData.sl}
                    onChange={handleChange}
                    className={`${inputClass} ${fieldErrors.sl ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                    placeholder="0.00"
                  />
                  {fieldErrors.sl && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.sl}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Take Profit</label>
                  <input
                    type="number"
                    step="any"
                    name="tp"
                    value={formData.tp}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Row 2: Lot Size & Risk % */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lot Size Input */}
                <div className="bg-[#15181D]/60 border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Lot Size</span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        position
                      </span>
                    </label>
                    {cashRisk > 0 && (
                      <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                        ${cashRisk.toFixed(2)} Risk
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    name="lotSize"
                    value={formData.lotSize}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. 0.50"
                  />
                  {/* Quick Lot Presets */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    {LOT_PRESETS.map((preset) => {
                      const isSelected =
                        formData.lotSize !== "" &&
                        Number(formData.lotSize) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            const newLots = String(preset);
                            setFormData((p) => {
                              const updated = { ...p, lotSize: newLots };
                              if (
                                updated.entry &&
                                updated.sl &&
                                !Number.isNaN(Number(updated.entry)) &&
                                !Number.isNaN(Number(updated.sl))
                              ) {
                                const calcRisk = calculateRiskPercent({
                                  asset: activeAssetSymbol,
                                  entry: updated.entry,
                                  sl: updated.sl,
                                  lotSize: newLots,
                                  balance: accountBalance,
                                });
                                if (calcRisk !== null) {
                                  updated.risk = calcRisk.toFixed(2);
                                }
                              }
                              return updated;
                            });
                          }}
                          className={`px-2 py-1 text-[11px] rounded font-mono transition-colors border ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold"
                              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {preset}L
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Risk % Input */}
                <div className="bg-[#15181D]/60 border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Risk %</span>
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        account risk
                      </span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-mono">
                      of ${(accountBalance / 1000).toFixed(0)}k balance
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    name="risk"
                    value={formData.risk}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="1.00"
                  />
                  {/* Quick Risk Presets */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    {RISK_PERCENT_PRESETS.map((preset) => {
                      const isSelected =
                        formData.risk !== "" &&
                        Number(formData.risk) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            const newRisk = preset.toFixed(2);
                            setFormData((p) => {
                              const updated = { ...p, risk: newRisk };
                              if (
                                updated.entry &&
                                updated.sl &&
                                !Number.isNaN(Number(updated.entry)) &&
                                !Number.isNaN(Number(updated.sl))
                              ) {
                                const calcLots = calculateLotSize({
                                  asset: activeAssetSymbol,
                                  entry: updated.entry,
                                  sl: updated.sl,
                                  riskPercent: newRisk,
                                  balance: accountBalance,
                                });
                                if (calcLots !== null) {
                                  updated.lotSize = String(calcLots);
                                }
                              }
                              return updated;
                            });
                          }}
                          className={`px-2 py-1 text-[11px] rounded font-mono transition-colors border ${
                            isSelected
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/40 font-semibold"
                              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {preset.toFixed(2)}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lot Size & Risk Calculator Panel */}
              <div className="bg-[#121418] border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">
                        Lot Size & Risk Calculator
                      </span>
                      <span className="ml-2 text-[10px] text-gray-400 font-mono">
                        ({formData.asset} • {assetMultiplier >= 1000 ? `$${assetMultiplier.toLocaleString()}/pt` : `$${assetMultiplier}/pt`} per lot)
                      </span>
                    </div>
                  </div>

                  {/* Account Balance Config */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-gray-400 font-mono">Account Balance:</span>
                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                      <span className="text-xs text-gray-500">$</span>
                      <input
                        type="number"
                        value={accountBalance}
                        onChange={(e) => handleBalanceChange(Number(e.target.value))}
                        className="w-20 bg-transparent text-xs font-mono font-bold text-white outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {BALANCE_PRESETS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleBalanceChange(b)}
                          className={`px-1.5 py-0.5 text-[10px] rounded font-mono transition-colors border ${
                            accountBalance === b
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                              : "bg-white/5 text-gray-500 border-white/10 hover:text-white"
                          }`}
                        >
                          ${b / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Sizing Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">SL Distance</p>
                    <p className="text-xs font-bold text-white font-mono mt-0.5">
                      {stopDist > 0 ? `${stopDist.toFixed(2)} pts` : "—"}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Dollar Risk</p>
                    <p className="text-xs font-bold text-red-400 font-mono mt-0.5">
                      {cashRisk > 0 ? `$${cashRisk.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Calculated Lot</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {formData.lotSize ? `${formData.lotSize} lots` : "—"}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Account Risk %</p>
                    <p className="text-xs font-bold text-blue-400 font-mono mt-0.5">
                      {formData.risk ? `${Number(formData.risk).toFixed(2)}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trade Result & R-Multiple */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className={labelClass}>
                    Trade Result <span className="text-red-400">*</span>
                  </label>
                  <div
                    className={`flex gap-2 p-1 rounded-xl ${fieldErrors.result ? "border border-red-500 ring-1 ring-red-500" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const targetR =
                          calcRR > 0
                            ? Number(calcRR).toFixed(2)
                            : formData.rMultiple && Number(formData.rMultiple) > 0
                            ? formData.rMultiple
                            : "1.00";
                        setFormData((prev) => ({
                          ...prev,
                          result: "win",
                          rMultiple: targetR,
                          r_multiple: targetR,
                        }));
                        if (fieldErrors.result) {
                          setFieldErrors((prev) => ({ ...prev, result: null }));
                        }
                      }}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.result === "win" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      WIN ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const lossR =
                          formData.rMultiple && Number(formData.rMultiple) < 0
                            ? formData.rMultiple
                            : "-1.00";
                        setFormData((prev) => ({
                          ...prev,
                          result: "loss",
                          rMultiple: lossR,
                          r_multiple: lossR,
                        }));
                        if (fieldErrors.result) {
                          setFieldErrors((prev) => ({ ...prev, result: null }));
                        }
                      }}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.result === "loss" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      LOSS ✗
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          result: "be",
                          rMultiple: "0.00",
                          r_multiple: "0.00",
                        }));
                        if (fieldErrors.result) {
                          setFieldErrors((prev) => ({ ...prev, result: null }));
                        }
                      }}
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.result === "be" ? "bg-gray-500/20 border-gray-500/50 text-gray-300" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      BE —
                    </button>
                  </div>
                  {fieldErrors.result && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.result}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass}>
                      Net R-Multiple <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {formData.result === "loss" && "(Loss: -1R or custom)"}
                      {formData.result === "win" && calcRR > 0 && `(Target: +${calcRR}R)`}
                      {formData.result === "be" && "(Break-even: 0R)"}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    name="rMultiple"
                    value={formData.rMultiple}
                    onChange={handleChange}
                    className={`${inputClass} ${fieldErrors.r_multiple ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""} ${formData.result === "loss" ? "text-red-400 font-bold" : formData.result === "win" ? "text-emerald-400 font-bold" : "text-gray-300 font-bold"}`}
                    placeholder={formData.result === "loss" ? "-1.00" : "0.00"}
                  />
                  {/* Preset helpers */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {formData.result === "loss" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, rMultiple: "-1.00", r_multiple: "-1.00" }))}
                          className="px-2.5 py-1 text-[11px] rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-mono transition-colors"
                        >
                          -1.00R (Full SL)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, rMultiple: "-0.50", r_multiple: "-0.50" }))}
                          className="px-2.5 py-1 text-[11px] rounded bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 font-mono transition-colors"
                        >
                          -0.50R (Half)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, rMultiple: "-1.50", r_multiple: "-1.50" }))}
                          className="px-2.5 py-1 text-[11px] rounded bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 font-mono transition-colors"
                        >
                          -1.50R (Slippage)
                        </button>
                      </>
                    ) : formData.result === "win" ? (
                      <>
                        {calcRR > 0 && (
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, rMultiple: String(calcRR), r_multiple: String(calcRR) }))}
                            className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-mono transition-colors"
                          >
                            +{calcRR}R (Target TP)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, rMultiple: "1.00", r_multiple: "1.00" }))}
                          className="px-2.5 py-1 text-[11px] rounded bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 font-mono transition-colors"
                        >
                          +1.00R
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, rMultiple: "2.00", r_multiple: "2.00" }))}
                          className="px-2.5 py-1 text-[11px] rounded bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 font-mono transition-colors"
                        >
                          +2.00R
                        </button>
                      </>
                    ) : null}
                  </div>
                  {fieldErrors.r_multiple && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.r_multiple}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SETUP & OUTCOME */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">
                Setup & Outcome
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    Strategy / Setup <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="setup"
                      value={formData.setup}
                      onChange={handleChange}
                      className={`${selectClass} ${fieldErrors.setup ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                    >
                      {setups.map((s) => (
                        <option
                          key={s}
                          value={s}
                          className="bg-[#15181D] text-white"
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {formData.setup === "Other" && (
                    <input
                      type="text"
                      name="setup"
                      placeholder="Custom setup"
                      value={customFields.setup || ""}
                      onChange={handleCustomChange}
                      className={`${inputClass} mt-3`}
                    />
                  )}
                  {fieldErrors.setup && (
                    <p className="text-red-400 text-xs mt-1">
                      {fieldErrors.setup}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Rule Broken?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, ruleBreak: "no" })
                      }
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.ruleBreak === "no" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      Followed Plan
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, ruleBreak: "yes" })
                      }
                      className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-colors border ${formData.ruleBreak === "yes" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-[#15181D] border-white/10 text-gray-500 hover:text-white"}`}
                    >
                      Broke Rule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PSYCHOLOGY */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Psychology Tracker
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["emotionBefore", "emotionAfter"].map((field, idx) => (
                  <div key={field}>
                    <label className={labelClass}>
                      {idx === 0
                        ? "Emotion Before Trade"
                        : "Emotion After Trade"}{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        className={`${selectClass} ${fieldErrors[field] ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                      >
                        <option value="" className="bg-[#15181D] text-white">
                          Select emotion...
                        </option>
                        {emotions.map((e) => (
                          <option
                            key={e}
                            value={e}
                            className="bg-[#15181D] text-white"
                          >
                            {e}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    {formData[field] === "Other" && (
                      <input
                        type="text"
                        name={field}
                        placeholder="Custom emotion"
                        value={customFields[field] || ""}
                        onChange={handleCustomChange}
                        className={`${inputClass} mt-3`}
                      />
                    )}
                    {fieldErrors[field] && (
                      <p className="text-red-400 text-xs mt-1">
                        {fieldErrors[field]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className={labelClass}>
                  Psychological State / Notes{" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="psychNote"
                  placeholder="What were you feeling during execution? Did you hesitate? Did you move your stop loss early?"
                  value={formData.psychNote}
                  onChange={handleChange}
                  className={`${textareaClass} ${fieldErrors.psychNote ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                />
                {fieldErrors.psychNote && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.psychNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">
                Trade Review
              </h2>
              <div>
                <label className={labelClass}>
                  Why did I take this trade? (Confluence){" "}
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="reason"
                  placeholder="e.g., 15m order block + structural shift on 1m..."
                  value={formData.reason}
                  onChange={handleChange}
                  className={`${textareaClass} ${fieldErrors.reason ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                />
                {fieldErrors.reason && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.reason}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Lessons & Mistakes <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="lesson"
                  placeholder="What went right? What went wrong? What will I do differently?"
                  value={formData.lesson}
                  onChange={handleChange}
                  className={`${textareaClass} ${fieldErrors.lesson ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500" : ""}`}
                />
                {fieldErrors.lesson && (
                  <p className="text-red-400 text-xs mt-1">
                    {fieldErrors.lesson}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: VISUAL EVIDENCE */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold text-white mb-6">
                Visual Evidence
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["Before (Entry Chart)", "After (Exit Chart)"].map(
                  (label, idx) => (
                    <label
                      key={idx}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-emerald-500/50 transition-all cursor-pointer group min-h-[200px] bg-[#15181D]"
                    >
                      {images[idx] ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                          <p className="text-sm font-semibold text-emerald-400 truncate w-full px-4">
                            {images[idx].name}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Click to replace
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6 text-emerald-400" />
                          </div>
                          <p className="text-sm font-semibold text-gray-300 mb-1">
                            {label}
                          </p>
                          <p className="text-[11px] text-gray-500 uppercase tracking-widest">
                            Click to upload
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(idx, e)}
                        className="hidden"
                      />
                    </label>
                  ),
                )}
              </div>
            </div>
          )}

          {/* NAVIGATION FOOTER */}
          <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-0 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="px-8 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || (!isEditing && (!images[0] || !images[1]))}
                className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {isEditing ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {isEditing ? "Update Trade" : "Save Trade"}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
