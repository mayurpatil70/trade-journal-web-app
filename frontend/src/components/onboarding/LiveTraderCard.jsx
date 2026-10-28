export default function LiveTraderCard({
  displayName = "Trader",
  username = "username",
  bio = "",
  avatarUrl = null,
  targetRR = "1:2",
}) {
  const displayInitial = (displayName || username || "T").charAt(0).toUpperCase();
  const cleanUsername = username ? (username.startsWith("@") ? username : `@${username}`) : "@trader";

  return (
    <div className="relative w-full max-w-[420px] mx-auto rounded-3xl bg-white/95 dark:bg-[#0c1017]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-6 overflow-hidden select-none">
      {/* Background ambient radial glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Pill */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300">
          Live Preview
        </span>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          Verified Profile
        </span>
      </div>

      {/* Avatar & Identifiers (Instant render of uploaded image) */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/15">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-white">{displayInitial}</span>
          )}
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0c1017]" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight truncate">
            {displayName.trim() || "Trader Name"}
          </h3>
          <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
            {cleanUsername}
          </p>
        </div>
      </div>

      {/* Bio Box */}
      <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] mb-5 min-h-[72px]">
        <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed italic">
          "{bio.trim() || "Your bio will appear here. Share your style, edge, or the story behind your screen."}"
        </p>
      </div>

      {/* Bottom Stats Strip */}
      <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Trades</span>
          <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 mt-0.5 block">—</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Win Rate</span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">—</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">R : R</span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{targetRR}</span>
        </div>
      </div>
    </div>
  );
}
