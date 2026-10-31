// frontend/src/App.jsx
import { useEffect, useState, useRef, Suspense } from "react";
import {
  BrowserRouter,
  useLocation,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import api, { isSessionValid, clearSession } from "./api/axios";
import {
  getCachedAccessStatus,
  getImmediateCachedStatus,
} from "./utils/subscriptionCache";
import { markInAppNavigation } from "./utils/navigationState";
import { isOnboardingCompleted } from "./lib/authFlow";
import { safeLazy, registerRoutePrefetch } from "./utils/routePrefetch";
import { useIsAdmin } from "./hooks/useIsAdmin";
import NavigationProgressBar from "./components/NavigationProgressBar";

// CRITICAL: ErrorBoundary MUST be eagerly imported — it cannot be lazy-loaded
// because if it fails to load, there's nothing to catch the error (causes #310 crash loop)
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Logo3DLoader from "./components/Logo3DLoader.jsx";
import CookieConsent from "./components/CookieConsent.jsx";
import FloatingThemeToggle from "./components/FloatingThemeToggle.jsx";

// Public Pages (eagerly loaded for SEO/LCP)
import LandingPage from "./pages/LandingPage.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import NotFound from "./pages/NotFound.jsx";
import { SEO_PAGES } from "./data/seoPages";
const CompetitorVsPage = safeLazy(
  () => import("./pages/CompetitorVsPage.jsx"),
  "competitor-vs",
);
const SeoLandingPage = safeLazy(
  () => import("./pages/SeoLandingPage.jsx"),
  "seo-landing",
);

// Protected Core Workspace Pages (Grouped into 'workspace-core' bundle for 0ms instant tab switches)
const MainLayout = safeLazy(
  () => import("./layouts/MainLayout.jsx"),
  "main-layout",
);
const Dashboard = safeLazy(() => import("./pages/Dashboard.jsx"), "dashboard");
const AddTrade = safeLazy(() => import("./pages/AddTrade.jsx"), "add-trade");
const PastTrades = safeLazy(
  () => import("./pages/PastTrades.jsx"),
  "past-trades",
);
const PerformanceCalendar = safeLazy(
  () => import("./pages/PerformanceCalendar.jsx"),
  "calendar",
);
const PerformanceAnalytics = safeLazy(
  () => import("./pages/PerformanceAnalytics.jsx"),
  "performance-analytics",
);
const TradeAnalysis = safeLazy(
  () => import("./pages/TradeAnalysis.jsx"),
  "trade-analysis",
);
const Analytics = safeLazy(() => import("./pages/Analytics.jsx"), "analytics");
const Psychology = safeLazy(
  () => import("./pages/Psychology.jsx"),
  "psychology",
);
const Mistakes = safeLazy(() => import("./pages/Mistakes.jsx"), "mistakes");
const EconomicCalendar = safeLazy(
  () => import("./pages/EconomicCalendar.jsx"),
  "news",
);
const PropAccounts = safeLazy(
  () => import("./pages/PropAccounts.jsx"),
  "accounts",
);
const Settings = safeLazy(() => import("./pages/Settings.jsx"), "settings");
const Profile = safeLazy(() => import("./pages/Profile.jsx"), "profile");
const Support = safeLazy(() => import("./pages/Support.jsx"), "support");
const AffiliateDashboard = safeLazy(
  () => import("./pages/AffiliateDashboard.jsx"),
  "affiliate",
);
const PropFirm = safeLazy(
  () => import("./pages/TraderProblems/PropFirm.jsx"),
  "prop-firm",
);
const LotSizeCalculator = safeLazy(
  () => import("./pages/TraderProblems/LotSizeCalculator.jsx"),
  "lot-size",
);
const MarketHours = safeLazy(
  () => import("./pages/TraderProblems/MarketHours.jsx"),
  "market-hours",
);
const Tools = safeLazy(() => import("./pages/Tools.jsx"), "tools");
const AICoach = safeLazy(() => import("./pages/AICoach.jsx"), "ai-coach");
const LoungeShell = safeLazy(() => import("./pages/lounge/LoungeShell.jsx"), "lounge");
const LoungeLeaderboard = safeLazy(() => import("./pages/lounge/LoungeLeaderboard.jsx"), "lounge-leaderboard");
const LoungeFeed = safeLazy(() => import("./pages/lounge/LoungeFeed.jsx"), "lounge-feed");
const TradersCommunity = safeLazy(() => import("./pages/community/TradersCommunity.jsx"), "community");
const CommunityInvite = safeLazy(
  () => import("./pages/community/TradersCommunity.jsx").then((m) => ({ default: m.CommunityInvite })),
  "community-invite",
);
const LoungeDeals = safeLazy(() => import("./pages/lounge/LoungeDeals.jsx"), "lounge-deals");
const TraderProfile = safeLazy(() => import("./pages/lounge/TraderProfile.jsx"), "lounge-trader");

// Heavy / Secondary Pages (Prefetched on hover and idle)
const Charts = safeLazy(() => import("./pages/Charts.jsx"), "charts");
const Sessions = safeLazy(() => import("./pages/Sessions.jsx"), "sessions");
const Backtest = safeLazy(() => import("./pages/Backtest.jsx"), "backtest");
const TradingBotDashboard = safeLazy(
  () => import("./features/trading-bot/pages/TradingBotDashboard.jsx"),
  "trading-bot",
);
const BotSetupPage = safeLazy(
  () => import("./features/trading-bot/pages/BotSetupPage.jsx"),
  "bot-setup",
);
const BotHubPage = safeLazy(
  () => import("./features/bot-hub/pages/BotHubPage.jsx"),
  "bot-hub",
);
const ConnectionsPage = safeLazy(
  () => import("./features/bot-hub/pages/ConnectionsPage.jsx"),
  "connections",
);
const Mt5BotPage = safeLazy(
  () => import("./features/bot-hub/pages/Mt5BotPage.jsx"),
  "mt5-bot",
);
const AdminDashboard = safeLazy(
  () => import("./pages/AdminDashboard.jsx"),
  "admin",
);

// Auth and Gate Pages
const Login = safeLazy(() => import("./pages/Login.jsx"), "login");
const Verify = safeLazy(() => import("./pages/Verify.jsx"), "verify");
const DiscordGate = safeLazy(
  () => import("./pages/DiscordGate.jsx"),
  "discord-gate",
);
const DiscordCallback = safeLazy(
  () => import("./pages/DiscordCallback.jsx"),
  "discord-callback",
);
const Paywall = safeLazy(() => import("./pages/Paywall.jsx"), "paywall");
const Onboarding = safeLazy(
  () => import("./pages/Onboarding.jsx"),
  "onboarding",
);

// Register prefetch handlers for instant hover / idle prefetching
registerRoutePrefetch("/dashboard", () => import("./pages/Dashboard.jsx"));
registerRoutePrefetch("/add-trade", () => import("./pages/AddTrade.jsx"));
registerRoutePrefetch("/trades", () => import("./pages/PastTrades.jsx"));
registerRoutePrefetch("/accounts", () => import("./pages/PropAccounts.jsx"));
registerRoutePrefetch("/support", () => import("./pages/Support.jsx"));
registerRoutePrefetch("/affiliate", () => import("./pages/AffiliateDashboard.jsx"));
registerRoutePrefetch("/news", () => import("./pages/EconomicCalendar.jsx"));
registerRoutePrefetch(
  "/analysis/performance",
  () => import("./pages/PerformanceAnalytics.jsx"),
);
registerRoutePrefetch(
  "/analysis/trades",
  () => import("./pages/TradeAnalysis.jsx"),
);
registerRoutePrefetch("/onboarding", () => import("./pages/Onboarding.jsx"));
registerRoutePrefetch("/charts", () => import("./pages/Charts.jsx"));
registerRoutePrefetch("/sessions", () => import("./pages/Sessions.jsx"));
registerRoutePrefetch("/backtest", () => import("./pages/Backtest.jsx"));
registerRoutePrefetch(
  "/bot-hub",
  () => import("./features/bot-hub/pages/BotHubPage.jsx"),
);
registerRoutePrefetch(
  "/bot-hub/connections",
  () => import("./features/bot-hub/pages/ConnectionsPage.jsx"),
);
registerRoutePrefetch(
  "/bot-hub/mt5",
  () => import("./features/bot-hub/pages/Mt5BotPage.jsx"),
);
registerRoutePrefetch("/admin", () => import("./pages/AdminDashboard.jsx"));
registerRoutePrefetch(
  "/admin/trading-bot",
  () => import("./features/trading-bot/pages/TradingBotDashboard.jsx"),
);
registerRoutePrefetch(
  "/admin/setup",
  () => import("./features/trading-bot/pages/BotSetupPage.jsx"),
);
registerRoutePrefetch(
  "/calculator/lot-size",
  () => import("./pages/TraderProblems/LotSizeCalculator.jsx"),
);
registerRoutePrefetch(
  "/calculator/prop-firm",
  () => import("./pages/TraderProblems/PropFirm.jsx"),
);
registerRoutePrefetch("/tools", () => import("./pages/Tools.jsx"));
registerRoutePrefetch("/lounge", () => import("./pages/lounge/LoungeShell.jsx"));
registerRoutePrefetch("/community", () => import("./pages/community/TradersCommunity.jsx"));
registerRoutePrefetch("/profile", () => import("./pages/Profile.jsx"));

const INDEXABLE_PATHS = ["/", "/privacy"];
const isIndexable = (path) =>
  INDEXABLE_PATHS.includes(path) ||
  path.startsWith("/vs/") ||
  SEO_PAGES.some((p) => p.path === path.replace(/\/$/, ""));

const RouteSeo = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const refCode = searchParams.get("ref");
    if (refCode) localStorage.setItem("referred_by", refCode);

    const indexable = isIndexable(pathname);
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = indexable ? "index, follow" : "noindex, nofollow";
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.disabled = !indexable;
  }, [pathname]);

  return null;
};

