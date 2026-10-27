import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// Auto-recover if Vite dynamic import fails due to a new deployment release (stale chunk hash)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    console.warn("New deployment detected, reloading to fetch latest assets...", event);
    const retryKey = "vite_preload_retry";
    const lastRetry = sessionStorage.getItem(retryKey);
    const now = Date.now();
    if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
      sessionStorage.setItem(retryKey, now.toString());
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);

// Gracefully dissolve initial loading screen immediately once the app tree has mounted
if (typeof window !== "undefined") {
  requestAnimationFrame(() => {
    if (typeof window.__dismissLoader === "function") {
      window.__dismissLoader(false);
    }
  });
}
