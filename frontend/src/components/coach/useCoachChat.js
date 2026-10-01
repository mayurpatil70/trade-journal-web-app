import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { streamChat } from "./streamChat";

const WELCOME = {
  id: "welcome",
  sender: "ai",
  text: "Hey trader. Before you click buy or sell, take a breath. What is your emotional state right now? Is this setup in your playbook, or are you revenge trading?",
};

export const getUserId = () =>
  localStorage.getItem("userId") || localStorage.getItem("userEmail");

let nextId = 0;
const newId = () => `local-${Date.now()}-${nextId++}`;

export function useCoachChat(enabled) {
  const [messages, setMessages] = useState([WELCOME]);
  const [status, setStatus] = useState("idle"); // idle | waiting | thinking | streaming
  const [loadingHistory, setLoadingHistory] = useState(false);
  const abortRef = useRef(null);
  const loadedRef = useRef(false);

  const isBusy = status !== "idle";

  useEffect(() => {
    const userId = getUserId();
    if (!enabled || loadedRef.current || !userId) return;
    loadedRef.current = true;
    setLoadingHistory(true);
    api
      .get("/api/ai/chat/history", { params: { userId } })
      .then(({ data }) => {
        if (data.messages?.length) setMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [enabled]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const patchLast = useCallback((patch) => {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], ...patch(next[next.length - 1]) };
      return next;
    });
  }, []);

  const run = useCallback(
    async (text, history, regenerate = false) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("waiting");
      setMessages((prev) => [...prev, { id: newId(), sender: "ai", text: "", pending: true }]);

      try {
        await streamChat({
          message: text,
          history,
          regenerate,
          userId: getUserId(),
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "context") patchLast(() => ({ context: event }));
            else if (event.type === "thinking") setStatus("thinking");
            else if (event.type === "delta") {
              setStatus("streaming");
              patchLast((m) => ({ text: m.text + event.text }));
            } else if (event.type === "error") throw new Error(event.error);
          },
        });
        patchLast(() => ({ pending: false }));
      } catch (err) {
        if (controller.signal.aborted) {
          patchLast((m) => ({ pending: false, stopped: true, text: m.text }));
        } else {
          patchLast((m) => ({ pending: false, error: err.message || "Connection failed", text: m.text }));
        }
      } finally {
        abortRef.current = null;
        setStatus("idle");
      }
    },
    [patchLast],
  );

  const send = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || isBusy) return;
      const history = messages.filter((m) => m.text && !m.error);
      setMessages((prev) => [...prev, { id: newId(), sender: "user", text: trimmed }]);
      run(trimmed, history);
    },
    [isBusy, messages, run],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const regenerate = useCallback(() => {
    if (isBusy) return;
    const lastUserIdx = messages.map((m) => m.sender).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const text = messages[lastUserIdx].text;
    const history = messages.slice(0, lastUserIdx).filter((m) => m.text && !m.error);
    const last = messages[messages.length - 1];
    const wasSaved = last.sender === "ai" && !last.error && !last.stopped && last.id !== WELCOME.id;
    setMessages(messages.slice(0, lastUserIdx + 1));
    run(text, history, wasSaved);
  }, [isBusy, messages, run]);

  const clear = useCallback(async () => {
    abortRef.current?.abort();
    setMessages([WELCOME]);
    const userId = getUserId();
    if (userId) await api.delete("/api/ai/chat/history", { params: { userId } }).catch(() => {});
  }, []);

  return { messages, status, isBusy, loadingHistory, send, stop, regenerate, clear };
}
