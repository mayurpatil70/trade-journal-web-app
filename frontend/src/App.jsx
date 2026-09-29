// frontend/src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import DiscordGate from "./pages/DiscordGate.jsx";
import EconomicCalendar from "./pages/EconomicCalendar.jsx";
import AddTrade from "./pages/AddTrade.jsx";
import PastTrades from "./pages/PastTrades.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PerformanceCalendar from "./pages/PerformanceCalendar.jsx";
import JournalHistory from "./pages/JournalHistory.jsx";
import Imports from "./pages/Imports.jsx";
import PropAccounts from "./pages/PropAccounts.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import Support from "./pages/Support.jsx";
import DiscordCallback from "./pages/DiscordCallback";
import TraderProblemsLayout from "./pages/TraderProblems/Layout.jsx";

import MainLayout from "./layouts/MainLayout.jsx";

// Global Floating Component
import PreTradeGate from "./components/PreTradeGate.jsx";

const ProtectedRoute = () => {
  const isAuthenticated =
    localStorage.getItem("userId") || localStorage.getItem("token");
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
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
            <Route path="history" element={<JournalHistory />} />
            <Route path="import" element={<Imports />} />
            <Route path="accounts" element={<PropAccounts />} />

            {/* NEW: Trader Problems Hub */}
            <Route path="problems" element={<TraderProblemsLayout />}>
              <Route index element={<Navigate to="edge" replace />} />
              <Route path="edge" element={<EdgeFinderPlaceholder />} />
              <Route path="prop-firm" element={<PropFirmPlaceholder />} />
              <Route path="hindsight" element={<HindsightPlaceholder />} />
              <Route path="partials" element={<PartialsPlaceholder />} />
            </Route>

            {/* Unified Settings & New Profile */}
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />

            <Route path="support" element={<Support />} />
          </Route>
        </Route>
      </Routes>

      {/* Global Floating AI Coach ("Call me before Trade") */}
      <PreTradeGate />
    </BrowserRouter>
  );
}

export default App;
