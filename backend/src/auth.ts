import { Router } from "express";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import nacl from "tweetnacl";
import { encodeUTF8, encodeBase64 } from "tweetnacl-util";
import { sendVerificationCode } from "./verificationDelivery";

const router = Router();
const jwtSecret = process.env.JWT_SECRET ?? "development-secret";
const PASSWORD_RESET_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_RESEND_MS = 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

type PasswordResetChallenge = {
  codeHash: string;
  salt: string;
  expiresAt: number;
  resendAfter: number;
  attempts: number;
};

const passwordResetChallenges = new Map<string, PasswordResetChallenge>();

function hashResetCode(salt: string, code: string) {
  return createHash("sha256").update(salt).update(code).digest();
}

function isTestResetMode() {
  return process.env.PASSWORD_RESET_TEST_MODE === "true";
}

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

  return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, publicKey }, privateKey });
});

router.post("/login", async (req, res) => {
  const { phone } = req.body;
  const { password } = req.body;
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

router.post("/password-reset/request", async (req, res) => {
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  const user = storage.findUserByPhone(phone);
  if (!user) {
    return res.json({ message: "If an account exists for that number, a verification code has been sent." });
  }

  const existing = passwordResetChallenges.get(user.id);
  if (existing && existing.expiresAt > Date.now() && existing.resendAfter > Date.now()) {
    return res.status(429).json({ error: "Please wait before requesting another verification code." });
  }

  const code = String(randomInt(100000, 1000000));
  const salt = randomBytes(16).toString("hex");
  const challenge: PasswordResetChallenge = {
    codeHash: hashResetCode(salt, code).toString("hex"),
    salt,
    expiresAt: Date.now() + PASSWORD_RESET_TTL_MS,
    resendAfter: Date.now() + PASSWORD_RESET_RESEND_MS,
    attempts: 0,
  };
  passwordResetChallenges.set(user.id, challenge);

  try {
    await sendVerificationCode("phone", user.phone, code);
    return res.json({ message: "If an account exists for that number, a verification code has been sent." });
  } catch (error) {
    if (isTestResetMode()) {
      return res.json({
        message: "Testing mode: use the verification code below to reset your password.",
        developmentCode: code,
      });
    }
    passwordResetChallenges.delete(user.id);
    console.error("Password reset code delivery failed:", error);
    return res.status(503).json({ error: "Password reset codes cannot be delivered right now. Please try again later." });
  }
});

router.post("/password-reset/confirm", async (req, res) => {
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!phone || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "Phone number and a 6-digit verification code are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const user = storage.findUserByPhone(phone);
  const challenge = user && passwordResetChallenges.get(user.id);
  if (!user || !challenge || challenge.expiresAt <= Date.now()) {
    if (user && challenge) passwordResetChallenges.delete(user.id);
    return res.status(400).json({ error: "The verification code is invalid or expired. Request a new code." });
  }
  if (challenge.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    passwordResetChallenges.delete(user.id);
    return res.status(429).json({ error: "Too many incorrect codes. Request a new code." });
  }

  const submittedHash = hashResetCode(challenge.salt, code);
  const storedHash = Buffer.from(challenge.codeHash, "hex");
  if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
    challenge.attempts += 1;
    return res.status(400).json({ error: "The verification code is invalid or expired. Request a new code." });
  }

  await storage.updatePassword(user.id, password);
  passwordResetChallenges.delete(user.id);
  return res.json({ success: true });
});

router.get("/verify", (req, res) => {
  const token = (req.header("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    const user = storage.findUserById(payload.userId);
    if (!user) return res.status(401).json({ error: "invalid token" });
    return res.json({ id: user.id, phone: user.phone, name: user.name });
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
});

export { router as authRouter };
