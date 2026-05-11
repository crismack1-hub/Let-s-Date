import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { authRouter } from "./auth";
import { initChatGateway } from "./chat";
import { profilesRouter } from "./profiles";

export function createApp() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:19006"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "10mb" }));

  app.use("/api/auth", authRouter);
  app.use("/api", profilesRouter);

  initChatGateway(io);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "Let's Date backend",
      status: "ok",
      web: "http://localhost:5173",
      endpoints: {
        health: "/health",
        auth: ["/api/auth/register", "/api/auth/login"],
        api: [
          "/api/profile",
          "/api/discover",
          "/api/likes",
          "/api/matches",
          "/api/conversations",
          "/api/unread-counts",
        ],
      },
    });
  });

  return server;
}
