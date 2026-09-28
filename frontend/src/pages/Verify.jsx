// frontend/src/pages/Verify.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, XCircle } from "lucide-react";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const email = searchParams.get("email");
      const token = searchParams.get("token");

      if (!email || !token) {
        setError("Missing verification credentials.");
        return;
      }

      try {
        const response = await axios.post(
          "http://localhost:3000/api/auth/verify",
          { email, token },
        );

        // Save user ID to local storage for future requests
        localStorage.setItem("userId", response.data.userId);

        // Gatekeeping: Check if they are in your Discord server
        if (response.data.discordVerified) {
          localStorage.setItem("discordVerified", "true");
          navigate("/dashboard");
        } else {
          localStorage.setItem("discordVerified", "false");
          navigate("/link-discord");
        }
      } catch (err) {
        setError(err.response?.data?.error || "Verification failed.");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-journalDark flex flex-col justify-center items-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center text-red-400 max-w-md w-full">
          <XCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
          <p className="text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-journalDark flex flex-col justify-center items-center">
      <Loader2 className="w-10 h-10 text-journalEmerald animate-spin mb-4" />
      <p className="text-gray-400">Verifying your secure link...</p>
    </div>
  );
}
