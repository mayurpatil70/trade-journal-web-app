// frontend/src/components/PreTradeGate.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Send, ChevronRight, Loader2, ImagePlus, XCircle } from "lucide-react";
import api from "../api/axios";

// ── Simple inline markdown renderer ──────────────────────────────────────────
// Converts **bold**, newlines, and numbered lines to readable JSX.
// Keeps the bubble clean — no raw asterisks, no headers dumped.
function FormattedMessage({ text }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span key={j} className="font-semibold">
                {part.slice(2, -2)}
              </span>
            );
          }
          return part;
        });
        return (
          <p key={i} className="leading-relaxed">
            {parts}
          </p>
        );
      })}
    </div>
  );
}

export default function PreTradeGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);   // File object
  const [imagePreview, setImagePreview] = useState(null); // data URL for preview
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [chatHistory, setChatHistory] = useState([
    {
      sender: "ai",
      text: "Hey trader. Before you click buy or sell, take a breath. What is your emotional state right now? Is this setup in your playbook, or are you revenge trading?",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

  // CRITICAL FIX: All hooks must be before this early return
  const hiddenRoutes = ['/', '/login', '/verify', '/paywall', '/discord-gate', '/discord-callback', '/add-trade', '/register'];
  if (hiddenRoutes.includes(location.pathname)) return null;

  // ── Image selection ──────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() && !imageFile) return;

    const userText = message.trim() || "Here's my chart — what do you see?";
    const userMessage = {
      sender: "user",
      text: userText,
      imagePreview: imagePreview || null, // store preview for display
    };
    const currentHistory = [...chatHistory];

    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    clearImage();
    setIsLoading(true);

    try {
      let response;

      if (imageFile) {
        // Send as multipart FormData when image is attached
        const formData = new FormData();
        formData.append("message", userText);
        formData.append("history", JSON.stringify(currentHistory));
        formData.append("image", imageFile);

        response = await api.post("/api/ai/chat", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        });
      } else {
        response = await api.post(
          "/api/ai/chat",
          { message: userText, history: currentHistory },
          { timeout: 120000 },
        );
      }

      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: response.data.text },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg = error?.response?.data?.error || error.message || "Connection failed";
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: `Something went wrong: ${errMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReadyToTrade = () => {
    setIsOpen(false);
    navigate("/add-trade");
  };

  const ROBOT_AVATAR =
    "https://img.magnific.com/premium-photo/robot-head-with-goggles-smile-it_7023-571826.jpg";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Chat Modal ───────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[580px] bg-white/80 dark:bg-[#121418]/80 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">

          {/* Header */}
          <div className="bg-[#2f8df4] p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={ROBOT_AVATAR}
                alt="AI Coach"
                className="w-8 h-8 rounded-full border border-white/30 object-cover"
              />
              <div>
                <h3 className="text-white font-bold text-sm">Trading Psychology Coach</h3>
                <p className="text-white/80 text-[10px] uppercase tracking-wider">Powered by FN</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-[#0d0e12]">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#2f8df4] text-white rounded-br-sm"
                      : "bg-white dark:bg-[#1a1d24] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5 rounded-bl-sm"
                  }`}
                >
                  {/* Image preview inside bubble (user-sent) */}
                  {msg.imagePreview && (
                    <img
                      src={msg.imagePreview}
                      alt="chart"
                      className="w-full rounded-xl mb-2 max-h-40 object-cover"
                    />
                  )}
                  <FormattedMessage text={msg.text} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#1a1d24] p-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#2f8df4] animate-spin" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">Coach is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 bg-white dark:bg-[#121418] border-t border-gray-200 dark:border-white/5 shrink-0">

            {/* Image preview strip */}
            {imagePreview && (
              <div className="relative mb-2 inline-block">
                <img
                  src={imagePreview}
                  alt="selected chart"
                  className="h-16 rounded-xl object-cover border border-gray-200 dark:border-white/10"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 text-gray-500 hover:text-red-500 transition-colors bg-white dark:bg-[#121418] rounded-full"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2 mb-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image upload trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach chart"
                className="text-gray-400 hover:text-[#2f8df4] transition-colors shrink-0 p-2"
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              {/* Text input */}
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={imageFile ? "Add a note about the chart..." : "Type your message..."}
                className="flex-1 bg-gray-100 dark:bg-[#1a1d24] text-sm text-gray-900 dark:text-white border-none rounded-full px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#2f8df4]"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={isLoading || (!message.trim() && !imageFile)}
                className="bg-[#2f8df4] hover:bg-[#2376e8] disabled:bg-[#2f8df4]/40 text-white p-2.5 rounded-full transition-colors flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              onClick={handleReadyToTrade}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-full transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              I'm ready to trade, Thanks <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Trigger Button ──────────────────────────────────────── */}
      {!isOpen && (
        <div
          className="relative flex flex-col items-center cursor-pointer group"
          onClick={() => setIsOpen(true)}
        >
          <div className="absolute -top-12 bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-white text-xs font-bold px-4 py-2 rounded-3xl shadow-lg border border-gray-100 dark:border-white/10 whitespace-nowrap transform transition-transform group-hover:-translate-y-1">
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
