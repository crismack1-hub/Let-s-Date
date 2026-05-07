import { Server } from "socket.io";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

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
    io.emit("presence", { userId: user.id, online: true, lastSeen: user.lastSeen });

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("direct-message", (payload: { to: string; body: string; type?: string; roomId: string; encryptedPayload: string }) => {
      const message = {
        id: randomUUID(),
        from: user.id,
        to: payload.to,
        body: payload.body,
        roomId: payload.roomId,
        createdAt: new Date().toISOString(),
        type: (payload.type as any) ?? "text",
        deliveredTo: [user.id],
        readBy: [user.id],
      };
      storage.addMessage(message);
      io.to(payload.roomId).emit("message", message);
    });

    socket.on("typing", (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit("typing", { userId: user.id, ...payload });
    });

    socket.on("read-receipt", (payload: { messageId: string; roomId: string }) => {
      const message = storage.getConversation(payload.roomId).find((item) => item.id === payload.messageId);
      if (!message) return;
      if (!message.readBy.includes(user.id)) {
        message.readBy.push(user.id);
      }
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
      io.emit("presence", { userId: user.id, online: false, lastSeen: user.lastSeen });
    });
  });
}
