// Enhanced Socket.io server for Doctor-Patient real-time communication
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",   // React dev
  "http://localhost:5173",   // Vite dev
  "http://localhost:54331",  // Flutter web
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
}));
app.use(express.json());

// In-memory storage
const rooms = new Map(); // roomId -> messages[]
const users = new Map(); // socketId -> user info
const userSessions = new Map(); // userId -> socketId[]
const doctorPatientRooms = new Map(); // "doctorId_patientId" -> roomId

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    activeConnections: io?.engine?.clientsCount || 0,
    activeRooms: rooms.size,
    activeUsers: users.size,
    userSessions: userSessions.size
  });
});

// API endpoint to get server stats
app.get('/stats', (req, res) => {
  const roomStats = [];
  rooms.forEach((messages, roomId) => {
    roomStats.push({
      roomId,
      messageCount: messages.length,
      lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null
    });
  });

  res.json({
    server: {
      uptime: process.uptime(),
      activeConnections: io?.engine?.clientsCount || 0,
      activeRooms: rooms.size,
      activeUsers: users.size,
      userSessions: userSessions.size
    },
    rooms: roomStats,
    users: Array.from(users.values()).map(user => ({
      userId: user.userId,
      userType: user.userType,
      name: user.name,
      status: user.status,
      connectedAt: user.connectedAt
    }))
  });
});

const server = http.createServer(app);

// Socket.io configuration with proper CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6
});

// Helper function to generate room ID
const generateRoomId = (doctorId, patientId) => {
  return `room_${doctorId}_${patientId}`;
};

// Helper function to get or create room
const getOrCreateRoom = (doctorId, patientId) => {
  const roomKey = `${doctorId}_${patientId}`;
  let roomId = doctorPatientRooms.get(roomKey);
  
  if (!roomId) {
    roomId = generateRoomId(doctorId, patientId);
    doctorPatientRooms.set(roomKey, roomId);
    rooms.set(roomId, []);
    console.log(`✅ Created new room: ${roomId} for doctor ${doctorId} and patient ${patientId}`);
  }
  
  return roomId;
};

// Helper function to save message to room
const saveMessageToRoom = (roomId, message) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, []);
  }
  
  const messages = rooms.get(roomId);
  const messageWithId = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: 'sent'
  };
  
  messages.push(messageWithId);
  rooms.set(roomId, messages);
  
  console.log(`💬 Message saved to room ${roomId}:`, {
    sender: messageWithId.senderName,
    type: messageWithId.type,
    text: messageWithId.text?.substring(0, 50) + (messageWithId.text?.length > 50 ? '...' : '')
  });
  
  return messageWithId;
};

// Helper function to manage user sessions
const addUserSession = (userId, socketId) => {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, []);
  }
  const sessions = userSessions.get(userId);
  if (!sessions.includes(socketId)) {
    sessions.push(socketId);
  }
};

const removeUserSession = (userId, socketId) => {
  if (userSessions.has(userId)) {
    const sessions = userSessions.get(userId);
    const index = sessions.indexOf(socketId);
    if (index > -1) {
      sessions.splice(index, 1);
    }
    if (sessions.length === 0) {
      userSessions.delete(userId);
    }
  }
};

// Helper function to broadcast to user across all sessions
const broadcastToUser = (userId, event, data) => {
  const sessions = userSessions.get(userId) || [];
  sessions.forEach(socketId => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  });
};

