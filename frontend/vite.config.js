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
        },
      },
    },
  },
});
