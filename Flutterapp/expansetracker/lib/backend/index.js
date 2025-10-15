/*import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { networkInterfaces } from 'os';

import { connectDB } from "./db/connectDB.js";

// Import auth routes (ES6 module)
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002; // Keep original port
const __dirname = path.resolve();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Helper function to get network IP
function getNetworkIP() {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const networkIP = getNetworkIP();

// ZegoCloud Configuration
const ZEGO_CONFIG = {
  appID: 772794217,
  appSign: '7c38b677dcb04a1d0e3d416c111b192538d44369c06690cac98625257dd32442',
  serverSecret: 'f00a82a2161ac6a81585caecb5e04e47',
  serverUrl: 'wss://webliveroom772794217-api.coolzcloud.com/ws',
  secondaryServerUrl: 'wss://webliveroom772794217-api-bak.coolzcloud.com/ws'
};

// CORS Configuration - Combine both configurations
const allowedOrigins = [
  'http://localhost:3000',    // React dev server
  'http://localhost:5002',    // Your MERN server
  'http://localhost:5000',    // Flutter web
  'http://localhost:8080',    // Flutter web alternative
  'http://localhost:8081',    // Flutter debug
  'http://127.0.0.1:5002',    // Localhost alternative
  'http://127.0.0.1:5000',    // Localhost alternative
  'http://127.0.0.1:8080',    // Localhost alternative
  'http://127.0.0.1:8081',    // Localhost alternative
  'http://localhost',         // Fallback
  'http://192.168.1.2:8080',
  'http://192.168.1.2:5100',
  'http://192.168.1.2:5000',
];

// Enhanced CORS middleware for both MERN and Flutter
app.use(cors({
  origin: function (origin, callback) {
    console.log(`CORS request from origin: ${origin || 'no origin'}`);
    
    if (process.env.NODE_ENV === 'development' || !origin) {
      console.log('Allowing request (development mode or no origin)');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) ||
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('192.168.') ||
        origin.includes('10.0.') ||
        origin.includes('172.')) {
      console.log('Origin allowed');
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-socket-id']
}));

// Socket.IO Configuration - Enhanced for both MERN and Flutter
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow all origins in development
      if (process.env.NODE_ENV === 'development' || !origin) {
        return callback(null, true);
      }
      
      // In production, check against allowedOrigins
      if (allowedOrigins.some(allowed => 
        origin.startsWith(allowed) || 
        origin.includes(allowed.replace('http://', '').replace('https://', ''))
      )) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-socket-id"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e8, // Increased for Flutter
  cookie: false
});

// Track connected users - Enhanced for both platforms
const users = new Map(); // socket.id -> user info
const userSockets = new Map(); // userId -> socket.id[]
const connectedUsers = new Map(); // userId -> socketId (Flutter compatibility)
const activeCalls = new Map(); // callId -> call details

// ZegoCloud Token Generation Function
function generateZegoToken(userId, roomId, privilege = 1, expireTimeInSeconds = 3600) {
  const payload = {
    app_id: ZEGO_CONFIG.appID,
    user_id: userId,
    room_id: roomId,
    privilege: privilege,
    expire_time: Math.floor(Date.now() / 1000) + expireTimeInSeconds
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Helper functions
function generateRoomId(doctorId, patientId) {
  return [doctorId, patientId].sort().join('_');
}

function getOrCreateRoom(doctorId, patientId) {
  const roomId = generateRoomId(doctorId, patientId);
  if (!io.sockets.adapter.rooms.has(roomId)) {
    console.log(`Creating new room: ${roomId}`);
  }
  return roomId;
}

async function saveMessageToRoom(roomId, message) {
  console.log(`💾 Saving message to room ${roomId}:`, message);
  // TODO: Implement database saving logic here
  return message;
}

// Socket.IO connection handler - Enhanced for both MERN and Flutter
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id} at ${new Date().toISOString()}`);
  
  const { userId, userType, userName, from = 'web' } = socket.handshake.query;
  
  if (!userId || !userType) {
    console.log('❌ Connection rejected: Missing userId or userType');
    return socket.disconnect(true);
  }
  
  console.log(`👤 ${userType} connected: ${userId} (${from})`);
  
  // Store user info (MERN compatibility)
  users.set(socket.id, { userId, userType, socketId: socket.id, userName: userName || userId });
  
  // Track user's sockets (MERN compatibility)
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);
  
  // Store connected users (Flutter compatibility)
  connectedUsers.set(userId, {
    socketId: socket.id,
    userType: userType,
    userName: userName || userId,
    isOnline: true
  });
  
  // Join user to their personal room for direct messaging
  socket.join(userId);
  
  // Handle user registration (Flutter specific)
  socket.on('register_user', (data) => {
    const { userId: regUserId, userType: regUserType, userName: regUserName } = data;
    
    connectedUsers.set(regUserId, {
      socketId: socket.id,
      userType: regUserType,
      userName: regUserName,
      isOnline: true
    });
    
    socket.join(regUserId);
    
    console.log(`${regUserType} registered: ${regUserName} (${regUserId})`);
    
    socket.emit('user_registered', {
      success: true,
      userId: regUserId,
      message: 'Successfully registered'
    });
    
    socket.broadcast.emit('user_status_changed', {
      userId: regUserId,
      status: 'online',
      userType: regUserType
    });
  });
  
  // Handle ZegoCloud token request
  socket.on('request_zego_token', (data) => {
    const { userId: reqUserId, roomId } = data;
    
    try {
      const token = generateZegoToken(reqUserId, roomId);
      
      socket.emit('zego_token_response', {
        success: true,
        token: token,
        appID: ZEGO_CONFIG.appID,
        serverUrl: ZEGO_CONFIG.serverUrl,
        roomId: roomId,
        userId: reqUserId
      });
      
      console.log(`ZegoCloud token generated for ${reqUserId} in room ${roomId}`);
    } catch (error) {
      console.error('Error generating ZegoCloud token:', error);
      socket.emit('zego_token_response', {
        success: false,
        error: 'Failed to generate token'
      });
    }
  });
  
  // Handle join_room event (MERN compatibility)
  socket.on('join_room', async ({ roomId, userId: joiningUserId }) => {
    try {
      console.log(`🚪 User ${userId} joining room: ${roomId}`);
      await socket.join(roomId);
      
      socket.to(roomId).emit('user_joined', { 
        roomId, 
        userId: joiningUserId,
        timestamp: new Date().toISOString()
      });
      
      const roomSockets = await io.in(roomId).fetchSockets();
      const roomUsers = roomSockets
        .map(s => users.get(s.id))
        .filter(Boolean);
      
      socket.emit('room_info', {
        roomId,
        users: roomUsers,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  });
  
  // Handle leave_room event
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left', { 
      roomId, 
      userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle send_message event - Enhanced for both platforms
  socket.on('send_message', async (data) => {
    try {
      const { roomId, text, type = 'text', senderId, receiverId } = data;
      
      if (!text || !senderId) {
        throw new Error('Missing required fields');
      }
      
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: roomId || generateRoomId(senderId, receiverId),
        senderId,
        receiverId,
        text,
        type,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        platform: data.platform || 'web'
      };
      
      await saveMessageToRoom(message.roomId, message);
      
      if (roomId) {
        // Broadcast to room (MERN style)
        io.to(roomId).emit('receive_message', message);
      } else if (receiverId) {
        // Send to specific receiver (Flutter style)
        io.to(receiverId).emit('receive_message', message);
        socket.emit('message_sent', {
          messageId: message.id,
          status: 'delivered'
        });
      }
      
      console.log(`Message sent from ${senderId} to ${receiverId || 'room'}`);
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { 
        message: 'Failed to send message', 
        error: error.message 
      });
    }
  });
  
  // Handle call initiation - Enhanced for cross-platform
  socket.on('call:initiate', (data) => {
    const { to, from, callerName, isVideo, roomId } = data;
    console.log(`📞 Call initiated from ${from} to ${to} in room ${roomId || 'direct'}`);
    
    const callId = `call_${from}_${to}_${Date.now()}`;
    
    // Store call details
    activeCalls.set(callId, {
      callId: callId,
      callerId: from,
      receiverId: to,
      callerName: callerName,
      isVideo: isVideo,
      roomId: roomId,
      status: 'calling',
      createdAt: new Date()
    });
    
    // Forward the call request
    if (roomId) {
      socket.to(roomId).emit('call:incoming', {
        from,
        callerName,
        isVideo,
        roomId,
        timestamp: new Date().toISOString()
      });
    } else {
      io.to(to).emit('call:initiate', {
        callId: callId,
        from: from,
        callerName: callerName,
        isVideo: isVideo,
        roomId: roomId
      });
    }
    
    socket.emit('call:invitation_sent', {
      callId: callId,
      to: to
    });
  });

  // Handle call response - Enhanced for cross-platform
  socket.on('call:response', (data) => {
    const { to, from, accepted, roomId, isVideo } = data;
    console.log(`📞 Call ${accepted ? 'accepted' : 'rejected'} by ${from} to ${to}`);
    
    if (accepted) {
      const callRoomId = roomId || `call_${to}_${from}_${Date.now()}`;
      
      // Generate ZegoCloud tokens for both participants
      const callerToken = generateZegoToken(to, callRoomId);
      const receiverToken = generateZegoToken(from, callRoomId);
      
      // Send response to caller
      io.to(to).emit('call:response', {
        from: from,
        accepted: true,
        isVideo: isVideo,
        token: callerToken,
        appID: ZEGO_CONFIG.appID,
        serverUrl: ZEGO_CONFIG.serverUrl,
        roomId: callRoomId,
        userId: to
      });
      
      // Send acceptance to receiver
      socket.emit('call:accepted', {
        from: to,
        token: receiverToken,
        appID: ZEGO_CONFIG.appID,
        serverUrl: ZEGO_CONFIG.serverUrl,
        roomId: callRoomId,
        userId: from,
        isVideo: isVideo
      });
      
    } else {
      // Call was rejected
      if (roomId) {
        socket.to(roomId).emit('call:answered', {
          from,
          accepted: false,
          roomId,
          timestamp: new Date().toISOString()
        });
      } else {
        io.to(to).emit('call:response', {
          from: from,
          accepted: false
        });
      }
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    if (roomId) {
      socket.to(roomId).emit('user_typing', {
        roomId,
        userId,
        isTyping,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle message read receipts
  socket.on('message_read', (data) => {
    const { messageId, roomId, readerId } = data;
    if (messageId && roomId && readerId) {
      socket.to(roomId).emit('message_read', {
        messageId,
        roomId,
        readerId,
        readAt: new Date().toISOString()
      });
    }
  });
  
  // Handle WebRTC signaling events (MERN compatibility)
  socket.on('webrtc:offer', (data) => {
    const { to, offer, roomId } = data;
    console.log(`📩 WebRTC offer in room ${roomId}`);
    
    socket.to(roomId).emit('webrtc:offer', {
      from: socket.id,
      offer,
      roomId
    });
  });

  socket.on('webrtc:answer', (data) => {
    const { to, answer, roomId } = data;
    console.log(`📨 WebRTC answer in room ${roomId}`);
    
    socket.to(roomId).emit('webrtc:answer', {
      from: socket.id,
      answer,
      roomId
    });
  });

  socket.on('webrtc:ice-candidate', (data) => {
    const { to, candidate, roomId } = data;
    
    socket.to(roomId).emit('webrtc:ice-candidate', {
      from: socket.id,
      candidate,
      roomId
    });
  });

  // Handle call end - Enhanced for both platforms
  socket.on('call:end', (data) => {
    const { to, roomId, from } = data;
    console.log(`📞 Call ended in room ${roomId || 'direct'}`);
    
    if (roomId) {
      socket.to(roomId).emit('call:ended', {
        from: socket.id,
        roomId,
        timestamp: new Date().toISOString()
      });
    } else if (to) {
      io.to(to).emit('call:end', {
        from: from || userId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Clean up active calls
    activeCalls.forEach((call, callId) => {
      if (call.callerId === userId || call.receiverId === userId) {
        activeCalls.delete(callId);
      }
    });
  });
  
  // Handle ZegoCloud room events
  socket.on('zego:room_joined', (data) => {
    const { roomId: zegoRoomId, userId: zegoUserId } = data;
    console.log(`User ${zegoUserId} joined ZegoCloud room: ${zegoRoomId}`);
    
    socket.to(zegoRoomId).emit('user_joined_room', {
      userId: zegoUserId,
      roomId: zegoRoomId
    });
  });
  
  socket.on('zego:room_left', (data) => {
    const { roomId: zegoRoomId, userId: zegoUserId } = data;
    console.log(`User ${zegoUserId} left ZegoCloud room: ${zegoRoomId}`);
    
    socket.to(zegoRoomId).emit('user_left_room', {
      userId: zegoUserId,
      roomId: zegoRoomId
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`👋 User disconnected: ${userId} (${socket.id}) - Reason: ${reason}`);
    
    // Remove from users map (MERN)
    users.delete(socket.id);
    
    // Remove from userSockets (MERN)
    if (userSockets.has(userId)) {
      const userSocketSet = userSockets.get(userId);
      userSocketSet.delete(socket.id);
      
      if (userSocketSet.size === 0) {
        userSockets.delete(userId);
        socket.broadcast.emit('user_status', { 
          userId, 
          status: 'offline',
          lastSeen: new Date().toISOString() 
        });
      }
    }
    
    // Remove from connectedUsers (Flutter)
    connectedUsers.delete(userId);
    
    // End any active calls for this user
    activeCalls.forEach((call, callId) => {
      if (call.callerId === userId || call.receiverId === userId) {
        const otherUserId = call.callerId === userId ? call.receiverId : call.callerId;
        io.to(otherUserId).emit('call:end', { 
          callId: callId, 
          reason: 'user_disconnected' 
        });
        activeCalls.delete(callId);
      }
    });
    
    // Notify others about offline status
    socket.broadcast.emit('user_status_changed', {
      userId: userId,
      status: 'offline'
    });
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Middleware
app.use(express.json({ limit: "50mb" })); // Increased for Flutter compatibility
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(morgan('dev'));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const hospitalsDir = path.join(__dirname, 'uploads', 'hospitals');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

if (!fs.existsSync(hospitalsDir)) {
  try {
    fs.mkdirSync(hospitalsDir, { recursive: true });
    console.log('Created hospitals directory at:', hospitalsDir);
  } catch (err) {
    console.error('Failed to create hospitals directory:', err);
  }
}

// Verify uploads directory is writable
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('Uploads directory is writable');
} catch (err) {
  console.error('Uploads directory is not writable:', err);
}

// Serve static files from uploads directory
console.log('Setting up static file serving...');
console.log('Uploads directory path:', uploadsDir);
console.log('Hospitals directory path:', hospitalsDir);

// Add debugging middleware for file requests
app.use('/uploads', (req, res, next) => {
  console.log('=====================================');
  console.log('File request received:', req.url);
  console.log('Request method:', req.method);
  console.log('Full request path:', req.path);
  console.log('Request headers:', req.headers);
  
  const filePath = path.join(__dirname, 'uploads', req.url);
  console.log('Looking for file at:', filePath);
  
  if (fs.existsSync(filePath)) {
    console.log('✓ File exists at:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
  } else {
    console.log('✗ File NOT found at:', filePath);
    
    const dirPath = path.dirname(filePath);
    console.log('Checking directory:', dirPath);
    
    if (fs.existsSync(dirPath)) {
      console.log('Directory exists, contents:');
      try {
        const contents = fs.readdirSync(dirPath);
        contents.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          console.log(`  ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${item} (${stats.size} bytes)`);
        });
      } catch (err) {
        console.log('Error reading directory:', err.message);
      }
    } else {
      console.log('Directory does not exist');
    }
  }
  console.log('=====================================');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Backend/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes - RESTORE ALL ORIGINAL ROUTES
app.use("/api/auth", authRoutes);

// ZegoCloud API Endpoints
app.get('/api/zego/config', (req, res) => {
  res.json({
    appID: ZEGO_CONFIG.appID,
    serverUrl: ZEGO_CONFIG.serverUrl,
    secondaryServerUrl: ZEGO_CONFIG.secondaryServerUrl
  });
});

app.post('/api/zego/token', (req, res) => {
  const { userId, roomId } = req.body;
  
  if (!userId || !roomId) {
    return res.status(400).json({
      success: false,
      error: 'userId and roomId are required'
    });
  }
  
  try {
    const token = generateZegoToken(userId, roomId);
    
    res.json({
      success: true,
      token: token,
      appID: ZEGO_CONFIG.appID,
      serverUrl: ZEGO_CONFIG.serverUrl,
      roomId: roomId,
      userId: userId,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token'
    });
  }
});

// Get online users
app.get('/api/users/online', (req, res) => {
  const onlineUsers = Array.from(connectedUsers.entries()).map(([userId, userData]) => ({
    userId: userId,
    userName: userData.userName,
    userType: userData.userType,
    isOnline: userData.isOnline
  }));
  
  res.json({
    success: true,
    users: onlineUsers,
    count: onlineUsers.length
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint accessed');
  res.json({
    success: true,
    message: 'Flutter backend test successful!',
    timestamp: new Date().toISOString(),
    serverIP: networkIP,
    clientIP: req.ip || req.connection.remoteAddress
  });
});

// Health check endpoint for Socket.IO - Enhanced
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    activeConnections: io?.engine?.clientsCount || 0,
    socketIOEnabled: true,
    zegoCloudEnabled: true,
    networkIP: networkIP,
    port: PORT,
    zegoCloud: {
      appID: ZEGO_CONFIG.appID,
      serverUrl: ZEGO_CONFIG.serverUrl
    },
    activeUsers: connectedUsers.size,
    activeCalls: activeCalls.size
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MERN + Flutter ZegoCloud API is running',
    timestamp: new Date().toISOString(),
    networkIP: networkIP,
    endpoints: {
      auth: '/api/auth',
      config: '/api/zego/config',
      token: '/api/zego/token',
      health: '/health',
      onlineUsers: '/api/users/online'
    }
  });
});

// Dynamic imports for models
const loadModels = async () => {
  try {
    await import("./models/User.js");
    await import("./models/Hospitalization.js");
    await import("./models/Imaging.js");
    await import("./models/LabResult.js");
    await import("./models/Medication.js");
    await import("./models/Visit.js");
    await import("./models/VitalSign.js");
    await import("./models/Procedure.js");
    await import("./models/Hospital.js");
    console.log('Models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading models:', error.message);
    console.log('Models may not be available. Make sure model files exist.');
    return false;
  }
};

// Dynamic imports for routes
const loadMedicalRoutes = async () => {
  try {
    const patientRoutes = await import("./routes/patientRoutes.js");
    const imagingRoutes = await import("./routes/imagingRoutes.js");
    const labResultRoutes = await import("./routes/labResultRoutes.js");
    const visitRoutes = await import("./routes/visitRoutes.js");
    const hospitalizationRoutes = await import("./routes/hospitalizationRoutes.js");
    const procedureRoutes = await import("./routes/procedureRoutes.js");
    const medicationRoutes = await import("./routes/medicationRoutes.js");
    const vitalSignRoutes = await import("./routes/vitalSignRoutes.js");
    const hospitalRoutes = await import("./routes/hospitalRoutes.js");

    app.use('/api/patients', patientRoutes.default);
    app.use('/api/imaging', imagingRoutes.default);
    app.use('/api/lab-results', labResultRoutes.default);
    app.use('/api/visits', visitRoutes.default);
    app.use('/api/hospitalizations', hospitalizationRoutes.default);
    app.use('/api/procedures', procedureRoutes.default);
    app.use('/api/medications', medicationRoutes.default);
    app.use('/api/vital-signs', vitalSignRoutes.default);
    app.use('/api/hospitals', hospitalRoutes.default);
    
    console.log('Medical routes loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading medical routes:', error.message);
    console.log('Medical routes may not be available. Make sure route files exist.');
    return false;
  }
};

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  
  // Return specific error message in development
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? `${err.message}\n${err.stack}` : 'Something went wrong!'
  });
});

// Production static file serving
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`404 - API Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// General 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize server
const startServer = async () => {
  try {
    console.log('🚀 Starting CardioLink integrated server...');
    
    // Connect to database
    console.log('📊 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Load models
    console.log('📦 Loading models...');
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) {
      console.warn('⚠️  Some models failed to load, but continuing...');
    } else {
      console.log('✅ All models loaded successfully');
    }
    
    // Load routes
    console.log('🛣️  Loading routes...');
    const routesLoaded = await loadMedicalRoutes();
    if (!routesLoaded) {
      console.warn('⚠️  Some routes failed to load, but continuing...');
    } else {
      console.log('✅ All routes loaded successfully');
    }
    
    // Start server with Socket.IO
    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n🎉 =================================');
      console.log('🚀 CardioLink Server Started Successfully!');
      console.log('🎉 =================================');
      console.log(`📍 Local:    http://localhost:${PORT}`);
      console.log(`🌐 Network:  http://${networkIP}:${PORT}`);
      console.log(`🔌 Socket.IO: Enabled for real-time communication`);
      console.log(`📹 ZegoCloud: Enabled for video calling`);
      console.log(`📋 Health:   http://localhost:${PORT}/health`);
      console.log(`🔗 API:      http://localhost:${PORT}/api`);
      console.log('🎉 =================================');
      console.log('✅ Ready for MERN Web App connections');
      console.log('✅ Ready for Flutter App connections');
      console.log('✅ Cross-platform video calling enabled');
      console.log('🎉 =================================\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Error handling for server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    console.error('💡 You can set a different port using: PORT=5003 npm start');
    process.exit(1);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${PORT}. Try using a port > 1024.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down CardioLink server gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n📴 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
console.log('🔄 Initializing CardioLink server...');
startServer();*/

