// frontend/src/App.jsx
import { useEffect } from "react";
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
import Imports from "./pages/Imports.jsx";
import PropAccounts from "./pages/PropAccounts.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import Support from "./pages/Support.jsx";
import DiscordCallback from "./pages/DiscordCallback";

import MainLayout from "./layouts/MainLayout.jsx";
import PreTradeGate from "./components/PreTradeGate.jsx";

import TraderProblemsLayout from "./pages/TraderProblems/Layout.jsx";
import EdgeFinder from "./pages/TraderProblems/EdgeFinder.jsx";
import PropFirm from "./pages/TraderProblems/PropFirm.jsx";
import Hindsight from "./pages/TraderProblems/Hindsight.jsx";
import Partials from "./pages/TraderProblems/Partials.jsx";

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

            <Route path="problems" element={<TraderProblemsLayout />}>
              <Route index element={<Navigate to="edge" replace />} />
              <Route path="edge" element={<EdgeFinder />} />
              <Route path="prop-firm" element={<PropFirm />} />
              <Route path="hindsight" element={<Hindsight />} />
              <Route path="partials" element={<Partials />} />
            </Route>
          </Route>
        </Route>
      </Routes>

      <PreTradeGate />
    </BrowserRouter>
  );
}

export default App;
