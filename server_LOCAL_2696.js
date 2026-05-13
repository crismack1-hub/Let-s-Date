const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  maxHttpBufferSize: 5e6,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// In-memory storage
let users = {};
let messages = [];
let callHistory = [];
let groups = {};
let statuses = {};
let messageReactions = {};
const likedProfileIdsByUser = {};
const favoriteMatchIdsByUser = {};
const incomingLikeIdsByUser = {};

const sampleProfiles = [
  {
    id: 'sample-maya',
    name: 'Maya',
    age: 29,
    bio: 'Weekend hikes, tiny restaurants, live jazz, and a very serious coffee map. Looking for someone kind who still gets excited about small adventures.',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    ],
    location: 'Brisbane',
    interests: ['Hiking', 'Coffee', 'Travel', 'Music', 'Foodie'],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: 'Woman',
    lookingFor: 'Long-term',
    height: '168 cm',
    bodyType: 'Athletic',
    education: "Master's",
    occupation: 'UX researcher',
    smoking: false,
    drinking: true,
    zodiacSign: '♎ Libra',
  },
  {
    id: 'sample-noah',
    name: 'Noah',
    age: 32,
    bio: 'Designer, amateur cook, and beach walk loyalist. I like people who can talk about big ideas and also laugh at a terrible pun.',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    ],
    location: 'Gold Coast',
    interests: ['Cooking', 'Art', 'Movies', 'Outdoors', 'Coffee'],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    gender: 'Man',
    lookingFor: 'Open to anything',
    height: '183 cm',
    bodyType: 'Average',
    education: "Bachelor's",
    occupation: 'Product designer',
    smoking: false,
    drinking: true,
    zodiacSign: '♊ Gemini',
  },
  {
    id: 'sample-ava',
    name: 'Ava',
    age: 27,
    bio: 'Books, markets, pilates, and late breakfasts. I am happiest around curious people who make ordinary days feel warm.',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
    ],
    location: 'Brisbane',
    interests: ['Books', 'Yoga', 'Foodie', 'Photography', 'Volunteering'],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: 'Woman',
    lookingFor: 'Long-term',
    height: '165 cm',
    bodyType: 'Slim',
    education: "Bachelor's",
    occupation: 'Teacher',
    smoking: false,
    drinking: false,
    zodiacSign: '♓ Pisces',
  },
  {
    id: 'sample-eli',
    name: 'Eli',
    age: 35,
    bio: 'Runner, documentary watcher, and enthusiastic home chef. I value honesty, calm confidence, and good playlists.',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
    ],
    location: 'Sunshine Coast',
    interests: ['Fitness', 'Cooking', 'Music', 'Travel', 'Wine'],
    verified: false,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: 'Man',
    lookingFor: 'Long-term',
    height: '178 cm',
    bodyType: 'Athletic',
    education: 'Trade school',
    occupation: 'Landscape architect',
    smoking: false,
    drinking: true,
    zodiacSign: '♑ Capricorn',
  },
  {
    id: 'sample-sienna',
    name: 'Sienna',
    age: 31,
    bio: 'Gallery openings, weekend road trips, and dinners with too many shared plates. Seeking chemistry with emotional availability.',
    photos: [
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80',
    ],
    location: 'Brisbane',
    interests: ['Art', 'Travel', 'Wine', 'Dancing', 'Foodie'],
    verified: true,
    online: false,
    lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    gender: 'Woman',
    lookingFor: 'Open to anything',
    height: '170 cm',
    bodyType: 'Curvy',
    education: "Master's",
    occupation: 'Gallery curator',
    smoking: false,
    drinking: true,
    zodiacSign: '♌ Leo',
  },
  {
    id: 'sample-luca',
    name: 'Luca',
    age: 26,
    bio: 'Guitar, bouldering, gaming nights, and spontaneous swims. I am here for genuine conversation first.',
    photos: [
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=900&q=80',
    ],
    location: 'Brisbane',
    interests: ['Music', 'Gaming', 'Fitness', 'Outdoors', 'Movies'],
    verified: false,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: 'Man',
    lookingFor: 'Open to anything',
    height: '181 cm',
    bodyType: 'Slim',
    education: "Bachelor's",
    occupation: 'Frontend developer',
    smoking: false,
    drinking: false,
    zodiacSign: '♈ Aries',
  },
];

// Auth storage
const authUsers = {};
const authTokens = {};

