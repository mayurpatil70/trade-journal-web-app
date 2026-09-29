// frontend/src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Pages
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
import Customize from "./pages/Customize.jsx";
import Support from "./pages/Support.jsx";

// Layout
import MainLayout from "./layouts/MainLayout.jsx";

// ----------------------------------------------------------------------
// PROTECTED ROUTE COMPONENT
// This checks if the user is authenticated before allowing them access.
// If no userId or token is found in localStorage, they are kicked to /login.
// ----------------------------------------------------------------------
const ProtectedRoute = () => {
  const isAuthenticated =
    localStorage.getItem("userId") || localStorage.getItem("token");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes (DiscordGate or MainLayout)
  return <Outlet />;
};

const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400 p-8">
    <div className="bg-[#121418] border border-white/5 rounded-2xl p-10 text-center shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-gray-500">
        This module is currently in development.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==========================================
            PUBLIC ROUTES (Accessible without login)
            ========================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />

        {/* ==========================================
            PROTECTED ROUTES (Requires authentication)
            ========================================== */}
        <Route element={<ProtectedRoute />}>
          {/* Discord gate requires login but no sidebar */}
          <Route path="/link-discord" element={<DiscordGate />} />

          {/* Main App Layout containing the Sidebar */}
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
            <Route path="settings" element={<Settings />} />
            <Route path="customize" element={<Customize />} />
            <Route path="support" element={<Support />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
