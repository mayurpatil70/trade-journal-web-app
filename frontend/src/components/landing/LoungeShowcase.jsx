// frontend/src/components/landing/LoungeShowcase.jsx
import { Trophy, MessageSquareText, MessagesSquare, Gift, BadgeCheck, Heart, Repeat2, Hash } from "lucide-react";
import IridescentButton from "./IridescentButton";

const FEATURES = [
  { icon: Trophy, title: "Verified leaderboard", body: "Rankings computed from real journal trades: win rate, PnL, profit factor and discipline." },
  { icon: MessageSquareText, title: "Thought stream", body: "Post setups with $cashtags, before/after charts and WIN/LOSS tags. Like, repost, bookmark." },
  { icon: MessagesSquare, title: "Real-time chat", body: "1-on-1 DMs and live channels with typing indicators, read receipts and online presence." },
  { icon: Gift, title: "Partner deals", body: "Top-ranked traders unlock prop firm discounts and broker perks." },
];

const PODIUM = [
  { name: "Aarav", pnl: "+$18.4k", win: "71%", ring: "from-slate-200 to-slate-500", h: "h-16" },
  { name: "Sofia", pnl: "+$26.9k", win: "78%", ring: "from-amber-300 to-amber-600", h: "h-24" },
  { name: "Kenji", pnl: "+$12.1k", win: "66%", ring: "from-orange-300 to-orange-700", h: "h-12" },
];

function WindowChrome({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-lp/10 bg-lp/[0.04] backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-lp/[0.06]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 text-[11px] font-medium text-lp/50">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function LoungeShowcase() {
  return (
    <section id="lounge" className="relative px-5 pt-24 pb-36 border-t border-lp/[0.06] overflow-hidden" style={{ scrollMarginTop: 90 }}>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(0,122,255,0.14),transparent)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.15fr] gap-12 items-center">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace" }} className="text-[10px] font-extrabold tracking-[0.16em] text-blue-400 mb-3">
            NEW · TRADERS LOUNGE
          </div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif" }} className="text-4xl sm:text-5xl text-lp-heading leading-[1.05]">
            Journal alone. <em className="text-blue-400">Grow together.</em>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-lp/70 max-w-lg">
            Follow consistent traders, share setups in a live thought stream, chat in real time and earn partnership deals from prop firms and brokers as you climb the ranks.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-lp/[0.07] bg-lp/[0.03] p-4">
                <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-400 flex items-center justify-center mb-2.5">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-sm font-semibold text-lp-heading">{title}</p>
                <p className="text-xs text-lp/60 mt-1 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <IridescentButton to="/login" size="md">
              JOIN THE LOUNGE
            </IridescentButton>
          </div>
        </div>

        <div className="relative">
          <WindowChrome title="Traders Lounge · Leaderboard">
            <div className="px-6 pt-6 pb-4 flex items-end justify-center gap-4">
              {PODIUM.map((p) => (
                <div key={p.name} className="flex flex-col items-center gap-2 w-24">
                  <span className={`p-[2px] rounded-full bg-gradient-to-br ${p.ring}`}>
                    <span className="w-11 h-11 rounded-full bg-[var(--lp-bg)] text-lp-heading font-bold flex items-center justify-center">{p.name[0]}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-lp-heading">
                    {p.name} <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">{p.pnl}</span>
                  <span className={`w-full ${p.h} rounded-t-xl bg-gradient-to-b ${p.ring} opacity-25`} />
                </div>
              ))}
            </div>
            <div className="mx-4 mb-4 rounded-xl bg-lp/[0.03] border border-lp/[0.06] p-3.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-lp-heading font-bold flex items-center justify-center">S</span>
                <span className="font-semibold text-lp-heading">Sofia</span>
                <span className="text-lp/40">@sofiafx · 2m</span>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400">WIN</span>
              </div>
              <p className="mt-2 text-[13px] text-lp/80">
                London sweep into the 4H FVG on <span className="text-sky-400 font-semibold">$XAUUSD</span>. Took 3.2R, out before NY open.
              </p>
              <div className="mt-2 flex gap-5 text-lp/40 text-[11px]">
                <span className="inline-flex items-center gap-1 text-pink-400">
                  <Heart className="w-3.5 h-3.5 fill-current" /> 128
                </span>
                <span className="inline-flex items-center gap-1">
                  <Repeat2 className="w-3.5 h-3.5" /> 24
                </span>
              </div>
            </div>
          </WindowChrome>

          <WindowChrome title="#funded-traders" className="mt-4 sm:mt-0 sm:absolute sm:-bottom-28 sm:-left-10 sm:w-72">
            <div className="p-3.5 space-y-2 text-[12.5px]">
              <div className="flex items-center gap-1.5 text-lp/40 text-[10px]">
                <Hash className="w-3 h-3" /> 342 online
              </div>
              <div className="max-w-[85%] px-3 py-1.5 rounded-2xl rounded-bl-md bg-lp/[0.08] text-lp/90">Passed phase 2 today 🎉</div>
              <div className="max-w-[85%] ml-auto px-3 py-1.5 rounded-2xl rounded-br-md bg-[#0066FF] text-lp-heading">Congrats! What was your max DD?</div>
              <span className="inline-flex gap-1 px-3 py-2 rounded-2xl rounded-bl-md bg-lp/[0.08]">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-lp/50 animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />
                ))}
              </span>
            </div>
          </WindowChrome>

          <div
            className="hidden sm:flex absolute -top-6 -right-4 items-center gap-2 rounded-2xl border border-amber-400/25 backdrop-blur-xl px-3.5 py-2.5 shadow-xl"
            style={{ background: "rgba(26, 20, 8, 0.9)" }}
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-lp-heading">
              <strong className="text-amber-300">15% off</strong> 100K challenge
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
