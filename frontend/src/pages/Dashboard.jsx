// frontend/src/pages/Dashboard.jsx
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Activity,
  Target,
  Zap,
  BarChart3,
  Plus,
} from "lucide-react";

export default function Dashboard() {
  const userName = "MAYUR"; // This can later be fetched from Supabase

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Good Morning
          </p>
          <h1 className="text-3xl font-bold text-white uppercase">
            {userName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-gray-800 text-xs px-2 py-1 rounded text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-journalEmerald"></span>
              SYDNEY & TOKYO
            </span>
          </div>
        </div>
        <button className="bg-journalEmerald hover:bg-emerald-400 text-journalDark font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Log Trade
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Setup & Stats) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Setup Checklist */}
          <div className="bg-[#121418] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Set up your journal
              </h2>
              <span className="text-xs font-medium bg-gray-800 text-gray-300 px-2 py-1 rounded">
                0%
              </span>
            </div>
            <div className="space-y-4">
              {[
                {
                  title: "Create your trading account",
                  desc: "Your broker or prop-firm account",
                },
                {
                  title: "Create your first strategy",
                  desc: "Your playbook & edge",
                },
                {
                  title: "Add tags or goals",
                  desc: "Optional - organize later",
                },
                {
                  title: "Journal your first trade",
                  desc: "Start building your edge",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer group"
                >
                  <Circle
                    className="text-gray-600 mt-0.5 group-hover:text-journalEmerald transition-colors"
                    size={20}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.desc}</p>
                  </div>
                  <button className="text-xs font-semibold text-gray-400 bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-700 hover:text-white transition-colors">
                    ADD
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="NET P&L"
              value="$0.00"
              icon={<Activity size={16} />}
            />
            <StatCard
              label="WIN RATE"
              value="0.0%"
              icon={<Target size={16} />}
            />
            <StatCard
              label="PROFIT FACTOR"
              value="0.00"
              icon={<Zap size={16} />}
            />
            <StatCard
              label="TOTAL TRADES"
              value="0"
              icon={<BarChart3 size={16} />}
            />
            <StatCard
              label="AVG RR"
              value="0.0R"
              icon={<TrendingUp size={16} />}
            />
          </div>

          {/* Equity Curve Placeholder */}
          <div className="bg-[#121418] border border-gray-800 rounded-xl p-6 h-64 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-300">
                  Equity Curve
                </h3>
                <p className="text-xs text-gray-600">
                  Portfolio balance over time
                </p>
              </div>
              <select className="bg-gray-800 border-none text-xs text-gray-300 rounded py-1 px-2 outline-none">
                <option>All Time</option>
              </select>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              No equity data yet
            </div>
          </div>
        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-6">
          {/* Trading Health */}
          <div className="bg-[#121418] border border-gray-800 rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[200px]">
            <h3 className="text-sm font-medium text-gray-300 w-full text-left mb-4">
              Trading Health
            </h3>
            <div className="text-4xl font-bold text-red-500 mb-1">
              0<span className="text-lg text-gray-500">/100</span>
            </div>
            <p className="text-xs font-semibold text-red-500 tracking-wider mb-4">
              NO DATA
            </p>
            <div className="w-full flex justify-between text-xs text-gray-500 mt-auto">
              <span>Win Rate</span>
              <span>Risk Mgmt</span>
              <span>Consistency</span>
            </div>
          </div>

          {/* Psychology Summary */}
          <div className="bg-[#121418] border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Psychology Summary
            </h3>
            <div className="border border-red-900/30 bg-red-900/10 rounded-lg p-4 flex flex-col items-center justify-center h-32">
              <span className="text-red-500 text-2xl font-bold mb-1">0</span>
              <span className="text-red-500 text-xs font-semibold uppercase">
                Rated
              </span>
            </div>
          </div>

          {/* Today's Risk */}
          <div className="bg-[#121418] border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              Today's Risk
            </h3>
            <div className="flex justify-between items-end">
              <div>
                <span className="text-2xl font-bold text-white">0.0%</span>
                <p className="text-xs text-gray-500 mt-1">TRADES: 0</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  SAFE
                </span>
                <p className="text-xs text-gray-500 mt-2">REMAINING: 10</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-[#121418] border border-gray-800 rounded-xl p-4 flex flex-col justify-between h-28">
      <div className="flex justify-between items-start text-gray-500">
        <span className="text-xs font-semibold tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="text-xl md:text-2xl font-bold text-white mt-2">
        {value}
      </div>
    </div>
  );
}
