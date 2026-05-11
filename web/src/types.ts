export type User = {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: string;
  interests: string[];
  verified: boolean;
  online: boolean;
  lastSeen: string;
};

export type UserProfile = User & {
  gender: string;
  lookingFor: string;
  height: string;
  bodyType: string;
  education: string;
  occupation: string;
  smoking: boolean;
  drinking: boolean;
  zodiacSign: string;
  email?: string;
  phone?: string;
  showEmail?: boolean;
  showPhone?: boolean;
};

export type Match = {
  id: string;
  userId: string;
  user: UserProfile;
  matchedAt: string;
  likedBy: boolean;
  favorited?: boolean;
  interestOverlap?: number;
};

export type Message = {
  id: string;
  from: string;
  to: string;
  body: string;
  type?: "text" | "voice-note";
  audioUrl?: string;
  audioDurationMs?: number;
  roomId?: string | null;
  createdAt: string;
  read: boolean;
};

export type Like = {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
};

export type NotificationEvent = {
  id: string;
  type: "like" | "match" | "message" | "visit";
  fromUser: string;
  fromUserPhoto: string;
  createdAt: string;
  read: boolean;
};
