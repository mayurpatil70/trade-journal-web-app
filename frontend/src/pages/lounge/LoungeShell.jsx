// frontend/src/pages/lounge/LoungeShell.jsx
import { Link, NavLink, Outlet } from "react-router-dom";
import { Trophy, MessageSquareText, MessagesSquare, Gift, Users, UserRound } from "lucide-react";
import { glass } from "../../components/lounge/LoungeUI";
import { useOnlineSet } from "../../lib/socket";
import TraderSearch from "../../components/lounge/TraderSearch";

const TABS = [
  { to: "/lounge", end: true, label: "Leaderboard", icon: Trophy },
  { to: "/lounge/feed", label: "Thought Stream", icon: MessageSquareText },
  { to: "/lounge/chat", label: "Messages", icon: MessagesSquare },
  { to: "/lounge/deals", label: "Partner Deals", icon: Gift },
];

export default function LoungeShell() {
  const online = useOnlineSet();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 pb-28">
      <div className={`${glass} p-5 sm:p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-[#0066FF] dark:text-sky-400 border border-blue-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Traders Lounge</h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Verified rankings, trader thoughts, live chat and partner deals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <TraderSearch />
          <Link
            to={`/lounge/trader/${localStorage.getItem("userId")}`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.07] dark:hover:bg-white/[0.1]"
          >
            <UserRound className="w-4 h-4" /> My profile
          </Link>
        </div>
        </div>

        <div className="mt-5 flex flex-col-reverse md:flex-row md:items-center justify-between gap-3">
          <nav className="-mx-1 flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(({ to, end, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#0066FF] text-white shadow-sm shadow-blue-500/30"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <span className="self-start md:self-auto shrink-0 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            {online.size} trader{online.size === 1 ? "" : "s"} online
          </span>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
