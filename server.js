const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
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

app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const userMessages = messages.filter(
    m => (m.from === userId || m.to === userId)
  );
  res.json(userMessages);
});

app.get('/api/call-history', (req, res) => {
  res.json(callHistory.slice(-50));
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

  // Send message (1:1 or group). Trust socket.id for the sender identity
  // rather than a client-supplied `from` — clients don't know their own
  // socket.id ahead of time, and trusting the client invites impersonation.
  socket.on('sendMessage', (data) => {
    const { to, message, fromName, groupId, type = 'text', mediaUrl } = data;
    if ((to || groupId) && message) {
      const messageObj = {
        id: uuidv4(),
        from: socket.id,
        fromName: fromName || users[socket.id]?.name,
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

const PORT = process.env.PORT || 12345;
server.listen(PORT, () => {
  console.log(`✅ Skype-like app running on http://localhost:${PORT}`);
});