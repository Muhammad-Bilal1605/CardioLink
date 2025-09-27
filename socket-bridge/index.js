import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

// Enhanced CORS configuration for both Flutter and React
const allowedOrigins = [
  "http://localhost:3000",        // React CardioLink dev
  "http://localhost:5173",        // Vite React dev
  "http://localhost:5002",        // Your MERN server
  "http://localhost:5000",        // Flutter backend
  "http://localhost:8080",        // Flutter web
  "http://localhost:8081",        // Flutter debug
  "http://127.0.0.1:5000",        // Flutter backend alternative
  "http://127.0.0.1:8080",        // Flutter web alternative
  "http://192.168.1.8:5000",      // Your network IP for Flutter
  "http://192.168.1.3:5000",      // Your network IP alternative
  "http://10.0.2.2:3001",         // Android emulator
  "capacitor://localhost",        // Capacitor apps
  "ionic://localhost",            // Ionic apps
];

app.use(cors({
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin || 'no origin'}`);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list or is a local/development origin
    if (allowedOrigins.includes(origin) || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('192.168.') ||
        origin.includes('10.0.') ||
        origin.includes('172.')) {
      console.log('✅ Origin allowed');
      return callback(null, true);
    }
    
    console.log('❌ Origin not allowed by CORS');
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

app.use(express.json());

// In-memory storage for messages and user sessions
const activeUsers = new Map(); // socketId -> user info
const userSessions = new Map(); // userId -> Set of socketIds
const chatRooms = new Map(); // roomId -> messages[]
const userRooms = new Map(); // userId -> Set of roomIds

// Socket.io configuration
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || 
          allowedOrigins.includes(origin) || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('192.168.') ||
          origin.includes('10.0.')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000
});

// Helper functions
const generateRoomId = (doctorId, patientId) => {
  const ids = [doctorId, patientId].sort();
  return `room_${ids.join('_')}`;
};

const addUserSession = (userId, socketId, userInfo) => {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  userSessions.get(userId).add(socketId);
  activeUsers.set(socketId, userInfo);
  console.log(`👤 Added session for ${userInfo.name} (${userId}): ${socketId}`);
};

const removeUserSession = (userId, socketId) => {
  if (userSessions.has(userId)) {
    userSessions.get(userId).delete(socketId);
    if (userSessions.get(userId).size === 0) {
      userSessions.delete(userId);
      console.log(`👤 Removed all sessions for user: ${userId}`);
    }
  }
  activeUsers.delete(socketId);
};

const getUserSessions = (userId) => {
  return userSessions.get(userId) || new Set();
};

const broadcastToUser = (userId, event, data) => {
  const sessions = getUserSessions(userId);
  sessions.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
      console.log(`📤 Broadcasted ${event} to ${userId} session: ${socketId}`);
    }
  });
};

const saveMessage = (roomId, messageData) => {
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, []);
  }
  
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...messageData,
    timestamp: new Date().toISOString(),
    status: 'sent'
  };
  
  chatRooms.get(roomId).push(message);
  console.log(`💾 Message saved to ${roomId}: ${message.text?.substring(0, 50)}...`);
  return message;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Socket Bridge Server is running',
    timestamp: new Date().toISOString(),
    stats: {
      activeConnections: io.engine.clientsCount,
      activeUsers: activeUsers.size,
      userSessions: userSessions.size,
      chatRooms: chatRooms.size
    }
  });
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id} at ${new Date().toISOString()}`);
  
  // Send connection confirmation
  socket.emit('connected', {
    socketId: socket.id,
    serverTime: new Date().toISOString(),
    message: 'Connected to Socket Bridge Server'
  });

  // Handle user registration (works for both Flutter and React)
  socket.on('join_user', (data) => {
    const { userId, userType, name } = data;
    console.log(`👋 User joining: ${name} (${userType}) - ${userId}`);
    
    const userInfo = {
      userId,
      userType,
      name,
      socketId: socket.id,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    
    addUserSession(userId, socket.id, userInfo);
    
    // Join user to their personal room
    socket.join(`user_${userId}`);
    
    socket.emit('user_joined', {
      success: true,
      userId,
      userType,
      message: 'Successfully joined'
    });
    
    // Notify others about user status
    socket.broadcast.emit('user_status_update', {
      userId,
      userType,
      name,
      status: 'online',
      timestamp: new Date().toISOString()
    });
  });

  // Handle Flutter-style registration
  socket.on('authenticate', (data) => {
    const { userId, userType, name, avatar, email, specialization } = data;
    console.log(`🔐 Authentication: ${name} (${userType}) - ${userId}`);
    
    const userInfo = {
      userId,
      userType,
      name,
      avatar: avatar || '',
      email: email || '',
      specialization: specialization || '',
      socketId: socket.id,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    
    addUserSession(userId, socket.id, userInfo);
    
    // Join user to their personal room
    socket.join(`user_${userId}`);
    
    socket.emit('authenticated', {
      success: true,
      userId,
      userType,
      name,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Notify others about user status
    socket.broadcast.emit('user_status_change', {
      userId,
      userType,
      name,
      status: 'online',
      timestamp: new Date().toISOString()
    });
  });

  // Handle joining chat rooms
  socket.on('join_chat_room', (data) => {
    const { roomId, userId } = data;
    console.log(`🏠 User ${userId} joining chat room: ${roomId}`);
    
    socket.join(roomId);
    
    // Add room to user's room list
    if (!userRooms.has(userId)) {
      userRooms.set(userId, new Set());
    }
    userRooms.get(userId).add(roomId);
    
    socket.emit('chat_room_joined', {
      success: true,
      roomId,
      messages: chatRooms.get(roomId) || [],
      timestamp: new Date().toISOString()
    });
    
    // Notify others in room
    socket.to(roomId).emit('user_joined_room', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle React/MERN style room joining
  socket.on('join_chat', (data) => {
    const { doctorId, patientId } = data;
    const roomId = generateRoomId(doctorId, patientId);
    const user = activeUsers.get(socket.id);
    
    console.log(`🏠 Join chat: Doctor ${doctorId} + Patient ${patientId} = Room ${roomId}`);
    
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    socket.join(roomId);
    
    // Add room to user's room list
    if (!userRooms.has(user.userId)) {
      userRooms.set(user.userId, new Set());
    }
    userRooms.get(user.userId).add(roomId);
    
    const existingMessages = chatRooms.get(roomId) || [];
    
    socket.emit('room_joined', {
      roomId,
      doctorId,
      patientId,
      messages: existingMessages,
      timestamp: new Date().toISOString()
    });
  });

  // Handle message sending - Universal handler for both apps
  socket.on('send_message', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }

    console.log(`📤 Message from ${user.name}:`, {
      type: data.type || 'text',
      hasText: !!data.text,
      roomId: data.roomId || 'auto-generated'
    });

    let roomId = data.roomId;
    
    // Handle different message formats
    if (!roomId) {
      // Try to generate room ID from doctor/patient IDs
      const doctorId = data.doctorId || (user.userType === 'doctor' ? user.userId : data.receiverId);
      const patientId = data.patientId || (user.userType === 'patient' ? user.userId : data.senderId);
      
      if (doctorId && patientId) {
        roomId = generateRoomId(doctorId, patientId);
      } else {
        console.error('❌ Cannot determine room ID for message');
        socket.emit('error', { message: 'Cannot determine chat room' });
        return;
      }
    }

    // Create standardized message format
    const messageData = {
      senderId: user.userId,
      senderName: user.name,
      senderType: user.userType,
      receiverId: data.receiverId || data.patientId || data.doctorId,
      text: data.text || data.message || '',
      type: data.type || 'text',
      roomId: roomId,
      doctorId: user.userType === 'doctor' ? user.userId : (data.doctorId || data.receiverId),
      patientId: user.userType === 'patient' ? user.userId : (data.patientId || data.receiverId),
      mediaUrl: data.mediaUrl || data.audioUrl || null
    };

    // Save message
    const savedMessage = saveMessage(roomId, messageData);

    // Broadcast to room
    io.to(roomId).emit('new_message', savedMessage);
    io.to(roomId).emit('receive_message', savedMessage); // For backward compatibility

    // Send confirmation to sender
    socket.emit('message_sent', {
      success: true,
      messageId: savedMessage.id,
      timestamp: savedMessage.timestamp,
      roomId: roomId
    });

    console.log(`✅ Message broadcasted to room: ${roomId}`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    let roomId = data.roomId;
    if (!roomId && data.doctorId && data.patientId) {
      roomId = generateRoomId(data.doctorId, data.patientId);
    }

    if (roomId) {
      socket.to(roomId).emit('user_typing', {
        userId: user.userId,
        userType: user.userType,
        name: user.name,
        roomId: roomId,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('stop_typing', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    let roomId = data.roomId;
    if (!roomId && data.doctorId && data.patientId) {
      roomId = generateRoomId(data.doctorId, data.patientId);
    }

    if (roomId) {
      socket.to(roomId).emit('user_stop_typing', {
        userId: user.userId,
        userType: user.userType,
        name: user.name,
        roomId: roomId,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('typing_start', (data) => {
    // Handle Flutter typing format
    socket.emit('typing', data);
  });

  socket.on('typing_stop', (data) => {
    // Handle Flutter typing format
    socket.emit('stop_typing', data);
  });

  // Handle message read receipts
  socket.on('mark_messages_read', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { roomId, messageIds } = data;
    
    socket.to(roomId).emit('messages_read', {
      messageIds: messageIds || [],
      readBy: user.userId,
      readAt: new Date().toISOString()
    });
  });

  // Handle status updates
  socket.on('update_status', (data) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    user.status = data.status;
    user.lastSeen = new Date().toISOString();

    socket.broadcast.emit('user_status_change', {
      userId: user.userId,
      status: data.status,
      userType: user.userType,
      name: user.name,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    const user = activeUsers.get(socket.id);
    
    if (user) {
      console.log(`👋 User disconnected: ${user.name} (${user.userType}) - Reason: ${reason}`);
      
      // Remove from sessions
      removeUserSession(user.userId, socket.id);
      
      // Check if user has other active sessions
      const remainingSessions = getUserSessions(user.userId);
      
      if (remainingSessions.size === 0) {
        // User is completely offline
        socket.broadcast.emit('user_status_change', {
          userId: user.userId,
          status: 'offline',
          userType: user.userType,
          name: user.name,
          timestamp: new Date().toISOString()
        });

        // Clean up user rooms
        if (userRooms.has(user.userId)) {
          userRooms.delete(user.userId);
        }
      }
    } else {
      console.log(`👋 Unknown user disconnected: ${socket.id} - Reason: ${reason}`);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });
});

// Server startup
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n🚀 Socket Bridge Server started successfully!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket endpoint: ws://localhost:${PORT}`);
  console.log(`\n🔗 Connection endpoints for your apps:`);
  console.log(`   Flutter Backend: Update socket URL to ws://localhost:${PORT}`);
  console.log(`   React CardioLink: Update socket URL to http://localhost:${PORT}`);
  console.log(`\n✅ Ready to bridge messages between Flutter and React apps!`);
  console.log(`📋 Allowed origins: ${allowedOrigins.slice(0, 5).join(', ')}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Socket Bridge Server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Log stats every 30 seconds
setInterval(() => {
  console.log(`📊 Bridge Stats: ${activeUsers.size} active users, ${chatRooms.size} chat rooms, ${io.engine.clientsCount} connections`);
}, 30000);