function createDefaultProfile(id, phone, name) {
  return {
    id,
    phone,
    name,
    age: 30,
    bio: 'New here and ready to meet someone genuine.',
    photos: [`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`],
    location: 'Brisbane',
    interests: ['Coffee', 'Music', 'Travel'],
    verified: true,
    online: true,
    lastSeen: new Date().toISOString(),
    gender: '',
    lookingFor: 'Long-term',
    height: '',
    bodyType: '',
    education: '',
    occupation: '',
    smoking: false,
    drinking: false,
    zodiacSign: '',
    email: '',
    showEmail: false,
    showPhone: false,
  };
}

function createAuthUser(phone, name, password) {
  const id = uuidv4();
  authUsers[id] = {
    ...createDefaultProfile(id, phone, name),
    id,
    phone,
    name,
    password,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
  };
  return authUsers[id];
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = authTokens[token];
  return userId ? authUsers[userId] : null;
}

function publicProfile(user) {
  const { password, ...profile } = user;
  return profile;
}

function getUserSet(store, userId, defaults = []) {
  if (!store[userId]) {
    store[userId] = new Set(defaults);
  }
  return store[userId];
}

function sharedInterestScore(profile, user) {
  const mine = new Set(user.interests || []);
  if (!mine.size || !profile.interests?.length) return 0;
  const shared = profile.interests.filter((interest) => mine.has(interest)).length;
  return Math.round((shared / Math.max(mine.size, profile.interests.length)) * 100);
}

function buildMatchesForUser(user, type = 'all') {
  const liked = getUserSet(likedProfileIdsByUser, user.id, ['sample-maya', 'sample-noah']);
  const favorites = getUserSet(favoriteMatchIdsByUser, user.id);
  const candidates = sampleProfiles.filter((profile) => {
    const overlap = sharedInterestScore(profile, user);
    return liked.has(profile.id) || overlap >= 40;
  });

  let matches = candidates.map((profile) => ({
    id: `match-${profile.id}`,
    userId: profile.id,
    user: profile,
    matchedAt: new Date(Date.now() - (sampleProfiles.findIndex((p) => p.id === profile.id) + 1) * 86400000).toISOString(),
    likedBy: liked.has(profile.id),
    favorited: favorites.has(profile.id),
    interestOverlap: sharedInterestScore(profile, user),
  }));

  if (type === 'recent') {
    matches = matches.slice(0, 3);
  }
  if (type === 'favorites') {
    matches = matches.filter((match) => match.favorited);
  }
  return matches;
}

function findAuthUserByPhone(phone) {
  return Object.values(authUsers).find((user) => user.phone === phone) || null;
}

function createToken(userId) {
  const token = uuidv4();
  authTokens[token] = userId;
  return token;
}

// Seed a demo account so login works immediately
createAuthUser("1234567890", "Demo User", "password123");

// Routes
app.get('/api/users', (req, res) => {
  const userList = Object.values(users).map(u => ({
    id: u.id,
    name: u.name,
    status: u.status,
    avatar: u.avatar,
    lastSeen: u.lastSeen
  }));
  res.json(userList);
});

app.get('/api/groups', (req, res) => {
  res.json(Object.values(groups));
});

app.get('/api/statuses', (req, res) => {
  res.json(Object.values(statuses));
});

app.get('/api/profile', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  return res.json(publicProfile(user));
});

app.put('/api/profile', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const allowedFields = [
    'name',
    'age',
    'bio',
    'photos',
    'location',
    'interests',
    'gender',
    'lookingFor',
    'height',
    'bodyType',
    'education',
    'occupation',
    'smoking',
    'drinking',
    'zodiacSign',
    'email',
    'phone',
    'showEmail',
    'showPhone',
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      user[field] = req.body[field];
    }
  });
  user.avatar = user.photos?.[0] || user.avatar;
  user.lastSeen = new Date().toISOString();

  return res.json(publicProfile(user));
});

app.get('/api/discover', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const ageMin = Number(req.query.ageMin || 18);
  const ageMax = Number(req.query.ageMax || 100);
  const location = String(req.query.location || '').trim().toLowerCase();

  const profiles = sampleProfiles.filter((profile) => {
    if (profile.age < ageMin || profile.age > ageMax) return false;
    if (location && !profile.location.toLowerCase().includes(location)) return false;
    return true;
  });

  res.json(profiles);
});

