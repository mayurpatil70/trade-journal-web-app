// frontend/src/components/ErrorBoundary.jsx
import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const msg = error?.message || "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("error loading dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      error?.name === "ChunkLoadError";

    return { hasError: true, errorMessage: msg, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    const msg = error?.message || "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("error loading dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      error?.name === "ChunkLoadError";

    // Auto-reload once if dynamic import failed because of a new production deployment
    if (isChunkError) {
      const retryKey = "chunk_reload_retry";
      const lastRetry = sessionStorage.getItem(retryKey);
      const now = Date.now();
      if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
        sessionStorage.setItem(retryKey, now.toString());
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 font-sans">
          <div className="max-w-md w-full bg-[#121418] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              {this.state.isChunkError ? "Update Detected" : "Something went wrong"}
            </h1>
            <p className="text-sm text-gray-400 mb-6 bg-black/50 p-4 rounded-xl border border-white/5 font-mono overflow-x-auto text-left">
              {this.state.isChunkError
                ? "A new update of Forex Notes was deployed. Please reload the application to continue."
                : (this.state.errorMessage || "An unexpected rendering error occurred.")}
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem("chunk_reload_retry");
                window.location.reload();
              }}
              className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
