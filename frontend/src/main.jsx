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
  // Give a pleasant 400ms duration for the circular 3D logo animation, then smoothly transition
  setTimeout(() => {
    if (typeof window.__dismissLoader === "function") {
      window.__dismissLoader();
    }
  }, 400);
}