//C:\Users\PMLS\Desktop\CardioLink\CardioLink\Flutterapp\Expansetracker____\lib\backend\index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import { networkInterfaces } from 'os';

import { connectDB } from "./db/connectDB.js";

// Import routes
import authRoutes from "./routes/auth.route.js";
import patientRoutes from "./routes/patientRoutes.js";
import ambulanceEmployerRoutes from "./routes/ambulanceEmployerRoutes.js";
import unifiedAuthRoutes from "./routes/unifiedAuth.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import messageRoutes from "./routes/message.routes.js";

import ambulanceRequestRoutes from "./routes/ambulanceRequestRoutes.js";
import { Message } from "./models/message.model.js";

// Import medical routes for EHR
import visitRoutes from "./routes/visitRoutes.js";
import hospitalizationRoutes from "./routes/hospitalizationRoutes.js";
import procedureRoutes from "./routes/procedureRoutes.js";
import labResultRoutes from "./routes/labResultRoutes.js";
import imagingRoutes from "./routes/imagingRoutes.js";
import medicationRoutes from "./routes/medicationRoutes.js";
import vitalSignRoutes from "./routes/vitalSignRoutes.js";

// Import models for debug routes
import { AmbulanceEmployer } from "./models/ambulanceEmployer.model.js";
import Patient from "./models/User.js";

