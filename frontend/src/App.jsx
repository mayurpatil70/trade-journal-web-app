// frontend/src/App.jsx
import { useEffect, useState, useRef, lazy, Suspense } from "react";
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
import { getCachedAccessStatus, getImmediateCachedStatus } from "./utils/subscriptionCache";
import { markInAppNavigation } from "./utils/navigationState";

// CRITICAL: ErrorBoundary MUST be eagerly imported — it cannot be lazy-loaded
// because if it fails to load, there's nothing to catch the error (causes #310 crash loop)
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Logo3DLoader from "./components/Logo3DLoader.jsx";

// Public Pages (eagerly loaded for SEO/LCP)
import LandingPage from "./pages/LandingPage.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import NotFound from "./pages/NotFound.jsx";
import { SEO_PAGES } from "./data/seoPages";
const CompetitorVsPage = lazy(() => import("./pages/CompetitorVsPage.jsx"));
const SeoLandingPage = lazy(() => import("./pages/SeoLandingPage.jsx"));

// Lazy Loaded Protected App Pages
const Login = lazy(() => import("./pages/Login.jsx"));
const Verify = lazy(() => import("./pages/Verify.jsx"));
const DiscordGate = lazy(() => import("./pages/DiscordGate.jsx"));
const DiscordCallback = lazy(() => import("./pages/DiscordCallback.jsx"));
const Paywall = lazy(() => import("./pages/Paywall.jsx"));

const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar.jsx"));
const AddTrade = lazy(() => import("./pages/AddTrade.jsx"));
const PastTrades = lazy(() => import("./pages/PastTrades.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const PerformanceCalendar = lazy(() => import("./pages/PerformanceCalendar.jsx"));
const PropAccounts = lazy(() => import("./pages/PropAccounts.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Support = lazy(() => import("./pages/Support.jsx"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const Charts = lazy(() => import("./pages/Charts.jsx"));

// Premium Workspaces
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Psychology = lazy(() => import("./pages/Psychology.jsx"));
const Mistakes = lazy(() => import("./pages/Mistakes.jsx"));
const Backtest = lazy(() => import("./pages/Backtest.jsx"));
const Sessions = lazy(() => import("./pages/Sessions.jsx"));

const TradingBotDashboard = lazy(() => import("./features/trading-bot/pages/TradingBotDashboard.jsx"));
const BotSetupPage = lazy(() => import("./features/trading-bot/pages/BotSetupPage.jsx"));
const BotHubPage = lazy(() => import("./features/bot-hub/pages/BotHubPage.jsx"));
const ConnectionsPage = lazy(() => import("./features/bot-hub/pages/ConnectionsPage.jsx"));
const Mt5BotPage = lazy(() => import("./features/bot-hub/pages/Mt5BotPage.jsx"));

const MainLayout = lazy(() => import("./layouts/MainLayout.jsx"));
const PreTradeGate = lazy(() => import("./components/PreTradeGate.jsx"));

const CalculatorLayout = lazy(() => import("./pages/TraderProblems/Layout.jsx"));
const PropFirm = lazy(() => import("./pages/TraderProblems/PropFirm.jsx"));
const LotSizeCalculator = lazy(() => import("./pages/TraderProblems/LotSizeCalculator.jsx"));

const INDEXABLE_PATHS = ["/", "/privacy"];
const isIndexable = (path) => INDEXABLE_PATHS.includes(path) || path.startsWith("/vs/") || SEO_PAGES.some((p) => p.path === path.replace(/\/$/, ""));

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

// GUARD 1: Authentication — checks localStorage AND session validity (24-hour window)
const AuthGuard = () => {
  if (!isSessionValid()) {
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
      <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
      <img src="/logo3d.png" alt="Loading" className="w-4 h-4 object-contain absolute opacity-80" />
    </div>
    <p className="text-xs text-gray-400 font-medium tracking-wide">Connecting workspace...</p>
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

// GUARD 3: Admin Only
const AdminGuard = () => {
  const id = (localStorage.getItem("userId") || "").toLowerCase().trim();
  const email = (localStorage.getItem("userEmail") || "").toLowerCase().trim();
  const adminEmails = ["noballondesk@gmail.com", "noballondesk@gamil.com", "akpatil51340@gmail.com"];
  if (adminEmails.includes(id) || adminEmails.includes(email)) {
    return <Outlet />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Fast route transition loader that doesn't freeze browser or re-mount 3D canvas
const RouteTransitionFallback = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#0a0a0a]">
    <div className="relative flex items-center justify-center mb-3">
      <div className="w-9 h-9 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
      <img src="/logo3d.png" alt="ForexNotes" className="w-4 h-4 object-contain absolute opacity-80" />
    </div>
    <p className="text-xs text-gray-400 font-medium tracking-wide">Loading workspace view...</p>
  </div>
);

// Global ScrollToTop: ensures route transitions and page visits always reset to the top
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, hash]);

  return null;
};

// Route observer: marks in-app navigation when user transitions between routes
const RouteWatcher = () => {
  const { pathname } = useLocation();
  const initialPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== initialPath.current) {
      markInAppNavigation();
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
      <ScrollToTop />
      <RouteWatcher />
      <RouteSeo />
      <Suspense fallback={<RouteTransitionFallback />}>
        <ErrorBoundary>
          <Routes>
            {/* Public Landing Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/vs/:competitorSlug" element={<CompetitorVsPage />} />
            {SEO_PAGES.map((p) => <Route key={p.path} path={p.path} element={<SeoLandingPage />} />)}
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<Verify />} />

            {/* Guard 1: Must be logged in */}
            <Route element={<AuthGuard />}>
              <Route path="/link-discord" element={<DiscordGate />} />
              <Route path="/discord/callback" element={<DiscordCallback />} />
              <Route path="/paywall" element={<Paywall />} />

              {/* Guard 2: Must be logged in AND Paid (or Active Trial / Admin) */}
              <Route element={<PaywallGuard />}>
                  <Route path="/backtest/:id" element={<Backtest />} />
                  <Route path="/backtest" element={<Navigate to="/sessions" replace />} />
                  <Route path="/" element={<MainLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="add-trade" element={<AddTrade />} />
                  <Route path="news" element={<EconomicCalendar />} />
                  <Route path="trades" element={<PastTrades />} />
                  <Route path="calendar" element={<PerformanceCalendar />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="psychology" element={<Psychology />} />
                  <Route path="mistakes" element={<Mistakes />} />
                  <Route path="accounts" element={<PropAccounts />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="support" element={<Support />} />
                  <Route path="affiliate" element={<AffiliateDashboard />} />
                  <Route path="charts" element={<Charts />} />
                  <Route path="sessions" element={<Sessions />} />

                  {/* Admin Only Routes */}
                  <Route element={<AdminGuard />}>
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/trading-bot" element={<TradingBotDashboard />} />
                    <Route path="admin/setup" element={<BotSetupPage />} />
                  </Route>

                  <Route path="bot-hub" element={<BotHubPage />} />
                  <Route path="bot-hub/connections" element={<ConnectionsPage />} />
                  <Route path="bot-hub/mt5" element={<Mt5BotPage />} />
                  
                  <Route path="calculator" element={<CalculatorLayout />}>
                    <Route index element={<Navigate to="lot-size" replace />} />
                    <Route path="lot-size" element={<LotSizeCalculator />} />
                    <Route path="prop-firm" element={<PropFirm />} />
                  </Route>
                </Route>
              </Route>
            </Route>

          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
