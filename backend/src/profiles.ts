import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const jwtSecret = process.env.JWT_SECRET ?? "development-secret";


const likes = new Map<string, Set<string>>();
const favorites = new Map<string, Set<string>>();
const friends = new Map<string, Set<string>>();
const profileOverrides = new Map<string, Record<string, unknown>>();

function parseMatchId(matchId: string): string {
  return matchId.startsWith("match-") ? matchId.slice("match-".length) : matchId;
}

const editableFields = new Set([
  "name",
  "age",
  "bio",
  "photos",
  "location",
  "interests",
  "gender",
  "lookingFor",
  "height",
  "bodyType",
  "education",
  "occupation",
  "smoking",
  "drinking",
  "zodiacSign",
  "email",
  "phone",
  "showEmail",
  "showPhone",
]);

function defaultProfile(userId: string) {
  return {
    id: userId,
    name: "You",
    age: 28,
    bio: "Tell people about yourself.",
    photos: [],
    location: "Set your location in Settings",
    interests: [],
    verified: false,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Prefer not to say",
    lookingFor: "Open to anything",
    height: "",
    bodyType: "",
    education: "",
    occupation: "",
    smoking: false,
    drinking: false,
    zodiacSign: "",
    email: "",
    phone: "",
    showEmail: false,
    showPhone: false,
  };
}

function registeredProfiles() {
  return storage.listUsers().map(({ id, name }) => {
    const overrides = profileOverrides.get(id) ?? {};
    return {
      ...defaultProfile(id),
      ...overrides,
      id,
      name: typeof overrides.name === "string" ? overrides.name : name,
    };
  });
}

interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.header("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "missing token" });
  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

const router = Router();

router.use(requireAuth);

router.get("/profile", (req: AuthedRequest, res) => {
  const overrides = profileOverrides.get(req.userId!) ?? {};
  res.json({ ...defaultProfile(req.userId!), ...overrides });
});

router.put("/profile", (req: AuthedRequest, res) => {
  const updates = req.body ?? {};
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (editableFields.has(key)) filtered[key] = value;
  }
  const current = profileOverrides.get(req.userId!) ?? {};
  const next = { ...current, ...filtered };
  profileOverrides.set(req.userId!, next);
  res.json({ ...defaultProfile(req.userId!), ...next });
});

router.get("/discover", (req: AuthedRequest, res) => {
  const ageMin = parseInt(String(req.query.ageMin ?? 18), 10);
  const ageMax = parseInt(String(req.query.ageMax ?? 100), 10);
  const filtered = registeredProfiles()
    .filter(({ id }) => id !== req.userId)
    .filter((profile) => {
      const photos: unknown = profile.photos;
      return (
        profile.age >= ageMin &&
        profile.age <= ageMax &&
        Array.isArray(photos) &&
        photos.some((photo: unknown) => typeof photo === "string" && photo.trim().length > 0)
      );
    });
  res.json(filtered);
});

router.get("/likes", (req: AuthedRequest, res) => {
  const myLikes = Array.from(likes.get(req.userId!) ?? []);
  const incoming = registeredProfiles()
    .filter(
      (profile) =>
        profile.id !== req.userId &&
        !myLikes.includes(profile.id) &&
        (likes.get(profile.id)?.has(req.userId!) ?? false),
    )
    .slice(0, 6);
  res.json(incoming);
});

router.post("/likes", (req: AuthedRequest, res) => {
  const { toUserId } = req.body;
  if (!toUserId) return res.status(400).json({ error: "toUserId required" });
  if (toUserId === req.userId || !storage.listUsers().some((user) => user.id === toUserId)) {
    return res.status(404).json({ error: "Profile not found" });
  }
  if (!likes.has(req.userId!)) likes.set(req.userId!, new Set());
  likes.get(req.userId!)!.add(toUserId);
  res.json({ ok: true, toUserId });
});