dotenv.config();

// Debug: Log environment variables to verify they're loaded
console.log('🔍 Environment variables check:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Missing');
console.log('PATIENT_MONGO_URI:', process.env.PATIENT_MONGO_URI ? 'Found' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Missing');

import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';
const __dirname = path.resolve();
const AGORA_APP_ID = '88a403916325401a8e5f04beff756692';
const AGORA_APP_CERTIFICATE = '8407591dbbda46f9b4286093767b7e80';

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Helper function to get network IP
function getNetworkIP() {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Get the actual network IP
const networkIP = getNetworkIP();

// CORS Configuration - Enhanced for Flutter integration
const allowedOrigins = [
  // Localhost variations
  'http://localhost:3000', 
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:8080',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3001',
  'http://localhost:*',
  'http://127.0.0.1:*',
  'http://192.168.1.2:*',
  'http://192.168.1.*',
  'http://10.0.2.2:*',

  // Your computer's IP
  'http://192.168.1.2:8080',
  'http://192.168.1.8:5001',
  'http://192.168.1.8:5000',
  'http://192.168.1.6:5000',
  
  // Dynamic network IP
  `http://${networkIP}:5000`,
  `http://${networkIP}:3000`,
  `http://${networkIP}:8080`,
  
  // Mobile app origins
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost'
];

app.use(cors({
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin || 'no origin'}`);
    
    if (!origin) {
      console.log('✅ Allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin allowed from whitelist');
      return callback(null, true);
    }
    
    if (origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('192.168.') ||
        origin.includes('10.0.') ||
        origin.includes('172.')) {
      console.log('✅ Origin allowed as local/private network');
      return callback(null, true);
    }
    
    console.log('❌ Origin not allowed by CORS');
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Socket.IO Configuration with WebRTC Support
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.0.2.2:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(morgan("combined"));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} from ${req.ip || req.connection.remoteAddress}`);
  next();
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const hospitalsDir = path.join(uploadsDir, 'hospitals');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(hospitalsDir)) {
    fs.mkdirSync(hospitalsDir, { recursive: true });
  }
  
  const testFile = path.join(uploadsDir, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log("📁 Uploads directory is writable");
} catch (error) {
  console.error("❌ Error setting up uploads directory:", error);
}

console.log("📁 Setting up static file serving...");
console.log("📁 Uploads directory path:", uploadsDir);
console.log("📁 Hospitals directory path:", hospitalsDir);

// Add debugging middleware for file requests
app.use('/uploads', (req, res, next) => {
  console.log('=====================================');
  console.log('File request received:', req.url);
  console.log('Request method:', req.method);
  console.log('Full request path:', req.path);
  console.log('Request headers:', req.headers);
  
  const filePath = path.join(__dirname, 'uploads', req.url);
  console.log('Looking for file at:', filePath);
  
  if (fs.existsSync(filePath)) {
    console.log('✓ File exists at:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
  } else {
    console.log('✗ File NOT found at:', filePath);
    
    const dirPath = path.dirname(filePath);
    console.log('Checking directory:', dirPath);
    
    if (fs.existsSync(dirPath)) {
      console.log('Directory exists, contents:');
      try {
        const contents = fs.readdirSync(dirPath);
        contents.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          console.log(`  ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${item} (${stats.size} bytes)`);
        });
      } catch (err) {
        console.log('Error reading directory:', err.message);
      }
    } else {
      console.log('Directory does not exist');
    }
  }
  console.log('=====================================');
  next();
});

app.use('/Backend/uploads', (req, res, next) => {
  console.log('=====================================');
  console.log('Backend file request received:', req.url);
  console.log('Request method:', req.method);
  console.log('Full request path:', req.path);
  console.log('Request headers:', req.headers);
  
  const filePath = path.join(__dirname, 'uploads', req.url);
  console.log('Looking for file at:', filePath);
  
  if (fs.existsSync(filePath)) {
    console.log('✓ File exists at:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
  } else {
    console.log('✗ File NOT found at:', filePath);
    
    const dirPath = path.dirname(filePath);
    console.log('Checking directory:', dirPath);
    
    if (fs.existsSync(dirPath)) {
      console.log('Directory exists, contents:');
      try {
        const contents = fs.readdirSync(dirPath);
        contents.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          console.log(`  ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${item} (${stats.size} bytes)`);
        });
      } catch (err) {
        console.log('Error reading directory:', err.message);
      }
    } else {
      console.log('Directory does not exist');
    }
  }
  console.log('=====================================');
  next();
});

