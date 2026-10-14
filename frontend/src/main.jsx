import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);

// Gracefully dissolve initial 3D circular loading screen once the app tree has mounted
if (typeof window !== "undefined") {
  // window.__dismissLoader() honors the target duration (5s for initial landing, 3s for refresh)
  requestAnimationFrame(() => {
    if (typeof window.__dismissLoader === "function") {
      window.__dismissLoader();
    }
  });
}

