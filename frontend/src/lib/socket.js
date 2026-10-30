import { io } from "socket.io-client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import api from "../api/axios";

let socket = null;
const online = new Set();
const presenceListeners = new Set();

const notifyPresence = () => presenceListeners.forEach((fn) => fn(new Set(online)));

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socket) {
    if (socket.auth?.token !== token) {
      socket.auth = { token };
      socket.disconnect().connect();
    }
    return socket;
  }

  socket = io(api.defaults.baseURL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    socket.emit("presence:list", (ids = []) => {
      online.clear();
      ids.forEach((id) => online.add(String(id)));
      notifyPresence();
    });
  });
  socket.on("connect_error", (err) => {
    if (["UNAUTHORIZED", "SESSION_EXPIRED", "SUBSCRIPTION_EXPIRED"].includes(err.message)) disconnectSocket();
  });
  socket.on("presence:update", ({ userId, status }) => {
    if (status === "online") online.add(String(userId));
    else online.delete(String(userId));
    notifyPresence();
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  online.clear();
}

export function useSocketEvent(event, handler) {
  const ref = useRef(handler);
  useLayoutEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    const s = getSocket();
    if (!s) return undefined;
    const fn = (...args) => ref.current(...args);
    s.on(event, fn);
    return () => s.off(event, fn);
  }, [event]);
}

export function useOnlineSet() {
  const [set, setSet] = useState(() => new Set(online));
  useEffect(() => {
    getSocket();
    presenceListeners.add(setSet);
    return () => presenceListeners.delete(setSet);
  }, []);
  return set;
}

export function emitWithAck(event, payload) {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s) return resolve({ ok: false, error: "OFFLINE" });
    s.timeout(10000).emit(event, payload, (err, res) => resolve(err ? { ok: false, error: "TIMEOUT" } : res));
  });
}

export const openChatWith = (peer) => window.dispatchEvent(new CustomEvent("lounge:open-chat", { detail: { peer } }));
export const shareTradeToChat = (trade) => window.dispatchEvent(new CustomEvent("lounge:share-trade", { detail: { trade } }));
