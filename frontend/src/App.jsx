// frontend/src/App.jsx
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "./api/axios";

// Public Pages
import LandingPage from "./pages/LandingPage.jsx"; // Make sure you saved the LandingPage code here!
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import DiscordGate from "./pages/DiscordGate.jsx";
import DiscordCallback from "./pages/DiscordCallback.jsx";
import Paywall from "./pages/Paywall.jsx";

// Protected App Pages
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import EconomicCalendar from "./pages/EconomicCalendar.jsx";
import AddTrade from "./pages/AddTrade.jsx";
import PastTrades from "./pages/PastTrades.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PerformanceCalendar from "./pages/PerformanceCalendar.jsx";
import Imports from "./pages/Imports.jsx";
import PropAccounts from "./pages/PropAccounts.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import Support from "./pages/Support.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import PreTradeGate from "./components/PreTradeGate.jsx";

import CalculatorLayout from "./pages/TraderProblems/Layout.jsx";
import PropFirm from "./pages/TraderProblems/PropFirm.jsx";
import LotSizeCalculator from "./pages/TraderProblems/LotSizeCalculator.jsx";

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
  const [hasPaid, setHasPaid] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const userId =
        localStorage.getItem("userId") || localStorage.getItem("userEmail");
      try {
        const response = await api.get(`/api/subscriptions/status/${userId}`);
        setHasPaid(response.data.hasPaid);
      } catch (error) {
        setHasPaid(false);
      }
    };
    checkStatus();
  }, []);

  if (hasPaid === null) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2f8df4] animate-spin" />
      </div>
    );
  }

  // Trap them at the paywall if not paid
  return hasPaid ? <Outlet /> : <Navigate to="/paywall" replace />;
};

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public Landing Page is now the default root */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />

          {/* Guard 1: Must be logged in */}
          <Route element={<AuthGuard />}>
            <Route path="/link-discord" element={<DiscordGate />} />
            <Route path="/discord/callback" element={<DiscordCallback />} />
            <Route path="/paywall" element={<Paywall />} />

            {/* Guard 2: Must be logged in AND Paid (or Admin) */}
            <Route element={<PaywallGuard />}>
              <Route path="/" element={<MainLayout />}>
                {/* Dashboard is now explicitly /dashboard */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="add-trade" element={<AddTrade />} />
                <Route path="news" element={<EconomicCalendar />} />
                <Route path="trades" element={<PastTrades />} />
                <Route path="calendar" element={<PerformanceCalendar />} />
                <Route path="import" element={<Imports />} />
                <Route path="accounts" element={<PropAccounts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="support" element={<Support />} />
                <Route path="admin" element={<AdminDashboard />} />

                <Route path="calculator" element={<CalculatorLayout />}>
                  <Route index element={<Navigate to="lot-size" replace />} />
                  <Route path="lot-size" element={<LotSizeCalculator />} />
                  <Route path="prop-firm" element={<PropFirm />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