app.get('/api/likes', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const incoming = getUserSet(incomingLikeIdsByUser, user.id, ['sample-ava', 'sample-eli', 'sample-sienna']);
  res.json(sampleProfiles.filter((profile) => incoming.has(profile.id)));
});

app.post('/api/likes', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { toUserId } = req.body;
  const profile = sampleProfiles.find((candidate) => candidate.id === toUserId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  getUserSet(likedProfileIdsByUser, user.id, ['sample-maya', 'sample-noah']).add(toUserId);
  getUserSet(incomingLikeIdsByUser, user.id, ['sample-ava', 'sample-eli', 'sample-sienna']).delete(toUserId);
  io.emit('new-like', { fromUserId: user.id, toUserId });

  res.status(201).json({
    id: uuidv4(),
    fromUserId: user.id,
    toUserId,
    createdAt: new Date().toISOString(),
    match: true,
  });
});

app.get('/api/matches', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.json(buildMatchesForUser(user, req.query.type || 'all'));
});

app.delete('/api/matches/:matchId', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const profileId = req.params.matchId.replace(/^match-/, '');
  getUserSet(likedProfileIdsByUser, user.id, ['sample-maya', 'sample-noah']).delete(profileId);
  getUserSet(favoriteMatchIdsByUser, user.id).delete(profileId);
  res.status(204).end();
});

app.post('/api/matches/:matchId/favorite', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const profileId = req.params.matchId.replace(/^match-/, '');
  const favorites = getUserSet(favoriteMatchIdsByUser, user.id);
  if (favorites.has(profileId)) {
    favorites.delete(profileId);
  } else {
    favorites.add(profileId);
  }
  res.json({ favorited: favorites.has(profileId) });
});

app.get('/api/unread-counts', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const incoming = getUserSet(incomingLikeIdsByUser, user.id, ['sample-ava', 'sample-eli', 'sample-sienna']);
  res.json({
    messages: messages.filter((message) => !message.read).length,
    likes: incoming.size,
  });
});

app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const userMessages = messages.filter(
    m => (m.from === userId || m.to === userId || m.roomId === userId)
  );
  res.json(userMessages);
});

app.get('/api/conversations', (req, res) => {
  const user = getAuthenticatedUser(req);

  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const conversations = [
    {
      id: 'cross-platform',
      userId: 'cross-platform',
      userName: "Let's Date App",
      userPhoto: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=LetsDate',
      lastMessage: 'Chat with mobile app users',
      lastMessageTime: new Date().toISOString(),
      unreadCount: messages.filter((m) => m.roomId === 'cross-platform-chat' && m.to === 'cross-platform').length,
      online: true,
    },
    ...buildMatchesForUser(user).slice(0, 4).map((match, index) => ({
      id: `conversation-${match.userId}`,
      userId: match.userId,
      userName: match.user.name,
      userPhoto: match.user.photos[0],
      lastMessage: index === 0 ? 'Hey, your profile made me smile.' : 'Want to keep chatting?',
      lastMessageTime: new Date(Date.now() - (index + 1) * 45 * 60 * 1000).toISOString(),
      unreadCount: index === 0 ? 1 : 0,
      online: match.user.online,
    })),
  ];

  res.json(conversations);
});

app.get('/api/call-history', (req, res) => {
  res.json(callHistory.slice(-50));
});

app.get('/api/auth/register', (_req, res) => {
  return res.redirect('http://localhost:5173');
});

app.all('/api/auth/register', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST /api/auth/register' });
  }
  next();
});

app.post('/api/auth/register', (req, res) => {
  const { phone, name, password } = req.body;
  if (!phone || !name || !password) {
    return res.status(400).json({ error: 'phone, name, and password are required' });
  }

  if (findAuthUserByPhone(phone)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const user = createAuthUser(phone, name, password);
  const token = createToken(user.id);
  return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, avatar: user.avatar } });
});

app.get('/api/auth/login', (_req, res) => {
  return res.redirect('http://localhost:5173');
});

app.all('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST /api/auth/login' });
  }
  next();
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password are required' });
  }

  const user = findAuthUserByPhone(phone);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createToken(user.id);
  return res.json({ token, user: { id: user.id, phone: user.phone, name: user.name, avatar: user.avatar } });
});