// Helper function to get user by userId
const getUserByUserId = (userId) => {
  for (const [socketId, user] of users.entries()) {
    if (user.userId === userId) {
      return { ...user, socketId };
    }
  }
  return null;
};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id} at ${new Date().toISOString()}`);
  
  // Send connection confirmation
  socket.emit('connected', { 
    socketId: socket.id, 
    timestamp: new Date().toISOString(),
    serverVersion: '1.0.0'
  });
  
  // Handle user authentication and joining
  socket.on('authenticate', (data) => {
    try {
      const { userId, userType, name, avatar, email, specialization } = data;
      
      console.log(`🔐 Authentication attempt:`, { userId, userType, name });
      
      if (!userId || !userType || !name) {
        console.error(`❌ Authentication failed - missing data:`, { userId, userType, name });
        socket.emit('auth_error', { message: 'Missing required authentication data' });
        return;
      }
      
      // Store user info
      const userInfo = {
        userId,
        userType, // 'doctor' or 'patient'
        name,
        avatar: avatar || '',
        email: email || '',
        specialization: specialization || '',
        socketId: socket.id,
        status: 'online',
        lastSeen: new Date().toISOString(),
        connectedAt: new Date().toISOString()
      };
      
      users.set(socket.id, userInfo);
      addUserSession(userId, socket.id);
      
      console.log(`✅ User authenticated: ${name} (${userType}) - ${userId} - Socket: ${socket.id}`);
      
      // Broadcast user status to others
      socket.broadcast.emit('user_status_change', {
        userId,
        status: 'online',
        userType,
        name,
        avatar,
        timestamp: new Date().toISOString()
      });
      
      // Send authentication success
      socket.emit('authenticated', {
        success: true,
        userId,
        userType,
        name,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('auth_error', { message: `Authentication failed: ${error.message}` });
    }
  });
  
  // Handle joining a chat room
  socket.on('join_chat', (data) => {
    try {
      const { doctorId, patientId } = data;
      const user = users.get(socket.id);
      
      console.log(`🏠 Join chat request:`, { doctorId, patientId, user: user?.name });
      
      if (!user) {
        console.error(`❌ Join chat failed - user not authenticated: ${socket.id}`);
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      if (!doctorId || !patientId) {
        console.error(`❌ Join chat failed - missing IDs:`, { doctorId, patientId });
        socket.emit('error', { message: 'Missing doctorId or patientId' });
        return;
      }
      
      // Create or get existing room
      const roomId = getOrCreateRoom(doctorId, patientId);
      
      // Leave any previous chat rooms (keep the user's own room)
      const currentRooms = Array.from(socket.rooms).filter(room => 
        room !== socket.id && room.startsWith('room_')
      );
      currentRooms.forEach(room => {
        socket.leave(room);
        console.log(`👋 Left previous room: ${room}`);
      });
      
      // Join the socket room
      socket.join(roomId);
      
      // Get existing messages for this room
      const existingMessages = rooms.get(roomId) || [];
      
      console.log(`✅ User ${user.name} joined room: ${roomId} (${existingMessages.length} messages)`);
      
      // Send existing messages to the user
      socket.emit('room_joined', {
        roomId,
        doctorId,
        patientId,
        messages: existingMessages,
        timestamp: new Date().toISOString()
      });
      
      // Notify others in the room about user joining
      socket.to(roomId).emit('user_joined_room', {
        userId: user.userId,
        userType: user.userType,
        name: user.name,
        roomId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Join chat error:', error);
      socket.emit('error', { message: `Failed to join chat room: ${error.message}` });
    }
  });

  // Alternative room joining (backward compatibility)
  socket.on('join_room', (data) => {
    const { roomId, doctorId, patientId } = data;
    socket.emit('join_chat', { doctorId, patientId });
  });
  
  // Handle sending messages
  socket.on('send_message', (data) => {
    try {
      const { doctorId, patientId, text, type = 'text', audioUrl, mediaUrl, roomId } = data;
      const sender = users.get(socket.id);
      
      console.log(`📤 Send message request:`, { 
        doctorId, 
        patientId, 
        sender: sender?.name, 
        type, 
        textLength: text?.length,
        roomId: roomId || 'auto-generated'
      });
      
      if (!sender) {
        console.error(`❌ Send message failed - user not authenticated: ${socket.id}`);
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }
      
      if (!doctorId || !patientId) {
        console.error(`❌ Send message failed - missing IDs:`, { doctorId, patientId });
        socket.emit('error', { message: 'Missing doctorId or patientId' });
        return;
      }
      
      if (!text && !audioUrl && !mediaUrl) {
        console.error(`❌ Send message failed - no content`);
        socket.emit('error', { message: 'Message content is required' });
        return;
      }
      
      const finalRoomId = roomId || getOrCreateRoom(doctorId, patientId);
      
      // Create message object
      const message = {
        senderId: sender.userId,
        senderName: sender.name,
        senderType: sender.userType,
        text: text || '',
        type,
        audioUrl: audioUrl || null,
        mediaUrl: mediaUrl || null,
        doctorId,
        patientId,
        roomId: finalRoomId
      };
      
      // Save message to room
      const savedMessage = saveMessageToRoom(finalRoomId, message);
      
      // Send message to all users in the room (including sender)
      io.to(finalRoomId).emit('new_message', savedMessage);
      
      // Send delivery confirmation to sender
      socket.emit('message_sent', { 
        messageId: savedMessage.id,
        timestamp: savedMessage.timestamp,
        roomId: finalRoomId
      });
      
      console.log(`✅ Message sent to room ${finalRoomId} by ${sender.name}`);
      
    } catch (error) {
      console.error('❌ Send message error:', error);
      socket.emit('error', { message: `Failed to send message: ${error.message}` });
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    try {
      const { doctorId, patientId, roomId } = data;
      const sender = users.get(socket.id);
      
      if (!sender || (!roomId && (!doctorId || !patientId))) return;
      
      const finalRoomId = roomId || getOrCreateRoom(doctorId, patientId);
      
      socket.to(finalRoomId).emit('user_typing', {
        userId: sender.userId,
        userType: sender.userType,
        name: sender.name,
        roomId: finalRoomId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Typing indicator error:', error);
    }
  });
  
  socket.on('stop_typing', (data) => {
    try {
      const { doctorId, patientId, roomId } = data;
      const sender = users.get(socket.id);
      
      if (!sender || (!roomId && (!doctorId || !patientId))) return;
      
      const finalRoomId = roomId || getOrCreateRoom(doctorId, patientId);
      
      socket.to(finalRoomId).emit('user_stop_typing', {
        userId: sender.userId,
        userType: sender.userType,
        name: sender.name,
        roomId: finalRoomId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Stop typing error:', error);
    }
  });

  // Handle user status updates
  socket.on('update_status', (data) => {
    try {
      const { status } = data;
      const user = users.get(socket.id);
      
      if (!user) return;
      
      user.status = status;
      user.lastSeen = new Date().toISOString();
      
      // Broadcast status change
      socket.broadcast.emit('user_status_change', {
        userId: user.userId,
        status,
        userType: user.userType,
        name: user.name,
        lastSeen: user.lastSeen,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📊 Status updated for ${user.name}: ${status}`);
      
    } catch (error) {
      console.error('❌ Status update error:', error);
    }
  });

  // Handle leaving room
  socket.on('leave_room', (data) => {
    try {
      const { roomId } = data;
      const user = users.get(socket.id);
      
      if (!user || !roomId) return;
      
      socket.leave(roomId);
      
      // Notify others in the room
      socket.to(roomId).emit('user_left_room', {
        userId: user.userId,
        userType: user.userType,
        name: user.name,
        roomId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`👋 User ${user.name} left room: ${roomId}`);
      
    } catch (error) {
      console.error('❌ Leave room error:', error);
    }
  });

  // Handle message delivery status
  socket.on('message_delivered', (data) => {
    try {
      const { messageId, roomId } = data;
      const user = users.get(socket.id);
      
      if (!user) return;
      
      // Broadcast delivery confirmation to room
      socket.to(roomId).emit('message_delivery_update', {
        messageId,
        deliveredTo: user.userId,
        deliveredAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Message delivery error:', error);
    }
  });

  // Handle message read status
  socket.on('message_read', (data) => {
    try {
      const { messageId, roomId } = data;
      const user = users.get(socket.id);
      
      if (!user) return;
      
      // Broadcast read confirmation to room
      socket.to(roomId).emit('message_read_update', {
        messageId,
        readBy: user.userId,
        readAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Message read error:', error);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    const user = users.get(socket.id);
    
    if (user) {
      console.log(`👋 User disconnected: ${user.name} (${user.userType}) - Socket: ${socket.id} - Reason: ${reason}`);
      
      // Remove from user sessions
      removeUserSession(user.userId, socket.id);
      
      // Check if user has other active sessions
      const remainingSessions = userSessions.get(user.userId) || [];
      const isCompletelyOffline = remainingSessions.length === 0;
      
      if (isCompletelyOffline) {
        // Update status to offline only if no other sessions exist
        user.status = 'offline';
        user.lastSeen = new Date().toISOString();
        
        // Broadcast status change
        socket.broadcast.emit('user_status_change', {
          userId: user.userId,
          status: 'offline',
          userType: user.userType,
          name: user.name,
          lastSeen: user.lastSeen,
          timestamp: new Date().toISOString()
        });
      }
      
      // Remove user from memory
      users.delete(socket.id);
    } else {
      console.log(`👋 Unknown user disconnected: ${socket.id} - Reason: ${reason}`);
    }
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });

  // Handle connect_error from client
  socket.on('connect_error', (error) => {
    console.error(`🚨 Client connection error for ${socket.id}:`, error);
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
});

// Error handler for the server
server.on('error', (error) => {
  console.error('🚨 Server error:', error);
});

// Handle server startup errors
io.engine.on('connection_error', (err) => {
  console.error('🚨 Engine.IO connection error:', err);
});

// Start server - Using port 5000 to match frontend expectations
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Doctor-Patient Chat Server running on port ${PORT}`);
  console.log(`📋 Health check available at: http://localhost:${PORT}/health`);
  console.log(`📊 Stats endpoint available at: http://localhost:${PORT}/stats`);
  console.log(`🔌 Socket.io endpoint: http://localhost:${PORT}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`👥 Ready to accept connections...`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Log server stats every 30 seconds
setInterval(() => {
  const stats = {
    activeConnections: io.engine.clientsCount,
    activeUsers: users.size,
    activeRooms: rooms.size,
    userSessions: userSessions.size,
    totalMessages: Array.from(rooms.values()).reduce((sum, messages) => sum + messages.length, 0)
  };
  console.log(`📊 Server Stats:`, stats);
}, 30000);

// Clean up old messages every hour (optional - keep last 1000 messages per room)
setInterval(() => {
  rooms.forEach((messages, roomId) => {
    if (messages.length > 1000) {
      const keptMessages = messages.slice(-1000);
      rooms.set(roomId, keptMessages);
      console.log(`🧹 Cleaned up old messages in room ${roomId}: kept ${keptMessages.length} messages`);
    }
  });
}, 3600000); // 1 hour