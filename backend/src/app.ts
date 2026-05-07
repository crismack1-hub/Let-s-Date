import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { authRouter } from "./auth";
import { initChatGateway } from "./chat";

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
  app.use(express.json());

  app.use("/api/auth", authRouter);

  initChatGateway(io);

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  return server;
}
