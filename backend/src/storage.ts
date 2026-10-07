import "dotenv/config";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { mkdirSync } from "fs";
import path from "path";

export type User = {
  id: string;
  phone: string;
  name: string;
  passwordHash: string;
  publicKey: string;
  isAdmin: boolean;
  lastSeen: string | null;
};

export type Message = {
  id: string;
  from: string;
  to: string;
  body: string;
  roomId: string;
  createdAt: string;
  type: "text" | "image" | "audio" | "video" | "file";
  deliveredTo: string[];
  readBy: string[];
};

export type Group = {
  id: string;
  name: string;
  members: string[];
  adminIds: string[];
  createdAt: string;
};

export type Status = {
  id: string;
  userId: string;
  message: string;
  mediaUrl?: string;
  createdAt: string;
};

type RelationshipKind = "likes" | "favorites" | "friends";

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, "../data/connect.sqlite");
mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    public_key TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    last_seen TEXT
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    body TEXT NOT NULL,
    room_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    message_type TEXT NOT NULL,
    delivered_to TEXT NOT NULL,
    read_by TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS messages_room_id_idx ON messages(room_id);
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    members TEXT NOT NULL,
    admin_ids TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS statuses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    media_url TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS profile_overrides (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS relationships (
    owner_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('likes', 'favorites', 'friends')),
    target_id TEXT NOT NULL,
    PRIMARY KEY (owner_id, kind, target_id)
  );
