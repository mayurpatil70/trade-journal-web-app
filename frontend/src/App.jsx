// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import DiscordGate from "./pages/DiscordGate.jsx";
import EconomicCalendar from "./pages/EconomicCalendar.jsx";
import AddTrade from "./pages/AddTrade.jsx";
import PastTrades from "./pages/PastTrades.jsx"; // <-- NEW IMPORT

// Layout
import MainLayout from "./layouts/MainLayout.jsx";

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
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/link-discord" element={<DiscordGate />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
          <Route path="add-trade" element={<AddTrade />} />
          <Route path="news" element={<EconomicCalendar />} />

          {/* Past Trades (Built!) */}
          <Route path="trades" element={<PastTrades />} />

          <Route
            path="calendar"
            element={<Placeholder title="Performance Calendar" />}
          />
          <Route
            path="history"
            element={<Placeholder title="Journal History" />}
          />
          <Route
            path="import"
            element={<Placeholder title="AI Import & Insights" />}
          />
          <Route
            path="accounts"
            element={<Placeholder title="Prop Firm Accounts" />}
          />
          <Route
            path="settings"
            element={<Placeholder title="Profile & Settings" />}
          />
          <Route
            path="customize"
            element={<Placeholder title="Customize Theme" />}
          />
          <Route
            path="support"
            element={<Placeholder title="Support Helpdesk" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
