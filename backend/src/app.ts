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
  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:5174,http://localhost:19006")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const isAllowedOrigin = (origin: string | undefined) => {
    if (!origin || allowedOrigins.includes(origin)) return true;
    if (process.env.NODE_ENV === "production") return false;

    try {
      return new URL(origin).hostname.endsWith(".trycloudflare.com");
    } catch {
      return false;
    }
  };

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin) ? origin || true : false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin) ? origin || true : false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));

  app.use("/api/auth", authRouter);
  app.use("/api", profilesRouter);

  initChatGateway(io);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "Connect backend",
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
