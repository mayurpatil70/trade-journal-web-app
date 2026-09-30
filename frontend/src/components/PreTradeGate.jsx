// frontend/src/components/PreTradeGate.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Send, ChevronRight, Loader2 } from "lucide-react";
import api from "../api/axios";

export default function PreTradeGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [chatHistory, setChatHistory] = useState([
    {
      sender: "ai",
      text: "Hey trader. Before you click buy or sell, take a breath. What is your emotional state right now ? Is this setup in your playbook, or are you revenge trading?",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

  // CRITICAL FIX: All hooks (useState, useRef, useEffect) must be called before this condition!
  // Calling an early return before hooks caused React Error #300 and a black screen crash on navigation!
  const hiddenRoutes = ["/add-trade", "/login", "/register", "/verify"];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: "user", text: message };
    const currentHistory = [...chatHistory];

    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/ai/chat", {
        message: userMessage.text,
        history: currentHistory,
      });

      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: response.data.text },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I'm having trouble connecting right now, but please review your playbook manually before executing.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyToTrade = () => {
    setIsOpen(false);
    navigate("/add-trade");
  };

  // The 3D Robot Image
  const ROBOT_AVATAR =
    "https://img.magnific.com/premium-photo/robot-head-with-goggles-smile-it_7023-571826.jpg";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* The Chat Modal */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[550px] bg-white dark:bg-[#121418] border border-gray-200 dark:border-white/10 rounded-[4px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#2f8df4] p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={ROBOT_AVATAR}
                alt="AI Coach"
                className="w-8 h-8 rounded-full border border-white/30 object-cover"
              />
              <div>
                <h3 className="text-white font-bold text-sm">
                  Trading Psychology Coach
                </h3>
                <p className="text-white/80 text-[10px] uppercase tracking-wider">
                  Powered by FN
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0d0e12]">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-[4px] text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#2f8df4] text-white"
                      : "bg-white dark:bg-[#1a1d24] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#1a1d24] p-3 rounded-[4px] border border-gray-100 dark:border-white/5 shadow-sm">
                  <Loader2 className="w-4 h-4 text-[#2f8df4] animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input & Action Button */}
          <div className="p-4 bg-white dark:bg-[#121418] border-t border-gray-200 dark:border-white/5 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 mb-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1 bg-gray-100 dark:bg-[#1a1d24] text-sm text-gray-900 dark:text-white border-none rounded-[2px] px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2f8df4]"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-[#2f8df4] hover:bg-[#2376e8] disabled:bg-[#2f8df4]/50 text-white p-2.5 rounded-[2px] transition-colors flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={handleReadyToTrade}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-[2px] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              I'm ready to trade, Thanks <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <div
          className="relative flex flex-col items-center cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          <div className="absolute -top-12 bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white text-xs font-bold px-4 py-2 rounded-[4px] shadow-lg border border-gray-100 dark:border-white/10 whitespace-nowrap transform transition-transform group-hover:-translate-y-1">
            Coach isLIVE
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white dark:border-t-[#1a1d24]"></div>
          </div>

          <div className="w-16 h-16 rounded-full overflow-hidden shadow-2xl border-[3px] border-[#2f8df4] bg-[#121418] transform transition-transform group-hover:scale-105">
            <img
              src={ROBOT_AVATAR}
              alt="AI Trading Coach"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