// Static file serving - Serve from both local uploads and main CardioLink uploads
const mainUploadsDir = path.join(__dirname, '../../../uploads'); // Main CardioLink uploads directory

// Serve from local uploads first, then fallback to main uploads
app.use('/uploads', (req, res, next) => {
  const localPath = path.join(__dirname, 'uploads', req.url);
  const mainPath = path.join(mainUploadsDir, req.url);
  
  if (fs.existsSync(localPath)) {
    console.log('✓ Serving from local uploads:', localPath);
    return express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else if (fs.existsSync(mainPath)) {
    console.log('✓ Serving from main uploads:', mainPath);
    return express.static(mainUploadsDir)(req, res, next);
  } else {
    console.log('✗ File not found in either location:', req.url);
    return next();
  }
});

app.use('/Backend/uploads', (req, res, next) => {
  const localPath = path.join(__dirname, 'uploads', req.url);
  const mainPath = path.join(mainUploadsDir, req.url);
  
  if (fs.existsSync(localPath)) {
    console.log('✓ Serving from local uploads:', localPath);
    return express.static(path.join(__dirname, 'uploads'))(req, res, next);
  } else if (fs.existsSync(mainPath)) {
    console.log('✓ Serving from main uploads:', mainPath);
    return express.static(mainUploadsDir)(req, res, next);
  } else {
    console.log('✗ File not found in either location:', req.url);
    return next();
  }
});

// Direct file serving route for specific files
app.get('/Backend/uploads/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    console.log('Direct file request for:', filename);
    
    const localPath = path.join(__dirname, 'uploads', filename);
    const mainPath = path.join(mainUploadsDir, filename);
    
    let filePath;
    if (fs.existsSync(localPath)) {
      filePath = localPath;
      console.log('✓ Serving from local uploads:', filePath);
    } else if (fs.existsSync(mainPath)) {
      filePath = mainPath;
      console.log('✓ Serving from main uploads:', filePath);
    } else {
      console.log('✗ File not found:', filename);
      return res.status(404).json({ 
        success: false, 
        message: 'File not found',
        filename: filename,
        localPath: localPath,
        mainPath: mainPath
      });
    }
    
    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword'
    }[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Send the file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error serving file',
      error: error.message 
    });
  }
});

