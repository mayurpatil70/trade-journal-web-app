import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three")) return "vendor-three";
            if (id.includes("lightweight-charts")) return "vendor-charts";
            if (id.includes("gsap") || id.includes("lenis")) return "vendor-motion";
            if (id.includes("wagmi") || id.includes("viem")) return "vendor-web3";
            if (id.includes("lucide-react")) return "vendor-icons";
          }

          // Group primary workspace pages into a single instant-access chunk
          // so navigating between Dashboard, Prop firm, Settings, Support,
          // Mistakes, Analytics, etc. renders with zero network roundtrip delay.
          const normalized = id.replace(/\\/g, "/");
          if (
            normalized.includes("/src/pages/Dashboard") ||
            normalized.includes("/src/pages/AddTrade") ||
            normalized.includes("/src/pages/PastTrades") ||
            normalized.includes("/src/pages/PerformanceCalendar") ||
            normalized.includes("/src/pages/Analytics") ||
            normalized.includes("/src/pages/Psychology") ||
            normalized.includes("/src/pages/Mistakes") ||
            normalized.includes("/src/pages/PropAccounts") ||
            normalized.includes("/src/pages/Settings") ||
            normalized.includes("/src/pages/Profile") ||
            normalized.includes("/src/pages/Support") ||
            normalized.includes("/src/pages/AffiliateDashboard") ||
            normalized.includes("/src/pages/EconomicCalendar") ||
            normalized.includes("/src/pages/TraderProblems") ||
            normalized.includes("/src/layouts/MainLayout")
          ) {
            return "workspace-core";
          }
        },
      },
    },
  },
});
