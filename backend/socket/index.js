// backend/socket/index.js
import { Server } from "socket.io";
import { verifyAuthTokenFull } from "../utils/authToken.js";
import { validateSession } from "../services/sessionService.js";
import {
  canAccessConversation,
  isPublicChannel,
  saveMessage,
  markConversationRead,
  getOrCreateDirectConversation,
} from "../services/loungeService.js";

const OFFLINE_GRACE_MS = 30_000;
const MAX_MESSAGE_LENGTH = 4000;

// userId -> Set<socketId>; in-memory per instance (swap for a Redis set when horizontally scaled)
const onlineTraders = new Map();
const offlineTimers = new Map();
let io = null;

export const userRoom = (userId) => `user:${userId}`;
export const convRoom = (conversationId) => `conv:${conversationId}`;

export function isOnline(userId) {
  return onlineTraders.has(String(userId));
}

export function getOnlineUserIds() {
  return [...onlineTraders.keys()];
}

export function emitToUser(userId, event, payload) {
  io?.to(userRoom(userId)).emit(event, payload);
}

export function broadcastDeal(deal) {
  io?.emit("deal:broadcast", deal);
}

async function authenticate(socket, next) {
  const token = socket.handshake.auth?.token || "";
  const decoded = verifyAuthTokenFull(token);
  if (!decoded?.userId) return next(new Error("UNAUTHORIZED"));

  if (decoded.sessionId) {
    try {
      const status = await validateSession(decoded.sessionId, decoded.userId);
      if (!status?.valid) return next(new Error(status?.reason || "SESSION_EXPIRED"));
    } catch (err) {
      console.warn("[Socket] Session validation failed open:", err.message);
    }
  }

  socket.user = { id: String(decoded.userId) };
  next();
}

function markOnline(userId, socketId) {
  clearTimeout(offlineTimers.get(userId));
  offlineTimers.delete(userId);
  const wasOffline = !onlineTraders.has(userId);
  const sockets = onlineTraders.get(userId) || new Set();
  sockets.add(socketId);
  onlineTraders.set(userId, sockets);
  if (wasOffline) io.emit("presence:update", { userId, status: "online" });
}

function markMaybeOffline(userId, socketId) {
  const sockets = onlineTraders.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size > 0) return;

  offlineTimers.set(
    userId,
    setTimeout(() => {
      if (onlineTraders.get(userId)?.size) return;
      onlineTraders.delete(userId);
      offlineTimers.delete(userId);
      io.emit("presence:update", { userId, status: "offline" });
    }, OFFLINE_GRACE_MS),
  );
}

function ack(cb, payload) {
  if (typeof cb === "function") cb(payload);
}

function registerHandlers(socket) {
  const userId = socket.user.id;

  socket.on("room:join", async (roomId, cb) => {
    try {
      if (!(await canAccessConversation(roomId, userId))) return ack(cb, { ok: false, error: "FORBIDDEN" });
      socket.join(convRoom(roomId));
      ack(cb, { ok: true });
    } catch (err) {
      ack(cb, { ok: false, error: err.message });
    }
  });

  socket.on("room:leave", (roomId) => socket.leave(convRoom(roomId)));

  socket.on("message:send", async (payload = {}, cb) => {
    try {
      const content = String(payload.content || "").trim().slice(0, MAX_MESSAGE_LENGTH);
      const chartUrl = /^https:\/\/res\.cloudinary\.com\//.test(String(payload.chartUrl || "")) ? payload.chartUrl : null;
      if (!content && !payload.sharedTrade && !chartUrl) return ack(cb, { ok: false, error: "EMPTY" });

      let conversationId = payload.roomId;
      if (!conversationId && payload.recipientId) {
        if (String(payload.recipientId) === userId) return ack(cb, { ok: false, error: "SELF" });
        conversationId = (await getOrCreateDirectConversation(userId, String(payload.recipientId))).id;
      }
      if (!conversationId || !(await canAccessConversation(conversationId, userId))) {
        return ack(cb, { ok: false, error: "FORBIDDEN" });
      }

      const message = await saveMessage({
        conversationId,
        senderId: userId,
        content,
        mediaUrl: chartUrl,
        sharedTrade: payload.sharedTrade,
      });

      io.to(convRoom(conversationId)).emit("message:received", message);
      if (!(await isPublicChannel(conversationId))) {
        for (const participantId of message.participantIds || []) {
          io.to(userRoom(participantId)).except(convRoom(conversationId)).emit("message:received", message);
        }
      }
      ack(cb, { ok: true, message });
    } catch (err) {
      console.error("[Socket] message:send failed:", err.message);
      ack(cb, { ok: false, error: "SEND_FAILED" });
    }
  });

  socket.on("message:typing", ({ targetId, isTyping = true } = {}) => {
    if (!targetId || !socket.rooms.has(convRoom(targetId))) return;
    socket.to(convRoom(targetId)).emit("message:typing_status", {
      userId,
      conversationId: targetId,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("message:read", async ({ conversationId, messageId } = {}) => {
    try {
      if (!conversationId || !(await canAccessConversation(conversationId, userId))) return;
      const timestamp = await markConversationRead(conversationId, userId);
      socket.to(convRoom(conversationId)).emit("message:read_receipt", {
        conversationId,
        messageId,
        readBy: userId,
        timestamp,
      });
    } catch (err) {
      console.warn("[Socket] message:read failed:", err.message);
    }
  });

  socket.on("presence:list", (cb) => ack(cb, getOnlineUserIds()));

  socket.on("disconnect", () => markMaybeOffline(userId, socket.id));
}

export function initSocket(httpServer, { allowedOrigins }) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  io.use(authenticate);
  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(userRoom(userId));
    markOnline(userId, socket.id);
    registerHandlers(socket);
  });

  return io;
}
