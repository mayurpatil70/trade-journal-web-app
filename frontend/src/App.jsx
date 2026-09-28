// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login.jsx";
import Verify from "./pages/Verify.jsx";
import DiscordGate from "./pages/DiscordGate.jsx";
import EconomicCalendar from "./pages/EconomicCalendar.jsx";

// Layout - THIS IMPORT PREVENTS THE CRASH
import MainLayout from "./layouts/MainLayout.jsx";

// Temporary placeholder for pages we are building next
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full text-gray-400">
    <h2 className="text-2xl font-bold">{title} - Coming Soon</h2>
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

          <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
          <Route path="trades" element={<Placeholder title="Trade Log" />} />
          <Route
            path="calendar"
            element={<Placeholder title="Trading Calendar" />}
          />

          {/* Our New News Route */}
          <Route path="news" element={<EconomicCalendar />} />

          <Route path="gallery" element={<Placeholder title="Gallery" />} />
          <Route path="analytics" element={<Placeholder title="Analytics" />} />
          <Route
            path="strategies"
            element={<Placeholder title="Strategies" />}
          />
          <Route path="import" element={<Placeholder title="Import Data" />} />
          <Route path="accounts" element={<Placeholder title="Accounts" />} />
          <Route path="settings" element={<Placeholder title="Settings" />} />
          <Route path="support" element={<Placeholder title="Support" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
