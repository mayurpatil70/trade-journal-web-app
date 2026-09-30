// frontend/src/components/ErrorBoundary.jsx
import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
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
              Something went wrong
            </h1>
            <p className="text-sm text-gray-400 mb-6 bg-black/50 p-4 rounded-xl border border-white/5 font-mono overflow-x-auto text-left">
              {this.state.errorMessage ||
                "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => window.location.replace("/")}
              className="w-full py-4 px-6 bg-[#2f8df4] hover:bg-[#2376e8] text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex justify-center items-center gap-2"
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
