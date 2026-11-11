import { Server } from "socket.io";
import { storage, type Message } from "./storage";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const jwtSecret = process.env.JWT_SECRET ?? "development-secret";
const MAX_ATTACHMENT_SIZE = 512 * 1024;
const isMessageType = (value: unknown): value is Message["type"] =>
  value === "text" ||
  value === "voice-note" ||
  value === "image" ||
  value === "audio" ||
  value === "video" ||
  value === "file";

export function initChatGateway(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) return next(new Error("Authentication token required"));
    try {
      const payload = jwt.verify(token, jwtSecret) as { userId: string };
      const user = storage.findUserById(payload.userId);
      if (!user) throw new Error("Invalid token");
      (socket.data as any).user = user;
      return next();
    } catch (error) {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket.data as any).user;
    if (!user) return;

    socket.join(user.id);
    user.lastSeen = new Date().toISOString();
    storage.updateLastSeen(user.id, user.lastSeen);
    io.emit("presence", { userId: user.id, online: true, lastSeen: user.lastSeen });

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on(
      "direct-message",
      (
        payload: {
          to?: unknown;
          body?: unknown;
          type?: unknown;
          roomId?: unknown;
          attachment?: unknown;
        },
        acknowledge?: (response: { ok: boolean; error?: string }) => void,
      ) => {
      const reject = (error: string) => acknowledge?.({ ok: false, error });
      if (
        !payload ||
        typeof payload.to !== "string" ||
        typeof payload.roomId !== "string" ||
        typeof payload.body !== "string"
      ) {
        reject("Invalid message.");
        return;
      }

      const requestedType = payload.type ?? "text";
      if (!isMessageType(requestedType)) {
        reject("Unsupported message type.");
        return;
      }
      const type = requestedType;

      let attachment: Message["attachment"];
      if (type === "file") {
        const candidate = payload.attachment as Record<string, unknown> | undefined;
        if (
          !candidate ||
          typeof candidate.name !== "string" ||
          typeof candidate.mimeType !== "string" ||
          typeof candidate.size !== "number" ||
          typeof candidate.dataUrl !== "string"
        ) {
          reject("Invalid file attachment.");
          return;
        }

        const name = candidate.name.replace(/[\\/\0-\x1f\x7f]/g, "_").slice(0, 255);
        const dataMatch = /^data:[^,]*;base64,([A-Za-z0-9+/]*={0,2})$/.exec(candidate.dataUrl);
        if (
          !name ||
          candidate.mimeType.length > 127 ||
          !Number.isInteger(candidate.size) ||
          candidate.size < 0 ||
          candidate.size > MAX_ATTACHMENT_SIZE ||
          candidate.dataUrl.length > Math.ceil(MAX_ATTACHMENT_SIZE * 4 / 3) + 256 ||
          !dataMatch ||
          Buffer.from(dataMatch[1], "base64").length !== candidate.size
        ) {
          reject("Attachments must be valid files no larger than 512 KB.");
          return;
        }

        attachment = {
          name,
          mimeType: candidate.mimeType || "application/octet-stream",
          size: candidate.size,
          dataUrl: candidate.dataUrl,
        };
      }

      const message = {
        id: randomUUID(),
        from: user.id,
        to: payload.to,
        body: type === "file" && attachment ? `Shared a file: ${attachment.name}` : payload.body,
        roomId: payload.roomId,
        createdAt: new Date().toISOString(),
        type,
        ...(attachment ? { attachment } : {}),
        deliveredTo: [user.id],
        readBy: [user.id],
      };
      storage.addMessage(message);
      io.to(payload.roomId).emit("message", message);
      acknowledge?.({ ok: true });
    });

    socket.on("typing", (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit("typing", { userId: user.id, ...payload });
    });

    socket.on("read-receipt", (payload: { messageId: string; roomId: string }) => {
      const message = storage.getConversation(payload.roomId).find((item) => item.id === payload.messageId);
      if (!message) return;
      storage.markMessageRead(payload.messageId, payload.roomId, user.id);
      io.to(payload.roomId).emit("read-receipt", { messageId: payload.messageId, userId: user.id });
    });

    socket.on("create-group", (payload: { name: string; memberIds: string[] }) => {
      const group = storage.createGroup(payload.name, user.id, [user.id, ...payload.memberIds]);
      io.to(user.id).emit("group-created", group);
    });

    socket.on("status-update", (payload: { message: string; mediaUrl?: string }) => {
      const status = storage.addStatus({
        id: randomUUID(),
        userId: user.id,
        message: payload.message,
        mediaUrl: payload.mediaUrl,
        createdAt: new Date().toISOString(),
      });
      io.emit("status", status);
    });

    socket.on("disconnect", () => {
      user.lastSeen = new Date().toISOString();
      storage.updateLastSeen(user.id, user.lastSeen);
      io.emit("presence", { userId: user.id, online: false, lastSeen: user.lastSeen });
    });
  });
}
