// frontend/src/App.jsx
import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Components
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import DiscordGate from "./pages/DiscordGate.jsx";
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
import DiscordCallback from "./pages/DiscordCallback.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import MainLayout from "./layouts/MainLayout.jsx";
import PreTradeGate from "./components/PreTradeGate.jsx";

// Calculator Hub Components
import CalculatorLayout from "./pages/TraderProblems/Layout.jsx";
import PropFirm from "./pages/TraderProblems/PropFirm.jsx";
// Note: Ensure this import matches your actual file name for the Lot Size calculator
import LotSizeCalculator from "./pages/TraderProblems/LotSizeCalculator.jsx";

const ProtectedRoute = () => {
  const isAuthenticated =
    localStorage.getItem("userId") || localStorage.getItem("token");
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
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
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/link-discord" element={<DiscordGate />} />
            <Route path="/discord/callback" element={<DiscordCallback />} />

            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
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

              {/* RENAMED ROUTE: /problems is now /calculator */}
              <Route path="calculator" element={<CalculatorLayout />}>
                <Route index element={<Navigate to="lot-size" replace />} />
                <Route path="lot-size" element={<LotSizeCalculator />} />
                <Route path="prop-firm" element={<PropFirm />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </ErrorBoundary>
      <PreTradeGate />
    </BrowserRouter>
  );
}

export default App;
