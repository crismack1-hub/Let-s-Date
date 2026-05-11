import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

export type SeededProfile = {
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
  gender: string;
  lookingFor: string;
  height: string;
  bodyType: string;
  education: string;
  occupation: string;
  smoking: boolean;
  drinking: boolean;
  zodiacSign: string;
};

const portrait = (gender: "men" | "women", n: number) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

const profiles: SeededProfile[] = [
  {
    id: "p-001",
    name: "Olivia Carter",
    age: 28,
    bio: "Architect by day, watercolour painter by night. Looking for someone who'll explore farmers markets and quiet bookshops with me.",
    photos: [portrait("women", 12), portrait("women", 13)],
    location: "Brooklyn, NY",
    interests: ["Art", "Travel", "Coffee", "Books", "Hiking"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'7\"",
    bodyType: "Slim",
    education: "Master's",
    occupation: "Architect",
    smoking: false,
    drinking: true,
    zodiacSign: "Libra",
  },
  {
    id: "p-002",
    name: "Marcus Hill",
    age: 32,
    bio: "Software engineer who'd rather be outdoors. Trail runner, beginner sourdough baker, dad jokes on tap.",
    photos: [portrait("men", 22), portrait("men", 23)],
    location: "Austin, TX",
    interests: ["Fitness", "Foodie", "Music", "Travel", "Pets"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "6'1\"",
    bodyType: "Athletic",
    education: "Bachelor's",
    occupation: "Software Engineer",
    smoking: false,
    drinking: true,
    zodiacSign: "Taurus",
  },
  {
    id: "p-003",
    name: "Priya Sharma",
    age: 26,
    bio: "Pediatric nurse, salsa dancer, dog mum. I'll out-laugh you and out-spice you.",
    photos: [portrait("women", 33), portrait("women", 34)],
    location: "Toronto, ON",
    interests: ["Music", "Foodie", "Pets", "Travel", "Movies"],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'4\"",
    bodyType: "Average",
    education: "Bachelor's",
    occupation: "Nurse",
    smoking: false,
    drinking: false,
    zodiacSign: "Cancer",
  },
  {
    id: "p-004",
    name: "Daniel Ogundele",
    age: 30,
    bio: "Documentary photographer, slow-coffee enthusiast. I'm happiest with a camera in hand and a good conversation.",
    photos: [portrait("men", 45)],
    location: "London, UK",
    interests: ["Art", "Travel", "Coffee", "Movies", "Books"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Open to anything",
    height: "5'11\"",
    bodyType: "Athletic",
    education: "Master's",
    occupation: "Photographer",
    smoking: false,
    drinking: true,
    zodiacSign: "Virgo",
  },
  {
    id: "p-005",
    name: "Sofia Russo",
    age: 29,
    bio: "Teacher who reads too much. Pasta connoisseur. Looking for someone honest, kind, and a little mischievous.",
    photos: [portrait("women", 50)],
    location: "Melbourne, AU",
    interests: ["Books", "Foodie", "Art", "Coffee", "Travel"],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'6\"",
    bodyType: "Average",
    education: "Bachelor's",
    occupation: "Teacher",
    smoking: false,
    drinking: true,
    zodiacSign: "Pisces",
  },
  {
    id: "p-006",
    name: "Liam O'Connor",
    age: 34,
    bio: "Carpenter, surfer, and shocked-good cook. Two rescue dogs share the bed.",
    photos: [portrait("men", 60), portrait("men", 61)],
    location: "Cork, IE",
    interests: ["Pets", "Fitness", "Foodie", "Music"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "6'0\"",
    bodyType: "Athletic",
    education: "Trade school",
    occupation: "Carpenter",
    smoking: false,
    drinking: true,
    zodiacSign: "Scorpio",
  },
  {
    id: "p-007",
    name: "Aisha Khan",
    age: 27,
    bio: "Product designer + amateur DJ. Tea, not coffee. Will lose every Mario Kart.",
    photos: [portrait("women", 65)],
    location: "Berlin, DE",
    interests: ["Music", "Art", "Travel", "Movies"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Open to anything",
    height: "5'5\"",
    bodyType: "Slim",
    education: "Master's",
    occupation: "Product Designer",
    smoking: false,
    drinking: false,
    zodiacSign: "Gemini",
  },
  {
    id: "p-008",
    name: "James Walker",
    age: 36,
    bio: "Single dad. Marathon runner. Believes in real conversations and bad puns.",
    photos: [portrait("men", 71)],
    location: "Seattle, WA",
    interests: ["Fitness", "Books", "Foodie", "Pets"],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "6'2\"",
    bodyType: "Athletic",
    education: "Bachelor's",
    occupation: "Civil Engineer",
    smoking: false,
    drinking: true,
    zodiacSign: "Capricorn",
  },
  {
    id: "p-009",
    name: "Mei Chen",
    age: 31,
    bio: "Pastry chef. Hike, swim, eat, repeat. Tell me your weirdest hobby.",
    photos: [portrait("women", 78)],
    location: "Vancouver, BC",
    interests: ["Foodie", "Hiking", "Travel", "Art"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'3\"",
    bodyType: "Average",
    education: "Culinary school",
    occupation: "Pastry Chef",
    smoking: false,
    drinking: true,
    zodiacSign: "Aquarius",
  },
  {
    id: "p-010",
    name: "Theo Lambert",
    age: 33,
    bio: "Veterinarian. Always smell faintly of dog. I watch documentaries on dates so you can pick what's next.",
    photos: [portrait("men", 83)],
    location: "Lyon, FR",
    interests: ["Pets", "Movies", "Travel", "Books"],
    verified: false,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "5'10\"",
    bodyType: "Average",
    education: "Doctorate",
    occupation: "Veterinarian",
    smoking: false,
    drinking: true,
    zodiacSign: "Aries",
  },
  {
    id: "p-011",
    name: "Hannah Becker",
    age: 25,
    bio: "Climate researcher. Bouldering 3x a week. Will absolutely talk about glaciers on date one.",
    photos: [portrait("women", 88)],
    location: "Zurich, CH",
    interests: ["Hiking", "Fitness", "Books", "Coffee"],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'8\"",
    bodyType: "Athletic",
    education: "Doctorate",
    occupation: "Climate Researcher",
    smoking: false,
    drinking: false,
    zodiacSign: "Sagittarius",
  },
  {
    id: "p-012",
    name: "Noah Patel",
    age: 29,
    bio: "Jazz pianist & math tutor. I cook a stupidly good biryani. Looking for kind, curious, communicative.",
    photos: [portrait("men", 94)],
    location: "Boston, MA",
    interests: ["Music", "Foodie", "Books", "Art"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "5'9\"",
    bodyType: "Average",
    education: "Master's",
    occupation: "Math Tutor / Musician",
    smoking: false,
    drinking: true,
    zodiacSign: "Leo",
  },
  {
    id: "p-013",
    name: "Camila Vargas",
    age: 28,
    bio: "Physiotherapist & yoga teacher. Beach person. Looking for warm, present, real.",
    photos: [portrait("women", 41)],
    location: "Barcelona, ES",
    interests: ["Fitness", "Travel", "Foodie", "Pets"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'5\"",
    bodyType: "Athletic",
    education: "Bachelor's",
    occupation: "Physiotherapist",
    smoking: false,
    drinking: true,
    zodiacSign: "Libra",
  },
  {
    id: "p-014",
    name: "Ethan Brooks",
    age: 31,
    bio: "Wildlife guide. Slept under more stars than ceilings. Patient listener, terrible at small talk.",
    photos: [portrait("men", 30)],
    location: "Cape Town, ZA",
    interests: ["Hiking", "Travel", "Pets", "Books"],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "6'1\"",
    bodyType: "Athletic",
    education: "Bachelor's",
    occupation: "Wildlife Guide",
    smoking: false,
    drinking: true,
    zodiacSign: "Sagittarius",
  },
  {
    id: "p-015",
    name: "Anya Volkova",
    age: 27,
    bio: "Ballet dancer turned PT. Reader of long Russian novels. Looking for someone with depth.",
    photos: [portrait("women", 17)],
    location: "Prague, CZ",
    interests: ["Art", "Books", "Fitness", "Music"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'7\"",
    bodyType: "Slim",
    education: "Bachelor's",
    occupation: "Personal Trainer",
    smoking: false,
    drinking: false,
    zodiacSign: "Virgo",
  },
  {
    id: "p-016",
    name: "Diego Fernandez",
    age: 35,
    bio: "Restaurateur. Fluent in three languages and one bad-pun dialect. I'll cook, you bring stories.",
    photos: [portrait("men", 11)],
    location: "Mexico City, MX",
    interests: ["Foodie", "Travel", "Music", "Art"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "5'10\"",
    bodyType: "Average",
    education: "Bachelor's",
    occupation: "Restaurateur",
    smoking: false,
    drinking: true,
    zodiacSign: "Cancer",
  },
  {
    id: "p-017",
    name: "Grace Kim",
    age: 26,
    bio: "Indie filmmaker. I cry at trailers. Tell me what you're watching.",
    photos: [portrait("women", 24)],
    location: "Los Angeles, CA",
    interests: ["Movies", "Art", "Coffee", "Music"],
    verified: false,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Open to anything",
    height: "5'4\"",
    bodyType: "Slim",
    education: "Bachelor's",
    occupation: "Filmmaker",
    smoking: false,
    drinking: true,
    zodiacSign: "Pisces",
  },
  {
    id: "p-018",
    name: "Henrik Dahl",
    age: 38,
    bio: "Furniture designer. Steady, warm, slightly introverted. Hiking, sailing, slow weekends.",
    photos: [portrait("men", 52)],
    location: "Copenhagen, DK",
    interests: ["Art", "Hiking", "Travel", "Books"],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "6'2\"",
    bodyType: "Athletic",
    education: "Master's",
    occupation: "Designer",
    smoking: false,
    drinking: true,
    zodiacSign: "Capricorn",
  },
  {
    id: "p-019",
    name: "Layla Hassan",
    age: 30,
    bio: "Civil-rights lawyer. Reader of Baldwin and bell hooks. Sunday brunch is sacred.",
    photos: [portrait("women", 56)],
    location: "Washington, DC",
    interests: ["Books", "Foodie", "Movies", "Art"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Female",
    lookingFor: "Long-term",
    height: "5'7\"",
    bodyType: "Average",
    education: "Doctorate",
    occupation: "Lawyer",
    smoking: false,
    drinking: true,
    zodiacSign: "Scorpio",
  },
  {
    id: "p-020",
    name: "Ben Adler",
    age: 29,
    bio: "Climate-tech founder. Long walks, longer playlists. Ask me about my fermentation experiments.",
    photos: [portrait("men", 38)],
    location: "Amsterdam, NL",
    interests: ["Foodie", "Hiking", "Music", "Coffee"],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: "Male",
    lookingFor: "Long-term",
    height: "5'11\"",
    bodyType: "Average",
    education: "Master's",
    occupation: "Founder",
    smoking: false,
    drinking: true,
    zodiacSign: "Aquarius",
  },
];

const likes = new Map<string, Set<string>>();
const favorites = new Map<string, Set<string>>();
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
    photos: [portrait("men", 5)],
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
  const filtered = profiles.filter((p) => p.age >= ageMin && p.age <= ageMax);
  res.json(filtered);
});

router.get("/likes", (req: AuthedRequest, res) => {
  // "People who liked you" — return seeded profiles the user hasn't liked back yet,
  // so liking back here removes them from this list and they appear in matches instead.
  const myLikes = Array.from(likes.get(req.userId!) ?? []);
  const incoming = profiles.filter((p) => !myLikes.includes(p.id)).slice(0, 6);
  res.json(incoming);
});

router.post("/likes", (req: AuthedRequest, res) => {
  const { toUserId } = req.body;
  if (!toUserId) return res.status(400).json({ error: "toUserId required" });
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

  const enriched = profiles
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

router.get("/conversations", (req: AuthedRequest, res) => {
  const myLikes = Array.from(likes.get(req.userId!) ?? []);
  const list = profiles
    .filter((p) => myLikes.includes(p.id))
    .map((p) => ({
      id: `conv-${p.id}`,
      userId: p.id,
      userName: p.name,
      userPhoto: p.photos[0],
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
