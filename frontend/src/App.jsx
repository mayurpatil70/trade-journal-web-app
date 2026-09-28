// frontend/src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useSearchParams,
} from "react-router-dom";
import { useEffect } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import DiscordGate from "./pages/DiscordGate";
import Dashboard from "./pages/Dashboard";

// Bulletproof Route Guard
const ProtectedRoute = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = localStorage.getItem("userId");

  const isVerifiedQuery = searchParams.get("verified") === "true";
  const isVerifiedLocal = localStorage.getItem("discordVerified") === "true";

  useEffect(() => {
    // If backend redirected with success flag, lock it in storage
    if (isVerifiedQuery && !isVerifiedLocal) {
      localStorage.setItem("discordVerified", "true");
      // Clean the URL without causing a page reload
      setSearchParams({});
    }
  }, [isVerifiedQuery, isVerifiedLocal, setSearchParams]);

  // Evaluate the final verification status
  const finalVerifiedStatus = isVerifiedQuery || isVerifiedLocal;

  // Security Gates
  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (!finalVerifiedStatus) {
    return <Navigate to="/link-discord" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/link-discord" element={<DiscordGate />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route element={<MainLayout />}>
              <Route element={<EconomicCalendar />} path="/news" />
            </Route>

            <Route
              path="/trades"
              element={
                <div className="p-8 text-white">
                  Trade Log Content Goes Here
                </div>
              }
            />
            <Route
              path="/calendar"
              element={
                <div className="p-8 text-white">Calendar Content Goes Here</div>
              }
            />
            <Route
              path="/analytics"
              element={
                <div className="p-8 text-white">
                  Analytics Content Goes Here
                </div>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
