// frontend/src/pages/LandingPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  TrendingUp,
  Brain,
  ShieldCheck,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Calendar,
  Layers,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const [billingCycle] = useState("lifetime");

  const features = [
    {
      icon: Brain,
      title: "Real-Time AI Psychology Coach",
      description:
        "Detect revenge trading, FOMO, and hesitation before executing. Log emotional states before and after every trade.",
      tag: "Edge Protection",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      icon: ShieldCheck,
      title: "Prop Firm Guardian",
      description:
        "Track daily drawdown, maximum trailing loss, and profit targets automatically across your evaluation phases.",
      tag: "Rule Compliance",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: Calculator,
      title: "Lot Size & Pip Calculator",
      description:
        "Calculate exact position sizing tailored to your account balance, instrument tick value, and strict risk percentage.",
      tag: "Precision Sizing",
      color: "text-[#2f8df4]",
      bg: "bg-[#2f8df4]/10",
      border: "border-[#2f8df4]/20",
    },
    {
      icon: TrendingUp,
      title: "Net R & Distribution Metrics",
      description:
        "Deep-dive analytics on setup win rates, session performance (London vs. NY), and cumulative R-multiples.",
      tag: "Data Driven",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      icon: Layers,
      title: "Hindsight Chart Verification",
      description:
        "Upload before/after execution screenshots to build an undeniable visual archive of your playbook setups.",
      tag: "Visual Journal",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      icon: Calendar,
      title: "Daily Performance Calendar",
      description:
        "Color-coded day-by-day P&L map to visualize consistency, winning streaks, and danger sessions at a glance.",
      tag: "P&L Heatmap",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  const comparisonPoints = [
    {
      metric: "Data Privacy",
      manual: "Shared on Google servers",
      journal: "Encrypted & User-Owned",
    },
    {
      metric: "Execution Tracking",
      manual: "Messy spreadsheet formulas",
      journal: "One-click R-Multiple calculation",
    },
    {
      metric: "Psychology & Emotion",
      manual: "Ignored or forgotten",
      journal: "Built-in AI Pre-Trade Guard",
    },
    {
      metric: "Prop Firm Drawdown",
      manual: "Manual calculation errors",
      journal: "Automated breach threshold alerts",
    },
    {
      metric: "Pricing Model",
      manual: "Monthly subscription ($30-50/mo)",
      journal: "Single $11 USDT Lifetime Payment",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#2f8df4]/30 selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border-b border-white/5 py-2.5 px-4 text-center text-xs font-semibold text-gray-300 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#2f8df4] shrink-0" />
        <span>Forex Notes 2.0 Live — Lifetime Access via On-Chain USDT</span>
        <Link
          to="/login"
          className="text-[#2f8df4] hover:underline inline-flex items-center ml-1"
        >
          Claim Access <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Forex Notes
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a
              href="#comparison"
              className="hover:text-white transition-colors"
            >
              Spreadsheets vs App
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Community
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg bg-[#2f8df4] hover:bg-[#2376e8] text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
            >
              Get Access ($11) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-20 px-4 md:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-gray-300 font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Designed for Funded & Quantitative Forex Traders
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            Stop Bleeding Capital to Emotional Mistakes. <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Master Your Statistical Edge.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-400 leading-relaxed mb-10">
            A purpose-built trading journal that pairs your technical setups
            with an AI psychology monitor, prop firm risk limits, and automated
            position sizing. No subscriptions. Pay once, own it forever.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#2f8df4] hover:bg-[#2376e8] text-white text-sm font-bold shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              Unlock Lifetime Access ($11 USDT)
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-200 text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#5865F2]" />
              Join Trader Discord
            </a>
          </div>

          {/* Institutional UI Preview Card */}
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#121418] p-4 sm:p-6 shadow-2xl shadow-black/80 text-left hover:scale-[1.02] transition-transform duration-500 relative">
            
            {/* Animated Floating Badges */}
            <div className="absolute -left-12 top-10 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl backdrop-blur-md animate-bounce hidden md:block shadow-lg">
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-2"><TrendingUp className="w-3 h-3"/> AI Coach Active</span>
            </div>
            <div className="absolute -right-8 bottom-10 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl backdrop-blur-md animate-pulse hidden md:block shadow-lg">
              <span className="text-blue-400 text-xs font-bold flex items-center gap-2"><Calculator className="w-3 h-3"/> +12.4R This Week</span>
            </div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                <span className="text-gray-500 font-mono ml-2">
                  app.forexnotes.in / dashboard
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                <ShieldCheck className="w-4 h-4" /> Live Guardian Active
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="bg-[#0b131d] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Win Rate
                </span>
                <p className="text-xl font-bold text-white mt-1">68.4%</p>
                <span className="text-[10px] text-emerald-400 font-medium">
                  +4.2% this month
                </span>
              </div>
              <div className="bg-[#0b131d] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Net R Multiple
                </span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  +34.80R
                </p>
                <span className="text-[10px] text-gray-400 font-medium">
                  Avg win: 2.4R
                </span>
              </div>
              <div className="bg-[#0b131d] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Profit Factor
                </span>
                <p className="text-xl font-bold text-white mt-1">2.18</p>
                <span className="text-[10px] text-emerald-400 font-medium">
                  Institutional edge
                </span>
              </div>
              <div className="bg-[#0b131d] p-3 rounded-lg border border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Rule Discipline
                </span>
                <p className="text-xl font-bold text-cyan-400 mt-1">94%</p>
                <span className="text-[10px] text-gray-400 font-medium">
                  Zero revenge trades
                </span>
              </div>
            </div>

            <div className="bg-[#0b131d] p-3.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider text-[10px]">
                  LONG
                </span>
                <span className="font-bold text-white">XAUUSD</span>
                <span className="text-gray-400">
                  London Open Liquidity Sweep
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 font-mono">Risk: 0.5%</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +3.20R
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Features Section */}
      <section
        id="features"
        className="py-24 px-4 md:px-8 border-t border-white/5 bg-[#0b0c0e]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#2f8df4] mb-2 block">
              Core Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Everything Needed to Protect & Scale Your Funding
            </h2>
            <p className="text-sm text-gray-400">
              Traditional spreadsheets don't hold you accountable. Forex Notes
              bridges execution metrics with risk enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-[#121418] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center shrink-0`}
                    >
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#2f8df4] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section
        id="comparison"
        className="py-24 px-4 md:px-8 border-t border-white/5"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-2 block">
              Direct Comparison
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Why Traders Ditch Excel & Notion
            </h2>
            <p className="text-sm text-gray-400">
              Manual spreadsheets slow you down and leave you blind to your
              emotional drawdown points.
            </p>
          </div>

          <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#121418]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#0b131d] text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6 font-bold">Feature / Metric</th>
                  <th className="py-4 px-6 font-bold text-gray-400">
                    Spreadsheets / Notion
                  </th>
                  <th className="py-4 px-6 font-bold text-[#2f8df4]">
                    Forex Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonPoints.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="py-4 px-6 font-bold text-white">
                      {row.metric}
                    </td>
                    <td className="py-4 px-6 text-gray-400">{row.manual}</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{" "}
                      {row.journal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 px-4 md:px-8 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#2f8df4] mb-2 block animate-pulse">
            Trader Testimonials
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Trusted by Funded Traders Worldwide
          </h2>
        </div>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { name: "Alex P.", firm: "Funded $100k", text: "The AI coach literally saved me from a massive tilt yesterday. Best $11 I've ever spent." },
            { name: "Sarah J.", firm: "Funded $300k", text: "Prop firm guardian is a game changer. I never have to manually calculate my daily drawdown limits again." },
            { name: "Mike T.", firm: "Evaluation Phase", text: "The lot size calculator is so fast. Having it right next to my journal helps me execute perfectly." }
          ].map((r, i) => (
            <div key={i} className="bg-[#121418] border border-white/10 rounded-2xl p-6 w-full max-w-sm hover:-translate-y-2 transition-transform duration-300 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {r.name.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white">{r.name}</h4>
                  <p className="text-xs text-emerald-400">{r.firm}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 text-left italic">"{r.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 px-4 md:px-8 border-t border-white/5 bg-[#0b0c0e]"
      >
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#2f8df4] mb-2 block">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
            One Single Payment. Zero Monthly Fees.
          </h2>
          <p className="text-sm text-gray-400 mb-12">
            No recurring credit card charges. Settle securely via on-chain USDT
            and receive lifetime access immediately.
          </p>

          <div className="bg-[#121418] border-2 border-[#2f8df4]/40 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 bg-[#2f8df4] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              Lifetime Pass
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 pb-8 border-b border-white/5">
              <div>
                <h3 className="text-2xl font-black text-white">
                  Full Trader Pro Suite
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Direct access to all current and future updates
                </p>
              </div>
              <div className="mt-4 sm:mt-0 text-left sm:text-right">
                <span className="text-4xl font-black text-white">$11</span>
                <span className="text-sm font-bold text-gray-400 ml-1">
                  USDT
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-emerald-400 font-bold mt-1">
                  One-time payment
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                "Unlimited Trade Logging & Cloud Archive",
                "Automated R-Multiple & P&L Engine",
                "Built-in Lot Size & Pip Sizing Calculator",
                "Prop Firm Guardian Drawdown Monitor",
                "AI Psychology Leak Detection",
                "Interactive Before/After Screenshot Slider",
                "Economic Calendar & News Integration",
                "Private Discord Community Access",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-xs text-gray-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="w-full py-4 rounded-xl bg-[#2f8df4] hover:bg-[#2376e8] text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
              >
                Join Now for $11 USDT
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" /> TRC20 & BEP20 Supported
                </span>
                <span>•</span>
                <span>Instant On-Chain Verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 px-4 md:px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#5865F2]/20 via-[#121418] to-[#121418] border border-[#5865F2]/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#5865F2]/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Join the Official Forex Notes Community
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto mb-8">
            Network with fellow funded traders, share playbook setups, discuss
            daily market outlooks, and get direct technical support.
          </p>
          <a
            href="https://discord.gg/Ajaw3AjfWE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-xl shadow-[#5865F2]/25 transition-all"
          >
            Enter Discord Server <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4 md:px-8 bg-[#0a0a0a] text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#2f8df4]" />
            <span className="font-bold text-gray-300">Forex Notes</span>
            <span className="text-[10px] text-gray-600">
              © {new Date().getFullYear()} All Rights Reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://discord.gg/Ajaw3AjfWE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Discord
            </a>
            <a
              href="https://instagram.com/forexnotes.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