app.all('/api/auth/verify', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET /api/auth/verify' });
  }
  next();
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const userId = authTokens[token];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const user = authUsers[userId];
  if (!user) {
    return res.status(401).json({ error: 'Invalid user' });
  }

  return res.json({ id: user.id, phone: user.phone, name: user.name, avatar: user.avatar });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User login
  socket.on('login', (userData) => {
    const userId = socket.id;
    users[userId] = {
      id: userId,
      name: userData.name,
      status: 'online',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
      socketId: socket.id,
      lastSeen: new Date().toISOString(),
      bio: 'Hey there! I am using WhatsApp.'
    };

    // Send all users list to everyone
    const userList = Object.values(users).map(u => ({
      id: u.id,
      name: u.name,
      status: u.status,
      avatar: u.avatar,
      lastSeen: u.lastSeen,
      bio: u.bio
    }));

    io.emit('userList', userList);
    io.emit('userOnline', { userId, userName: userData.name });
    io.emit('groupList', Object.values(groups));
    io.emit('statusList', Object.values(statuses));
    console.log('Users online:', Object.keys(users).length);
  });

  socket.on('join-room', (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('direct-message', (payload) => {
    let { to, body, type = 'text', roomId, encryptedPayload, audioUrl, audioDurationMs } = payload;
    if (!body || (!to && !roomId)) return;

    if (!roomId && to === 'cross-platform') {
      roomId = 'cross-platform-chat';
    }

    const messageObj = {
      id: uuidv4(),
      from: socket.id,
      fromName: users[socket.id]?.name || 'Guest',
      to: roomId || to,
      body,
      type,
      audioUrl: audioUrl || null,
      audioDurationMs: audioDurationMs || null,
      roomId: roomId || null,
      encryptedPayload: encryptedPayload || null,
      createdAt: new Date().toISOString(),
      read: false,
    };

    messages.push(messageObj);

    if (roomId) {
      io.to(roomId).emit('message', messageObj);
      io.to(roomId).emit('new-message', messageObj);
    } else if (to && users[to]) {
      io.to(users[to].socketId).emit('message', messageObj);
      io.to(users[to].socketId).emit('new-message', messageObj);
    }

    socket.emit('messageSent', messageObj);
  });

  // Send message (1:1 or group)
  socket.on('sendMessage', (data) => {
    const { to, message, from, fromName, groupId, type = 'text', mediaUrl } = data;
    if (to && message && from) {
      const messageObj = {
        id: uuidv4(),
        from,
        fromName,
        to: groupId || to,
        message,
        type,
        mediaUrl,
        timestamp: new Date().toISOString(),
        read: false,
        reactions: []
      };

      messages.push(messageObj);

      if (groupId) {
        // Send to all group members
        const group = groups[groupId];
        if (group) {
          group.members.forEach(memberId => {
            if (users[memberId] && memberId !== from) {
              io.to(users[memberId].socketId).emit('newMessage', messageObj);
            }
          });
        }
      } else {
        // Send to recipient if online
        if (users[to]) {
          io.to(users[to].socketId).emit('newMessage', messageObj);
        }
      }

      // Send confirmation to sender
      socket.emit('messageSent', messageObj);
    }
  });

  // Create group
  socket.on('createGroup', (data) => {
    const { groupName, members, createdBy } = data;
    const groupId = uuidv4();
    groups[groupId] = {
      id: groupId,
      name: groupName,
      members: [createdBy, ...members],
      createdBy,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${groupName}`,
      createdAt: new Date().toISOString()
    };

    io.emit('groupCreated', groups[groupId]);
    socket.emit('groupCreated', groups[groupId]);
  });

  // Share status
  socket.on('shareStatus', (data) => {
    const { userId, userName, userAvatar, statusText, image } = data;
    const statusId = uuidv4();
    statuses[statusId] = {
      id: statusId,
      userId,
      userName,
      userAvatar,
      text: statusText,
      image,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    io.emit('newStatus', statuses[statusId]);
  });

  // React to message
  socket.on('reactToMessage', (data) => {
    const { messageId, reaction, userId } = data;
    if (!messageReactions[messageId]) {
      messageReactions[messageId] = [];
    }
    messageReactions[messageId].push({ userId, reaction, timestamp: new Date().toISOString() });
    io.emit('messageReaction', { messageId, reaction, userId });
  });

  // Mark message as read
  socket.on('markAsRead', (data) => {
    const { messageId, readBy } = data;
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
      message.readBy = readBy;
      io.emit('messageRead', { messageId, readBy, readAt: new Date().toISOString() });
    }
  });

  // Delete message
  socket.on('deleteMessage', (data) => {
    const { messageId, userId } = data;
    const messageIndex = messages.findIndex(m => m.id === messageId && m.from === userId);
    if (messageIndex !== -1) {
      messages[messageIndex].deleted = true;
      messages[messageIndex].message = 'This message was deleted';
      io.emit('messageDeleted', { messageId });
    }
  });

  // Initiate call (audio/video)
  socket.on('initiateCall', (data) => {
    const { to, fromName, callType } = data;
    const callId = uuidv4();

    if (users[to]) {
      io.to(users[to].socketId).emit('incomingCall', {
        callId,
        from: socket.id,
        fromName,
        callType, // 'audio' or 'video'
        timestamp: new Date().toISOString()
      });

      socket.emit('callInitiated', { callId, to });
    } else {
      socket.emit('callFailed', { error: 'User not available' });
    }
  });

  // Accept call
  socket.on('acceptCall', (data) => {
    const { callId, from, to } = data;

    if (users[from]) {
      io.to(users[from].socketId).emit('callAccepted', {
        callId,
        from: socket.id,
        to: from
      });
    }

    // Log call history
    callHistory.push({
      callId,
      from,
      to: socket.id,
      type: 'call',
      status: 'accepted',
      timestamp: new Date().toISOString()
    });

    socket.emit('callStarted', { callId });
  });

  // Decline call
  socket.on('declineCall', (data) => {
    const { callId, from } = data;

    if (users[from]) {
      io.to(users[from].socketId).emit('callDeclined', { callId });
    }

    callHistory.push({
      callId,
      from: socket.id,
      to: from,
      type: 'call',
      status: 'declined',
      timestamp: new Date().toISOString()
    });
  });

  // End call
  socket.on('endCall', (data) => {
    const { callId, to } = data;

    if (users[to]) {
      io.to(users[to].socketId).emit('callEnded', { callId });
    }
  });

  // WebRTC Signaling
  socket.on('offer', (data) => {
    const { to, offer } = data;
    if (users[to]) {
      io.to(users[to].socketId).emit('offer', { offer, from: socket.id });
    }
  });

  socket.on('answer', (data) => {
    const { to, answer } = data;
    if (users[to]) {
      io.to(users[to].socketId).emit('answer', { answer, from: socket.id });
    }
  });

  socket.on('iceCandidate', (data) => {
    const { to, candidate } = data;
    if (users[to]) {
      io.to(users[to].socketId).emit('iceCandidate', { candidate, from: socket.id });
    }
  });

  // Update presence status
  socket.on('updateStatus', (status) => {
    if (users[socket.id]) {
      users[socket.id].status = status;
      const userList = Object.values(users).map(u => ({
        id: u.id,
        name: u.name,
        status: u.status,
        avatar: u.avatar
      }));
      io.emit('userList', userList);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const { to, typing } = data;
    if (users[to]) {
      io.to(users[to].socketId).emit('userTyping', {
        from: socket.id,
        fromName: users[socket.id]?.name,
        typing
      });
    }
  });

  // Update profile information
  socket.on('updateProfile', (data) => {
    if (users[socket.id]) {
      users[socket.id].name = data.name || users[socket.id].name;
      users[socket.id].bio = data.bio || users[socket.id].bio;
      users[socket.id].status = data.status || users[socket.id].status;
      
      const userList = Object.values(users).map(u => ({
        id: u.id,
        name: u.name,
        status: u.status,
        avatar: u.avatar,
        bio: u.bio
      }));
      io.emit('userList', userList);
      io.emit('profileUpdated', { userId: socket.id, profile: users[socket.id] });
    }
  });

  // Update avatar
  socket.on('updateAvatar', (data) => {
    if (users[socket.id]) {
      users[socket.id].avatar = data.avatar;
      const userList = Object.values(users).map(u => ({
        id: u.id,
        name: u.name,
        status: u.status,
        avatar: u.avatar
      }));
      io.emit('userList', userList);
      io.emit('avatarUpdated', { userId: socket.id, avatar: data.avatar });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date().toISOString();
      const userList = Object.values(users).map(u => ({
        id: u.id,
        name: u.name,
        status: u.status,
        avatar: u.avatar,
        lastSeen: u.lastSeen
      }));
      io.emit('userList', userList);
      io.emit('userOffline', { userId: socket.id, userName: user.name });
      console.log('User disconnected:', socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Skype-like app running on http://localhost:${PORT}`);
});