// API Routes - Updated with new ambulance employer routes
app.use("/api/auth", unifiedAuthRoutes); // New unified auth routes for both user types
app.use("/api/auth", authRoutes); // Keep existing auth routes for backward compatibility

// Agora Token Generation Route
app.post('/api/videocall/generate-token', (req, res) => {
  try {
    const { channelName, uid } = req.body;
    
    console.log('🎥 Token request received:', { channelName, uid });
    
    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const uidInt = uid ? parseInt(uid) : 0;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uidInt,
      role,
      privilegeExpiredTs
    );

    console.log('✅ Token generated successfully for channel:', channelName);

    res.json({
      token,
      appId: AGORA_APP_ID,
      channelName,
      uid: uidInt
    });
  } catch (error) {
    console.error('❌ Error generating Agora token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});
app.use("/api/patient", patientRoutes);
app.use("/api/patients", patientRoutes); // Additional alias for consistency
app.use("/api/ambulance-employer", ambulanceEmployerRoutes);
app.use("/api/ambulance-employers", ambulanceEmployerRoutes); // Additional alias for consistency

app.use("/api/ambulance-requests", ambulanceRequestRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);

// Medical routes for EHR overview
app.use("/api/visits", visitRoutes);
app.use("/api/hospitalizations", hospitalizationRoutes);
app.use("/api/procedures", procedureRoutes);
app.use("/api/lab-results", labResultRoutes);
app.use("/api/imaging", imagingRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/vital-signs", vitalSignRoutes);

// ===== DEBUG ROUTES =====

// Test ambulance employer creation directly
app.post("/api/debug/test-ambulance-employer", async (req, res) => {
  try {
    console.log("🧪 Testing ambulance employer creation");
    console.log("📊 Request body:", JSON.stringify(req.body, null, 2));
    
    const testData = {
      email: "test@ambulance.com",
      password: "hashedpassword123",
      name: "Test Ambulance Company",
      gender: "Male",
      isVerified: true,
      isActive: true,
      lastLogin: new Date()
    };
    
    const testEmployer = new AmbulanceEmployer(testData);
    await testEmployer.save();
    
    console.log("✅ Test ambulance employer created:", testEmployer._id);
    
    res.status(201).json({
      success: true,
      message: "Test ambulance employer created successfully",
      employer: testEmployer
    });
  } catch (error) {
    console.error("❌ Test ambulance employer creation error:", error);
    res.status(500).json({
      success: false,
      message: "Test failed",
      error: error.message,
      stack: error.stack
    });
  }
});

// Check collections and counts
app.get("/api/debug/collections-info", async (req, res) => {
  try {
    const patientCount = await Patient.countDocuments();
    const employerCount = await AmbulanceEmployer.countDocuments();
    const collections = await Patient.db.db.listCollections().toArray();
        
    res.status(200).json({
      success: true,
      database: Patient.db.name,
      collections: collections.map(col => col.name),
      counts: {
        patients: patientCount,
        ambulanceEmployers: employerCount
      },
      patientModel: {
        collection: Patient.collection.name,
        database: Patient.db.name
      },
      employerModel: {
        collection: AmbulanceEmployer.collection.name,
        database: AmbulanceEmployer.db.name
      }
    });
  } catch (error) {
    console.error("❌ Collections info error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting collections info",
      error: error.message
    });
  }
});

// Test endpoint for Flutter app
app.post("/api/debug/test-flutter-signup", async (req, res) => {
  try {
    console.log("📱 Flutter signup test");
    console.log("📊 Headers:", req.headers);
    console.log("📊 Body:", JSON.stringify(req.body, null, 2));
    console.log("📊 Content-Type:", req.get('Content-Type'));
    
    res.status(200).json({
      success: true,
      message: "Flutter test successful",
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Flutter test error:", error);
    res.status(500).json({
      success: false,
      message: "Flutter test failed",
      error: error.message
    });
  }
});

// ===== END DEBUG ROUTES =====

// Health check endpoints
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Cardio Backend Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST,
    networkIP: networkIP,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  console.log('🏥 API Health check requested');
  res.status(200).json({ 
    status: 'OK', 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    networkIP: networkIP,
    endpoints: {
      // Legacy endpoints
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      patientSignup: '/api/patient/signup',
      patientLogin: '/api/patient/login',
      patientLogout: '/api/patient/logout',
      patientTestDB: '/api/patient/test-db',
      
      // New unified endpoints
      patientSignupNew: '/api/auth/patient/signup',
      ambulanceEmployerSignup: '/api/auth/ambulance-employer/signup',
      patientLoginNew: '/api/auth/patient/login',
      ambulanceEmployerLogin: '/api/auth/ambulance-employer/login',
      universalLogout: '/api/auth/logout',
      
      // Check auth endpoints
      patientCheckAuth: '/api/patients/check-auth',
      ambulanceEmployerCheckAuth: '/api/ambulance-employers/check-auth',
      
      // Medical EHR endpoints
      visits: '/api/visits',
      hospitalizations: '/api/hospitalizations',
      procedures: '/api/procedures',
      labResults: '/api/lab-results',
      imaging: '/api/imaging',
      medications: '/api/medications',
      vitalSigns: '/api/vital-signs',
      
      // Debug endpoints
      testAmbulanceEmployer: '/api/debug/test-ambulance-employer',
      collectionsInfo: '/api/debug/collections-info',
      testFlutterSignup: '/api/debug/test-flutter-signup'
    }
  });
});

app.get('/api/test', (req, res) => {
  console.log('🧪 Network test requested');
  res.status(200).json({
    success: true,
    message: 'Network connection successful!',
    timestamp: new Date().toISOString(),
    serverIP: networkIP,
    clientIP: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.status(200).json({
      success: true,
      database: {
        status: statusMap[dbStatus],
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      server: {
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        host: HOST,
        networkIP: networkIP
      },
      features: {
        socketIO: true,
        webRTC: true,
        patientAuth: true,
        ambulanceEmployerAuth: true,
        realTimeChat: true,
        debugRoutes: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking status",
      error: error.message
    });
  }
});

// Enhanced Socket.IO implementation for real-time chat and WebRTC
const users = new Map();
const rooms = new Map();
const callSessions = new Map();

// Make io available to controllers
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  socket.emit('connected', { 
    message: 'Connected to server successfully',
    socketId: socket.id,
    serverTime: new Date().toISOString()
  });

  // User authentication and joining - Updated to support both user types
  socket.on('authenticate', (data) => {
    const { userId, userType, name, avatar, email } = data;
    
    users.set(socket.id, { 
      userId, 
      userType, // 'patient' or 'ambulance_employer'
      name, 
      avatar, 
      email,
      socketId: socket.id,
      isOnline: true,
      lastSeen: new Date()
    });
    
    socket.join(`user_${userId}`);
    socket.join(`${userType}_${userId}`);
    
    console.log(`👤 ${name} (${userType}) authenticated: user_${userId}`);
    
    socket.emit('authenticated', {
      success: true,
      userId,
      userType,
      message: 'Authentication successful'
    });

    // Broadcast user online status
    socket.broadcast.emit('user_status_changed', { 
      userId, 
      status: 'online',
      userType 
    });
  });

  // Join chat room
  socket.on('join_room', (data) => {
    const { roomId, userId, userType } = data;
    
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const room = rooms.get(roomId);
    room.set(userId, {
      socketId: socket.id,
      userType,
      joinedAt: new Date()
    });
    
    console.log(`💬 User ${userId} (${userType}) joined room: ${roomId}`);
    
    socket.emit('room_joined', {
      success: true,
      roomId,
      message: `Joined room ${roomId} successfully`
    });
    
    // Notify others in the room
    socket.to(roomId).emit('user_joined_room', { userId, userType });
  });

  // Handle real-time message sending
  socket.on('send_message', async (data) => {
    try {
      const { roomId, senderId, receiverId, message, messageType = 'text', mediaUrl } = data;
      
      const newMessage = await Message.create({
        roomId,
        senderId,
        receiverId,
        message,
        messageType,
        mediaUrl,
        status: 'sent'
      });

      await newMessage.populate('senderId', 'name email avatar');
      await newMessage.populate('receiverId', 'name email avatar');

      io.to(roomId).emit('new_message', newMessage);
      
      io.to(`user_${receiverId}`).emit('message_notification', {
        roomId,
        senderId,
        senderName: newMessage.senderId.name,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        timestamp: newMessage.createdAt
      });

      socket.emit('message_sent', {
        success: true,
        messageId: newMessage._id,
        timestamp: newMessage.createdAt
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', {
        success: false,
        error: 'Failed to send message'
      });
    }
  });

  // WebRTC Signaling Events
  
  // Initiate call
  socket.on('call:initiate', (data) => {
    const { to, from, callerName, isVideo, roomId } = data;
    console.log(`📞 Call initiated from ${from} to ${to}, video: ${isVideo}`);
    
    const callId = `call_${from}_${to}_${Date.now()}`;
    callSessions.set(callId, {
      callId,
      caller: from,
      callee: to,
      isVideo,
      roomId,
      status: 'initiating',
      createdAt: new Date()
    });

    // Send call invitation to target user
    io.to(`user_${to}`).emit('call:incoming', {
      callId,
      from,
      callerName,
      isVideo,
      roomId
    });

    // Notify caller that invitation was sent
    socket.emit('call:invitation_sent', { callId, to });
  });

  // Accept call
  socket.on('call:accept', (data) => {
    const { callId } = data;
    const callSession = callSessions.get(callId);
    
    if (callSession) {
      callSession.status = 'accepted';
      console.log(`📞 Call ${callId} accepted`);
      
      // Notify both parties that call was accepted
      io.to(`user_${callSession.caller}`).emit('call:accepted', { 
        callId, 
        by: callSession.callee 
      });
      io.to(`user_${callSession.callee}`).emit('call:accepted', { 
        callId, 
        by: callSession.callee 
      });
    }
  });

  // Reject call
  socket.on('call:reject', (data) => {
    const { callId } = data;
    const callSession = callSessions.get(callId);
    
    if (callSession) {
      console.log(`📞 Call ${callId} rejected`);
      
      // Notify caller that call was rejected
      io.to(`user_${callSession.caller}`).emit('call:rejected', { callId });
      
      // Clean up call session
      callSessions.delete(callId);
    }
  });

  // End call
  socket.on('call:end', (data) => {
    const { callId } = data;
    const callSession = callSessions.get(callId);
    
    if (callSession) {
      console.log(`📞 Call ${callId} ended`);
      
      // Notify both parties that call ended
      io.to(`user_${callSession.caller}`).emit('call:ended', { callId });
      io.to(`user_${callSession.callee}`).emit('call:ended', { callId });
      
      // Clean up call session
      callSessions.delete(callId);
    }
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc:offer', (data) => {
    const { to, offer, callId } = data;
    console.log(`🔄 WebRTC offer from socket ${socket.id} to user ${to}`);
    
    io.to(`user_${to}`).emit('webrtc:offer', {
      from: getUserIdBySocketId(socket.id),
      offer,
      callId
    });
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc:answer', (data) => {
    const { to, answer, callId } = data;
    console.log(`🔄 WebRTC answer from socket ${socket.id} to user ${to}`);
    
    io.to(`user_${to}`).emit('webrtc:answer', {
      from: getUserIdBySocketId(socket.id),
      answer,
      callId
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('webrtc:ice-candidate', (data) => {
    const { to, candidate, callId } = data;
    console.log(`🔄 ICE candidate from socket ${socket.id} to user ${to}`);
    
    io.to(`user_${to}`).emit('webrtc:ice-candidate', {
      from: getUserIdBySocketId(socket.id),
      candidate,
      callId
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { roomId, userId, userName } = data;
    socket.to(roomId).emit('user_typing', { userId, userName });
  });

  socket.on('typing_stop', (data) => {
    const { roomId, userId } = data;
    socket.to(roomId).emit('user_stopped_typing', { userId });
  });

  // Handle message read status
  socket.on('mark_messages_read', async (data) => {
    try {
      const { roomId, userId, messageIds } = data;
      
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiverId: userId,
          roomId
        },
        { 
          $set: { 
            read: true,
            status: 'read'
          } 
        }
      );

      io.to(roomId).emit('messages_read', { messageIds, readBy: userId });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`👋 ${user.name} (${user.userType}) disconnected: ${reason}`);
      
      // Clean up from rooms
      rooms.forEach((room, roomId) => {
        if (room.has(user.userId)) {
          room.delete(user.userId);
          socket.to(roomId).emit('user_left_room', { userId: user.userId });
        }
      });
      
      // Clean up active calls
      callSessions.forEach((callSession, callId) => {
        if (callSession.caller === user.userId || callSession.callee === user.userId) {
          const otherUserId = callSession.caller === user.userId ? callSession.callee : callSession.caller;
          io.to(`user_${otherUserId}`).emit('call:ended', { callId, reason: 'user_disconnected' });
          callSessions.delete(callId);
        }
      });
      
      // Remove from users map
      users.delete(socket.id);
      
      // Broadcast offline status
      socket.broadcast.emit('user_status_changed', { 
        userId: user.userId, 
        status: 'offline',
        userType: user.userType 
      });
    } else {
      console.log(`👋 Unknown user disconnected: ${socket.id} (${reason})`);
    }
  });

  socket.on('error', (error) => {
    console.error('🔌 Socket error:', error);
  });
});

// Helper function to get userId by socketId
function getUserIdBySocketId(socketId) {
  const user = users.get(socketId);
  return user ? user.userId : null;
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('❌ Error stack:', err.stack);
  
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS Error',
      details: 'Origin not allowed'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❓ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Initialize server
async function startServer() {
  try {
    console.log("🚀 Starting Cardio Backend Server...");
    
    await connectDB();
    
    console.log("📊 Database connected successfully");
    
    server.listen(PORT, HOST, () => {
      console.log(`\n🚀 Server is running successfully!`);
      console.log(`📍 Host: ${HOST}:${PORT}`);
      console.log(`🌐 Server accessible at:`);
      console.log(`   • Local:   http://localhost:${PORT}`);
      console.log(`   • Network: http://${networkIP}:${PORT}`);
      console.log(`   • Android: http://${networkIP}:${PORT}/api`);
      console.log(`\n📱 Flutter Endpoints:`);
      console.log(`   • Health:  http://${networkIP}:${PORT}/api/health`);
      console.log(`   • Test:    http://${networkIP}:${PORT}/api/test`);
      console.log(`   • Status:  http://${networkIP}:${PORT}/api/status`);
      console.log(`\n👥 User Management:`);
      console.log(`   • Patient Signup:           POST /api/auth/patient/signup`);
      console.log(`   • Ambulance Employer Signup: POST /api/auth/ambulance-employer/signup`);
      console.log(`   • Patient Login:            POST /api/auth/patient/login`);
      console.log(`   • Ambulance Employer Login: POST /api/auth/ambulance-employer/login`);
      console.log(`   • Universal Logout:         POST /api/auth/logout`);
      console.log(`\n🔐 Authentication Check:`);
      console.log(`   • Patient Auth:             GET /api/patients/check-auth`);
      console.log(`   • Ambulance Employer Auth:  GET /api/ambulance-employers/check-auth`);
      console.log(`\n🧪 Debug Endpoints:`);
      console.log(`   • Test Ambulance Employer:  POST /api/debug/test-ambulance-employer`);
      console.log(`   • Collections Info:         GET /api/debug/collections-info`);
      console.log(`   • Test Flutter Signup:      POST /api/debug/test-flutter-signup`);
      console.log(`\n🏥 Medical EHR Endpoints:`);
      console.log(`   • Visits:           /api/visits/*`);
      console.log(`   • Hospitalizations: /api/hospitalizations/*`);
      console.log(`   • Procedures:       /api/procedures/*`);
      console.log(`   • Lab Results:      /api/lab-results/*`);
      console.log(`   • Imaging:          /api/imaging/*`);
      console.log(`   • Medications:      /api/medications/*`);
      console.log(`   • Vital Signs:      /api/vital-signs/*`);
      console.log(`\n🏥 Legacy Endpoints (still supported):`);
      console.log(`   • Patient:  /api/patient/*`);
      console.log(`   • Doctors:  /api/doctors/*`);
      console.log(`   • Messages: /api/messages/*`);
      console.log(`\n🔌 Socket.IO enabled with WebRTC support`);
      console.log(`📋 Database: Connected (patients & ambulanceEmployers collections)`);
      console.log(`\n💡 For Android testing, use IP: ${networkIP}`);
      
      console.log(`\n🔒 CORS allowed origins:`);
      allowedOrigins.forEach(origin => console.log(`   • ${origin}`));
      
      console.log(`\n✅ Server ready for Flutter and Web connections!\n`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
        console.error(`💡 Try: kill -9 $(lsof -ti:${PORT}) or use a different port`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${PORT}. Try using a port > 1024.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close(false, () => {
          console.log('✅ Database connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
//