router.get("/matches", (req: AuthedRequest, res) => {
  const type = String(req.query.type ?? "all");
  const myLikes = Array.from(likes.get(req.userId!) ?? []);
  const myProfile = { ...defaultProfile(req.userId!), ...(profileOverrides.get(req.userId!) ?? {}) };
  const myInterests = ((myProfile.interests as string[]) ?? []).map((i) => i.toLowerCase());

  const overlapPercent = (theirInterests: string[]) => {
    if (!myInterests.length || !theirInterests.length) return 0;
    const theirs = theirInterests.map((i) => i.toLowerCase());
    const shared = theirs.filter((i) => myInterests.includes(i)).length;
    // Jaccard: shared / union — symmetric, easy to interpret
    const union = new Set([...myInterests, ...theirs]).size;
    return union === 0 ? 0 : Math.round((shared / union) * 100);
  };

  const enriched = registeredProfiles()
    .filter((profile) => profile.id !== req.userId)
    .map((p) => ({ p, overlap: overlapPercent(p.interests ?? []) }))
    .filter(({ p, overlap }) => myLikes.includes(p.id) || overlap >= 50);

  let matched = enriched;
  if (type === "recent") matched = matched.slice(0, 5);
  matched = [...matched].sort((a, b) => b.overlap - a.overlap);

  const myFavorites = favorites.get(req.userId!) ?? new Set<string>();

  res.json(
    matched.map(({ p, overlap }) => ({
      id: `match-${p.id}`,
      userId: p.id,
      user: p,
      matchedAt: new Date().toISOString(),
      likedBy: myLikes.includes(p.id),
      favorited: myFavorites.has(p.id),
      interestOverlap: overlap,
    })),
  );
});

router.post("/matches/:id/favorite", (req: AuthedRequest, res) => {
  const targetUserId = parseMatchId(req.params.id);
  if (!favorites.has(req.userId!)) favorites.set(req.userId!, new Set());
  const set = favorites.get(req.userId!)!;
  const wasFavorited = set.has(targetUserId);
  if (wasFavorited) set.delete(targetUserId);
  else set.add(targetUserId);
  res.json({ ok: true, favorited: !wasFavorited });
});

router.delete("/matches/:id", (req: AuthedRequest, res) => {
  const targetUserId = parseMatchId(req.params.id);
  likes.get(req.userId!)?.delete(targetUserId);
  favorites.get(req.userId!)?.delete(targetUserId);
  res.json({ ok: true });
});

router.get("/friends", (req: AuthedRequest, res) => {
  const friendIds = friends.get(req.userId!) ?? new Set<string>();
  res.json(registeredProfiles().filter((profile) => friendIds.has(profile.id)));
});

router.post("/friends/:id", (req: AuthedRequest, res) => {
  const friendId = req.params.id;
  if (friendId === req.userId || !storage.listUsers().some((user) => user.id === friendId)) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (!friends.has(req.userId!)) friends.set(req.userId!, new Set<string>());
  friends.get(req.userId!)!.add(friendId);
  return res.json({ ok: true, friendId });
});

router.delete("/friends/:id", (req: AuthedRequest, res) => {
  friends.get(req.userId!)?.delete(req.params.id);
  res.json({ ok: true });
});

router.get("/conversations", (req: AuthedRequest, res) => {
  const myLikes = Array.from(likes.get(req.userId!) ?? []);
  const list = registeredProfiles()
    .filter((p) => myLikes.includes(p.id))
    .map((p) => ({
      id: `conv-${p.id}`,
      userId: p.id,
      userName: p.name,
      userPhoto: p.photos[0] ?? "",
      lastMessage: "Say hi to start the conversation.",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      online: p.online,
    }));
  res.json(list);
});

router.get("/unread-counts", (_req: AuthedRequest, res) => {
  res.json({ messages: 0, likes: 0 });
});

export { router as profilesRouter };
