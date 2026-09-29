// frontend/src/pages/ImportTrades.jsx
import { UploadCloud } from "lucide-react";

export default function ImportTrades() {
  return (
    <div
      className="w-full max-w-5xl mx-auto font-sans pb-16 px-4 md:px-8 mt-6 md:mt-8"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-[2px] bg-[#2f8df4]/10 flex items-center justify-center border border-[#2f8df4]/20">
          <UploadCloud className="w-6 h-6 text-[#2f8df4]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
            Import Trades
          </h1>
          <p className="text-sm text-gray-500">
            Bulk import your trade history via CSV or broker statements.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/5 rounded-[2px] p-12 text-center">
        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Import Feature Coming Soon
        </h3>
        <p className="text-sm text-gray-500">
          This section is currently under development.
        </p>
      </div>
    </div>
  );
}
