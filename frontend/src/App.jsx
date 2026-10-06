// frontend/src/App.jsx
import { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter,
  useLocation,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "./api/axios";

// Public Pages (Landing Page remains eagerly loaded for SEO/LCP)
import LandingPage from "./pages/LandingPage.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import NotFound from "./pages/NotFound.jsx";

// Lazy Loaded Protected App Pages
const Login = lazy(() => import("./pages/Login.jsx"));
const Verify = lazy(() => import("./pages/Verify.jsx"));
const DiscordGate = lazy(() => import("./pages/DiscordGate.jsx"));
const DiscordCallback = lazy(() => import("./pages/DiscordCallback.jsx"));
const Paywall = lazy(() => import("./pages/Paywall.jsx"));

const ErrorBoundary = lazy(() => import("./components/ErrorBoundary.jsx"));
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

// New Premium Workspaces
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Psychology = lazy(() => import("./pages/Psychology.jsx"));
const Mistakes = lazy(() => import("./pages/Mistakes.jsx"));
const Backtest = lazy(() => import("./pages/Backtest.jsx"));
const Sessions = lazy(() => import("./pages/Sessions.jsx"));

const MainLayout = lazy(() => import("./layouts/MainLayout.jsx"));
const PreTradeGate = lazy(() => import("./components/PreTradeGate.jsx"));

const CalculatorLayout = lazy(() => import("./pages/TraderProblems/Layout.jsx"));
const PropFirm = lazy(() => import("./pages/TraderProblems/PropFirm.jsx"));
const LotSizeCalculator = lazy(() => import("./pages/TraderProblems/LotSizeCalculator.jsx"));

const INDEXABLE_PATHS = ["/", "/privacy"];

const RouteSeo = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(search); const refCode = searchParams.get("ref"); if (refCode) { localStorage.setItem("referred_by", refCode); } const indexable = INDEXABLE_PATHS.includes(pathname);
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

// GUARD 1: Basic Authentication
const AuthGuard = () => {
  const isAuthenticated =
    localStorage.getItem("userId") ||
    localStorage.getItem("token") ||
    localStorage.getItem("userEmail");
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// GUARD 2: The Paywall Enforcer
const PaywallGuard = () => {
  const [access, setAccess] = useState(null); // null = loading, 'allow', 'paywall', 'discord'

  useEffect(() => {
    const checkStatus = async () => {
      const userId = localStorage.getItem("userId") || localStorage.getItem("userEmail");
      
      // ADMIN BYPASS
      if (userId === "noballondesk@gmail.com" || userId === "akpatil51340@gmail.com") {
        setAccess('allow');
        return;
      }

      try {
        const response = await api.get(`/api/subscriptions/status/${userId}`);
        const { hasPaid, discordVerified } = response.data;
        if (!discordVerified) {
          setAccess('discord');
        } else if (!hasPaid) {
          setAccess('paywall');
        } else {
          setAccess('allow');
        }
      } catch (error) {
        setAccess('paywall');
      }
    };
    checkStatus();
  }, []);

  if (access === null) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin" />
      </div>
    );
  }

  if (access === 'discord') return <Navigate to="/link-discord" replace />;
  if (access === 'paywall') return <Navigate to="/paywall" replace />;
  
  return <Outlet />;
};

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <BrowserRouter>
      <RouteSeo />
      <Suspense fallback={<div className="flex h-screen bg-[#0a0a0a] items-center justify-center"><Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin" /></div>}>
        <ErrorBoundary>
          <Routes>
            {/* Public Landing Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<Verify />} />

            {/* Guard 1: Must be logged in */}
            <Route element={<AuthGuard />}>
              <Route path="/link-discord" element={<DiscordGate />} />
              <Route path="/discord/callback" element={<DiscordCallback />} />
              <Route path="/paywall" element={<Paywall />} />

              {/* Guard 2: Must be logged in AND Paid (or Admin) */}
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
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="charts" element={<Charts />} />
                  <Route path="sessions" element={<Sessions />} />
                  
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
