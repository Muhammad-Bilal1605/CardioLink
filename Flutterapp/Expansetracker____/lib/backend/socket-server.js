const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "*"], // Add your web app URLs
  credentials: true
}));

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store active users and rooms (in memory only)
const activeUsers = new Map();
const chatRooms = new Map();

// Middleware
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Real-time chat server is running',
    activeUsers: activeUsers.size,
    activeRooms: chatRooms.size
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join_user', (data) => {
    const { userId, userType, name } = data;
    
    activeUsers.set(socket.id, {
      userId,
      userType,
      name,
      socketId: socket.id,
      joinedAt: new Date()
    });
    
    console.log(`👤 User joined: ${name} (${userType}) - ID: ${userId}`);
    
    // Join user to their personal room
    socket.join(`user_${userId}`);
  });

  // Handle joining chat rooms
  socket.on('join_room', (data) => {
    const { roomId, userId } = data;
    
    socket.join(roomId);
    
    // Track room membership
    if (!chatRooms.has(roomId)) {
      chatRooms.set(roomId, new Set());
    }
    chatRooms.get(roomId).add(socket.id);
    
    console.log(`🏠 User ${userId} joined room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined_room', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    const { roomId, senderId, receiverId, text, type, mediaUrl, timestamp, messageId } = messageData;
    
    console.log(`📤 Message from ${senderId} to ${receiverId} in room ${roomId}: ${text}`);
    
    // Create complete message object
    const completeMessage = {
      messageId: messageId || `${Date.now()}_${senderId}`,
      roomId,
      senderId,
      receiverId,
      text,
      type: type || 'text',
      mediaUrl,
      timestamp: timestamp || new Date().toISOString(),
      status: 'delivered'
    };
    
    // Send to all users in the room (including sender for confirmation)
    io.to(roomId).emit('receive_message', completeMessage);
    
    // Send notification to receiver's personal room if they're not in the chat room
    io.to(`user_${receiverId}`).emit('message_notification', {
      ...completeMessage,
      notificationType: 'new_message'
    });
    
    console.log(`✅ Message delivered to room ${roomId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { roomId, userId, userName } = data;
    socket.to(roomId).emit('user_typing', {
      userId,
      userName,
      roomId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user_stopped_typing', {
      userId,
      roomId,
      isTyping: false
    });
  });

  // Handle read receipts
  socket.on('mark_messages_read', (data) => {
    const { roomId, userId, messageIds } = data;
    socket.to(roomId).emit('messages_read', {
      roomId,
      userId,
      messageIds,
      readAt: new Date().toISOString()
    });
  });

  // Handle leaving rooms
  socket.on('leave_room', (data) => {
    const { roomId, userId } = data;
    socket.leave(roomId);
    
    if (chatRooms.has(roomId)) {
      chatRooms.get(roomId).delete(socket.id);
      if (chatRooms.get(roomId).size === 0) {
        chatRooms.delete(roomId);
      }
    }
    
    socket.to(roomId).emit('user_left_room', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🚪 User ${userId} left room: ${roomId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`🔌 User disconnected: ${user.name} (${user.userType})`);
      
      // Remove from all rooms
      chatRooms.forEach((members, roomId) => {
        if (members.has(socket.id)) {
          members.delete(socket.id);
          socket.to(roomId).emit('user_left_room', {
            userId: user.userId,
            roomId,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Remove user from active users
      activeUsers.delete(socket.id);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Real-time chat server running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://YOUR_LOCAL_IP:${PORT}`);
  console.log(`📱 Flutter should connect to: http://YOUR_LOCAL_IP:${PORT}`);
  console.log(`💻 Web app should connect to: http://YOUR_LOCAL_IP:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
  });
});