// Signed-in visitors skip the landing and login pages; the guards then route to paywall or onboarding when needed.
const PublicOnlyRoute = ({ children }) =>
  isSessionValid() ? <Navigate to="/dashboard" replace /> : children;

// GUARD 1: Authentication — checks localStorage AND session validity (24-hour window)
const MessagesRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/community${search}`} replace />;
};

const AuthGuard = () => {
  const { pathname } = useLocation();
  if (!isSessionValid()) {
    if (pathname.startsWith("/community/invite/")) localStorage.setItem("pending_invite", pathname);
    // Session expired or missing — clean up and redirect
    clearSession();
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Fast, non-blocking workspace loader (avoids heavy WebGL 3D loader flash on route transitions)
const WorkspaceLoader = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
    <div className="relative flex items-center justify-center mb-3">
      <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
      <img
        src="/logo3d.png"
        alt="Loading"
        className="w-4 h-4 object-contain absolute opacity-80"
      />
    </div>
    <p className="text-xs text-gray-400 font-medium tracking-wide">
      Connecting workspace...
    </p>
  </div>
);

// GUARD 2: The Paywall Enforcer (Requires active subscription / trial or admin)
const PaywallGuard = () => {
  const [access, setAccess] = useState(() => {
    const cached = getImmediateCachedStatus();
    if (cached) {
      if (cached.isAdmin) return "allow";
      if (!cached.hasPaid) return "paywall";
      return "allow";
    }
    return null;
  });

  useEffect(() => {
    let active = true;
    getCachedAccessStatus()
      .then((data) => {
        if (!active) return;
        const { hasPaid, isAdmin } = data || {};
        if (isAdmin) {
          setAccess("allow");
        } else if (!hasPaid) {
          setAccess("paywall");
        } else {
          setAccess("allow");
        }
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status !== 401) {
          setAccess("paywall");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (access === null) {
    return <WorkspaceLoader />;
  }

  if (access === "paywall") return <Navigate to="/paywall" replace />;

  return <Outlet />;
};

// GUARD 3: Fresh signups finish onboarding before entering the workspace
const OnboardingGuard = () => {
  const isNewSignup = localStorage.getItem("fn_new_signup") === "true";
  if (isNewSignup && !isOnboardingCompleted()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
};

// GUARD 4: Admin Only
// Verified by the server; nothing renders until /api/admin/me confirms
const AdminGuard = () => {
  const isAdmin = useIsAdmin();
  if (isAdmin === null) return <WorkspaceLoader />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

// Fast route transition loader that doesn't freeze browser or re-mount 3D canvas
const RouteTransitionFallback = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#0a0a0a]">
    <div className="relative flex items-center justify-center mb-3">
      <div className="w-9 h-9 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
      <img
        src="/logo3d.png"
        alt="ForexNotes"
        className="w-4 h-4 object-contain absolute opacity-80"
      />
    </div>
    <p className="text-xs text-gray-400 font-medium tracking-wide">
      Loading workspace view...
    </p>
  </div>
);

// Global ScrollToTop: ensures route transitions and page visits always reset to the top
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
};

const AUTH_FLOW_PATHS = ["/login", "/verify", "/paywall", "/link-discord", "/discord/callback"];

const AuthFlowThemeToggle = () => {
  const { pathname } = useLocation();
  return AUTH_FLOW_PATHS.includes(pathname) ? <FloatingThemeToggle /> : null;
};

// Paywall Route: Accessible by new visitors & subscribed users managing plans
const PaywallRoute = () => {
  return <Paywall />;
};

// Route observer: marks in-app navigation and tracks protected dashboard usage
const RouteWatcher = () => {
  const { pathname } = useLocation();
  const initialPath = useRef(pathname);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== initialPath.current) {
      markInAppNavigation();
    }
    if (pathname !== prevPathRef.current) {
      sessionStorage.setItem("prev_path", prevPathRef.current);
      prevPathRef.current = pathname;
    }

    const appRoutes = [
      "/dashboard",
      "/add-trade",
      "/news",
      "/trades",
      "/analysis",
      "/analytics",
      "/psychology",
      "/mistakes",
      "/accounts",
      "/settings",
      "/profile",
      "/support",
      "/affiliate",
      "/charts",
      "/sessions",
      "/tools",
      "/calculator",
      "/bot-hub",
      "/lounge",
      "/messages",
      "/community",
    ];

    if (appRoutes.some((route) => pathname.startsWith(route))) {
      sessionStorage.setItem("user_in_app", "true");
    } else if (pathname === "/login" || pathname === "/verify") {
      sessionStorage.removeItem("user_in_app");
    }
  }, [pathname]);

  return null;
};

function App() {
  // Wake up backend server on initial visit if it went to sleep from inactivity
  useEffect(() => {
    api.get("/api/health").catch(() => {
      // Health check is non-blocking
    });
  }, []);

  return (
    <BrowserRouter>
      <NavigationProgressBar />
      <ScrollToTop />
      <RouteWatcher />
      <RouteSeo />
      <Suspense fallback={<RouteTransitionFallback />}>
        <ErrorBoundary>
          <Routes>
            {/* Public Landing Pages */}
            <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/vs/:competitorSlug" element={<CompetitorVsPage />} />
            {SEO_PAGES.map((p) => (
              <Route key={p.path} path={p.path} element={<SeoLandingPage />} />
            ))}
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/paywall" element={<PaywallRoute />} />

            {/* Guard 1: Must be logged in */}
            <Route element={<AuthGuard />}>
              <Route path="/link-discord" element={<DiscordGate />} />
              <Route path="/discord/callback" element={<DiscordCallback />} />

              {/* Guard 2: Must be logged in AND Paid (or Active Trial / Admin) */}
              <Route element={<PaywallGuard />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/backtest/:id" element={<Backtest />} />
                <Route
                  path="/backtest"
                  element={<Navigate to="/sessions" replace />}
                />
                <Route element={<OnboardingGuard />}>
                <Route path="/" element={<MainLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="add-trade" element={<AddTrade />} />
                  <Route path="news" element={<EconomicCalendar />} />
                  <Route path="trades" element={<PastTrades />} />
                  <Route path="calendar" element={<Navigate to="/news" replace />} />
                  <Route
                    path="analysis"
                    element={<Navigate to="/analysis/performance" replace />}
                  />
                  <Route
                    path="analysis/performance"
                    element={<PerformanceAnalytics />}
                  />
                  <Route path="analysis/trades" element={<TradeAnalysis />} />
                  <Route
                    path="analytics"
                    element={<Navigate to="/analysis/performance" replace />}
                  />
                  <Route path="psychology" element={<Psychology />} />
                  <Route path="mistakes" element={<Mistakes />} />
                  <Route path="accounts" element={<PropAccounts />} />
                  <Route
                    path="settings"
                    element={<Navigate to="/profile?tab=settings" replace />}
                  />
                  <Route path="profile" element={<Profile />} />
                  <Route path="support" element={<Support />} />
                  <Route path="affiliate" element={<AffiliateDashboard />} />
                  <Route path="charts" element={<Charts />} />
                  <Route path="sessions" element={<Sessions />} />

                  {/* Admin Only Routes */}
                  <Route element={<AdminGuard />}>
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route
                      path="admin/trading-bot"
                      element={<TradingBotDashboard />}
                    />
                    <Route path="admin/setup" element={<BotSetupPage />} />
                  </Route>

                  <Route path="bot-hub" element={<BotHubPage />} />
                  <Route
                    path="bot-hub/connections"
                    element={<ConnectionsPage />}
                  />
                  <Route path="bot-hub/mt5" element={<Mt5BotPage />} />

                  <Route path="tools" element={<Tools />} />
                  <Route path="tools/ai-coach" element={<AICoach />} />

                  {/* Completely Separated Calculator & Prop Firm Routes */}
                  <Route path="calculator" element={<Navigate to="/calculator/lot-size" replace />} />
                  <Route path="calculator/lot-size" element={<LotSizeCalculator />} />
                  <Route path="calculator/position-size" element={<LotSizeCalculator />} />
                  <Route path="calculator/prop-firm" element={<PropFirm />} />
                  <Route path="prop-firm" element={<PropFirm />} />
                  <Route path="market-hours" element={<MarketHours />} />
                  <Route path="tools/market-hours" element={<MarketHours />} />

                  <Route path="lounge" element={<LoungeShell />}>
                    <Route index element={<LoungeLeaderboard />} />
                    <Route path="feed" element={<LoungeFeed />} />
                    <Route path="chat" element={<Navigate to="/community" replace />} />
                    <Route path="deals" element={<LoungeDeals />} />
                    <Route path="trader/:id" element={<TraderProfile />} />
                  </Route>
                  <Route path="messages" element={<MessagesRedirect />} />
                  <Route path="community" element={<TradersCommunity />} />
                  <Route path="community/discover" element={<TradersCommunity />} />
                  <Route path="community/s/:serverId" element={<TradersCommunity />} />
                  <Route path="community/s/:serverId/:channelId" element={<TradersCommunity />} />
                  <Route path="community/invite/:code" element={<CommunityInvite />} />
                </Route>
                </Route>
              </Route>
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
      <AuthFlowThemeToggle />
      <CookieConsent />
    </BrowserRouter>
  );
}

export default App;