`);

const users = new Map<string, User>();
for (const row of database.prepare("SELECT * FROM users").all() as Array<Record<string, unknown>>) {
  const user: User = {
    id: String(row.id),
    phone: String(row.phone),
    name: String(row.name),
    passwordHash: String(row.password_hash),
    publicKey: String(row.public_key),
    isAdmin: row.is_admin === 1,
    lastSeen: typeof row.last_seen === "string" ? row.last_seen : null,
  };
  users.set(user.id, user);
}

const messages = (database.prepare("SELECT * FROM messages ORDER BY created_at").all() as Array<Record<string, unknown>>)
  .map((row): Message => ({
    id: String(row.id),
    from: String(row.sender_id),
    to: String(row.recipient_id),
    body: String(row.body),
    roomId: String(row.room_id),
    createdAt: String(row.created_at),
    type: row.message_type as Message["type"],
    deliveredTo: JSON.parse(String(row.delivered_to)) as string[],
    readBy: JSON.parse(String(row.read_by)) as string[],
  }));

const groups = new Map<string, Group>();
for (const row of database.prepare("SELECT * FROM groups").all() as Array<Record<string, unknown>>) {
  const group: Group = {
    id: String(row.id),
    name: String(row.name),
    members: JSON.parse(String(row.members)) as string[],
    adminIds: JSON.parse(String(row.admin_ids)) as string[],
    createdAt: String(row.created_at),
  };
  groups.set(group.id, group);
}

const statuses = (database.prepare("SELECT * FROM statuses ORDER BY created_at DESC").all() as Array<Record<string, unknown>>)
  .map((row): Status => ({
    id: String(row.id),
    userId: String(row.user_id),
    message: String(row.message),
    ...(typeof row.media_url === "string" ? { mediaUrl: row.media_url } : {}),
    createdAt: String(row.created_at),
  }));

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

export const storage = {
  async createUser(phone: string, name: string, password: string, publicKey: string) {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id,
      phone,
      name,
      passwordHash,
      publicKey,
      isAdmin: false,
      lastSeen: null,
    };
    database.prepare(`
      INSERT INTO users (id, phone, name, password_hash, public_key)
      VALUES (@id, @phone, @name, @passwordHash, @publicKey)
    `).run(user);
    users.set(id, user);
    return user;
  },
  async verifyCredentials(phone: string, password: string) {
    const normalizedPhone = normalizePhone(phone);
    const user = Array.from(users.values()).find(
      (item) => normalizePhone(item.phone) === normalizedPhone,
    );
    if (!user) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  },
  async updatePassword(userId: string, password: string) {
    const user = users.get(userId);
    if (!user) return false;
    const passwordHash = await bcrypt.hash(password, 10);
    database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
    user.passwordHash = passwordHash;
    return true;
  },
  updateLastSeen(userId: string, lastSeen: string) {
    const user = users.get(userId);
    if (!user) return;
    user.lastSeen = lastSeen;
    database.prepare("UPDATE users SET last_seen = ? WHERE id = ?").run(lastSeen, userId);
  },
  findUserById(id: string) {
    return users.get(id) ?? null;
  },
  findUserByPhone(phone: string) {
    const normalizedPhone = normalizePhone(phone);
    return Array.from(users.values()).find(
      (item) => normalizePhone(item.phone) === normalizedPhone,
    ) ?? null;
  },
  listUsers() {
    return Array.from(users.values(), ({ id, name }) => ({ id, name }));
  },
  addMessage(message: Message) {
    database.prepare(`
      INSERT INTO messages (
        id, sender_id, recipient_id, body, room_id, created_at, message_type, delivered_to, read_by
      ) VALUES (
        @id, @from, @to, @body, @roomId, @createdAt, @type, @deliveredTo, @readBy
      )
    `).run({
      ...message,
      deliveredTo: JSON.stringify(message.deliveredTo),
      readBy: JSON.stringify(message.readBy),
    });
    messages.push(message);
    return message;
  },
  getConversation(roomId: string) {
    return messages.filter((message) => message.roomId === roomId);
  },
  markMessageRead(messageId: string, roomId: string, userId: string) {
    const message = messages.find((item) => item.id === messageId && item.roomId === roomId);
    if (!message || message.readBy.includes(userId)) return;
    message.readBy.push(userId);
    database.prepare("UPDATE messages SET read_by = ? WHERE id = ? AND room_id = ?")
      .run(JSON.stringify(message.readBy), messageId, roomId);
  },
  createGroup(name: string, ownerId: string, members: string[]) {
    const group: Group = {
      id: randomUUID(),
      name,
      adminIds: [ownerId],
      members,
      createdAt: new Date().toISOString(),
    };
    database.prepare(`
      INSERT INTO groups (id, name, members, admin_ids, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(group.id, group.name, JSON.stringify(group.members), JSON.stringify(group.adminIds), group.createdAt);
    groups.set(group.id, group);
    return group;
  },
  getGroup(id: string) {
    return groups.get(id) ?? null;
  },
  addStatus(status: Status) {
    database.prepare(`
      INSERT INTO statuses (id, user_id, message, media_url, created_at)
      VALUES (@id, @userId, @message, @mediaUrl, @createdAt)
    `).run({ ...status, mediaUrl: status.mediaUrl ?? null });
    statuses.push(status);
    return status;
  },
  listStatuses() {
    return statuses.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getProfileOverride(userId: string) {
    const row = database.prepare("SELECT data FROM profile_overrides WHERE user_id = ?").get(userId) as
      | { data: string }
      | undefined;
    return row ? JSON.parse(row.data) as Record<string, unknown> : undefined;
  },
  listProfileOverrides() {
    return (database.prepare("SELECT user_id, data FROM profile_overrides").all() as Array<{ user_id: string; data: string }>)
      .map(({ user_id, data }) => [user_id, JSON.parse(data) as Record<string, unknown>] as const);
  },
  setProfileOverride(userId: string, data: Record<string, unknown>) {
    database.prepare(`
      INSERT INTO profile_overrides (user_id, data) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET data = excluded.data
    `).run(userId, JSON.stringify(data));
  },
  getRelationships(ownerId: string, kind: RelationshipKind) {
    return new Set((database.prepare(
      "SELECT target_id FROM relationships WHERE owner_id = ? AND kind = ?",
    ).all(ownerId, kind) as Array<{ target_id: string }>).map(({ target_id }) => target_id));
  },
  addRelationship(ownerId: string, kind: RelationshipKind, targetId: string) {
    database.prepare(`
      INSERT OR IGNORE INTO relationships (owner_id, kind, target_id) VALUES (?, ?, ?)
    `).run(ownerId, kind, targetId);
  },
  removeRelationship(ownerId: string, kind: RelationshipKind, targetId: string) {
    database.prepare(`
      DELETE FROM relationships WHERE owner_id = ? AND kind = ? AND target_id = ?
    `).run(ownerId, kind, targetId);
  },
};
