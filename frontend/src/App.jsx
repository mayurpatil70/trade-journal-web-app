// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import DiscordGate from "./pages/DiscordGate.jsx";
import EconomicCalendar from "./pages/EconomicCalendar.jsx";

// Layout
import MainLayout from "./layouts/MainLayout.jsx";

// Temporary placeholder for pages we are building next
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
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/link-discord" element={<DiscordGate />} />

        {/* Protected Dashboard Routes (Wrapped in the Sidebar Layout) */}
        <Route path="/" element={<MainLayout />}>
          {/* Automatically redirect the base URL to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* 1. Dashboard */}
          <Route path="dashboard" element={<Placeholder title="Dashboard" />} />

          {/* 2. Add Trade */}
          <Route path="add-trade" element={<Placeholder title="Add Trade" />} />

          {/* 3. Economic Calendar (Built!) */}
          <Route path="news" element={<EconomicCalendar />} />

          {/* 4. Past Trades */}
          <Route path="trades" element={<Placeholder title="Past Trades" />} />

          {/* 5. Calendar (Profit/Loss View) */}
          <Route
            path="calendar"
            element={<Placeholder title="Performance Calendar" />}
          />

          {/* 6. Journal History */}
          <Route
            path="history"
            element={<Placeholder title="Journal History" />}
          />

          {/* 7. Imports (AI Integration) */}
          <Route
            path="import"
            element={<Placeholder title="AI Import & Insights" />}
          />

          {/* 8. Accounts (Prop Firm Integration) */}
          <Route
            path="accounts"
            element={<Placeholder title="Prop Firm Accounts" />}
          />

          {/* 9. Profile & Settings */}
          <Route
            path="settings"
            element={<Placeholder title="Profile & Settings" />}
          />

          {/* 10. Customize */}
          <Route
            path="customize"
            element={<Placeholder title="Customize Theme" />}
          />

          {/* 11. Support */}
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
