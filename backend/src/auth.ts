import { Router } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import nacl from "tweetnacl";
import { encodeUTF8, encodeBase64 } from "tweetnacl-util";

const router = Router();
const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

router.post("/register", async (req, res) => {
  const { phone, name, password } = req.body;
  if (!phone || !name || !password) {
    return res.status(400).json({ error: "phone, name, and password are required" });
  }

  if (storage.findUserByPhone(phone)) {
    return res.status(409).json({ error: "User already registered" });
  }

  const keyPair = nacl.box.keyPair();
  const publicKey = encodeBase64(keyPair.publicKey);
  const privateKey = encodeBase64(keyPair.secretKey);

  const user = await storage.createUser(phone, name, password, publicKey);

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "30d" });

  return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, publicKey } , privateKey });
});

router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: "phone and password are required" });
  }

  const user = await storage.verifyCredentials(phone, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: "30d" });
  return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, publicKey: user.publicKey } });
});

export { router as authRouter };
