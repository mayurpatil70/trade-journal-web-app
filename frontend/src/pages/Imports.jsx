// frontend/src/pages/ImportTrades.jsx
import { UploadCloud, FileUp, FileText, CheckCircle, ArrowRight } from "lucide-react";

export default function ImportTrades() {
  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10">
          <UploadCloud className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Import Trades
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30">
              Coming Soon
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bulk import your trade history via CSV or broker statements.
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white/60 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl p-12 text-center shadow-xl backdrop-blur-xl mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/10">
          <UploadCloud className="w-10 h-10 text-orange-400" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
          Import Feature Coming Soon
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          We're building a powerful import engine to sync trades from MT4/MT5, cTrader, and CSV exports. Stay tuned!
        </p>
      </div>

      {/* Planned Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: <FileUp className="w-5 h-5" />,
            title: "CSV Upload",
            desc: "Upload any CSV file and map columns to your journal fields.",
            color: "from-blue-500/20 to-cyan-500/20",
            border: "border-blue-500/20",
            text: "text-blue-400",
          },
          {
            icon: <FileText className="w-5 h-5" />,
            title: "MT4 / MT5 Sync",
            desc: "Import directly from your MetaTrader statement history.",
            color: "from-emerald-500/20 to-green-500/20",
            border: "border-emerald-500/20",
            text: "text-emerald-400",
          },
          {
            icon: <CheckCircle className="w-5 h-5" />,
            title: "Auto Tagging",
            desc: "AI automatically tags your setup, session, and psychology.",
            color: "from-violet-500/20 to-purple-500/20",
            border: "border-violet-500/20",
            text: "text-violet-400",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`relative bg-white/60 dark:bg-white/[0.03] border ${card.border} rounded-2xl p-6 shadow-xl backdrop-blur-xl overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-40 rounded-2xl`} />
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} border ${card.border} flex items-center justify-center ${card.text} mb-4`}>
                {card.icon}
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{card.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
