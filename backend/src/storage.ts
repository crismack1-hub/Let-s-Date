import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

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

const users = new Map<string, User>();
const messages: Message[] = [];
const groups = new Map<string, Group>();
const statuses: Status[] = [];

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
    users.set(id, user);
    return user;
  },
  async verifyCredentials(phone: string, password: string) {
    const user = Array.from(users.values()).find((item) => item.phone === phone);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  },
  findUserById(id: string) {
    return users.get(id) ?? null;
  },
  findUserByPhone(phone: string) {
    return Array.from(users.values()).find((item) => item.phone === phone) ?? null;
  },
  addMessage(message: Message) {
    messages.push(message);
    return message;
  },
  getConversation(roomId: string) {
    return messages.filter((message) => message.roomId === roomId);
  },
  createGroup(name: string, ownerId: string, members: string[]) {
    const group: Group = {
      id: randomUUID(),
      name,
      adminIds: [ownerId],
      members,
      createdAt: new Date().toISOString(),
    };
    groups.set(group.id, group);
    return group;
  },
  getGroup(id: string) {
    return groups.get(id) ?? null;
  },
  addStatus(status: Status) {
    statuses.push(status);
    return status;
  },
  listStatuses() {
    return statuses.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
