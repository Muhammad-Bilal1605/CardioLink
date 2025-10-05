//Mern index.js  
//c:\Users\PMLS\Desktop\CardioLink\CardioLink\backend\index.js
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
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

import { connectDB } from "./db/connectDB.js";

// Import auth routes (ES6 module)
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Agora Configuration
const AGORA_APP_ID = process.env.AGORA_APP_ID || '88a403916325401a8e5f04beff756692';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '8407591dbbda46f9b4286093767b7e80';

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost',  // For local development
  'http://192.168.1.4:5001',  // Your MERN stack server (current machine)
  'http://192.168.1.7:5000',        // Flutter web
  'http://192.168.1.3:5000',   // Flutter app
  'http://192.168.1.10'        // MERN stack web
];

// Update CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Socket.IO Configuration
// In your index.js, update the Socket.IO server configuration:
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6
});

// Middleware
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies
app.use(morgan('dev')); // logging middleware


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
  
  // Construct the full file path
  const filePath = path.join(__dirname, 'uploads', req.url);
  console.log('Looking for file at:', filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log('✓ File exists at:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
  } else {
    console.log('✗ File NOT found at:', filePath);
    
    // List directory contents for debugging
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

// API Routes
app.use("/api/auth", authRoutes);

// Health check endpoint for Socket.IO
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    activeConnections: io?.engine?.clientsCount || 0,
    socketIOEnabled: true
  });
});

// ========== AGORA TOKEN GENERATION ENDPOINT ==========
// Agora Token Generation
app.post('/api/videocall/generate-token', (req, res) => {
  try {
    const { channelName, uid } = req.body;
    
    console.log('Token request received:', { channelName, uid });
    
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

    console.log('Token generated successfully for channel:', channelName);

    res.json({
      token,
      appId: AGORA_APP_ID,
      channelName,
      uid: uidInt
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// ========== SOCKET.IO IMPLEMENTATION ==========

// In-memory storage for chat
const rooms = new Map(); // roomId -> messages[]
const users = new Map(); // socketId -> user info
const userSessions = new Map(); // userId -> socketId[]
const doctorPatientRooms = new Map(); // "doctorId_patientId" -> roomId

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

// Socket.IO connection handler
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
  
  // ========== AGORA VIDEO CALL EVENTS ==========
  
  // Handle call request (initiate call)
  socket.on('call_request', (data) => {
    try {
      const { callerId, calleeId, callerName, callerAvatar, callType, roomId } = data;
      
      console.log(`📞 Call request from ${callerId} to ${calleeId}:`, { callType, roomId });
      
      if (!callerId || !calleeId || !roomId) {
        socket.emit('call_error', { message: 'Missing required call data' });
        return;
      }

      // Find callee's socket sessions
      const calleeSessions = userSessions.get(calleeId) || [];
      
      if (calleeSessions.length === 0) {
        console.log(`❌ Callee ${calleeId} not online`);
        socket.emit('call_error', { message: 'User is not online' });
        return;
      }

      // Send call request to all callee's sessions
      calleeSessions.forEach(sessionSocketId => {
        io.to(sessionSocketId).emit('call_request', {
          callerId,
          callerName,
          callerAvatar,
          callType,
          roomId,
          timestamp: new Date().toISOString()
        });
      });

      console.log(`✅ Call request sent to ${calleeId}`);
      
    } catch (error) {
      console.error('❌ Call request error:', error);
      socket.emit('call_error', { message: `Call request failed: ${error.message}` });
    }
  });

  // Handle call accepted
  socket.on('call_accepted', (data) => {
    try {
      const { callerId, calleeId, callType, roomId } = data;
      
      console.log(`✅ Call accepted by ${calleeId}:`, { roomId });
      
      if (!callerId || !calleeId || !roomId) {
        socket.emit('call_error', { message: 'Missing required call data' });
        return;
      }

      // Notify caller that call was accepted
      const callerSessions = userSessions.get(callerId) || [];
      
      callerSessions.forEach(sessionSocketId => {
        io.to(sessionSocketId).emit('call_accepted', {
          calleeId,
          callType,
          roomId,
          timestamp: new Date().toISOString()
        });
      });

      console.log(`✅ Call acceptance sent to ${callerId}`);
      
    } catch (error) {
      console.error('❌ Call accepted error:', error);
      socket.emit('call_error', { message: `Call acceptance failed: ${error.message}` });
    }
  });

  // Handle call rejected
  socket.on('call_rejected', (data) => {
    try {
      const { callerId, calleeId, roomId } = data;
      
      console.log(`❌ Call rejected by ${calleeId}:`, { roomId });
      
      if (!callerId) {
        return;
      }

      // Notify caller that call was rejected
      const callerSessions = userSessions.get(callerId) || [];
      
      callerSessions.forEach(sessionSocketId => {
        io.to(sessionSocketId).emit('call_rejected', {
          calleeId,
          roomId,
          timestamp: new Date().toISOString()
        });
      });

      console.log(`✅ Call rejection sent to ${callerId}`);
      
    } catch (error) {
      console.error('❌ Call rejected error:', error);
    }
  });

  // Handle call ended
  socket.on('call_ended', (data) => {
    try {
      const { callerId, calleeId, roomId } = data;
      
      console.log(`📞 Call ended:`, { callerId, calleeId, roomId });
      
      // Notify both parties
      const callerSessions = userSessions.get(callerId) || [];
      const calleeSessions = userSessions.get(calleeId) || [];
      
      const allSessions = [...callerSessions, ...calleeSessions];
      
      allSessions.forEach(sessionSocketId => {
        if (sessionSocketId !== socket.id) {
          io.to(sessionSocketId).emit('call_ended', {
            roomId,
            endedBy: callerId,
            timestamp: new Date().toISOString()
          });
        }
      });

      console.log(`✅ Call end notification sent`);
      
    } catch (error) {
      console.error('❌ Call ended error:', error);
    }
  });

  // Handle call timeout
  socket.on('call_timeout', (data) => {
    try {
      const { callerId, calleeId, roomId } = data;
      
      console.log(`⏰ Call timeout:`, { roomId });
      
      // Notify both parties
      if (callerId) {
        const callerSessions = userSessions.get(callerId) || [];
        callerSessions.forEach(sessionSocketId => {
          io.to(sessionSocketId).emit('call_timeout', { roomId });
        });
      }
      
      if (calleeId) {
        const calleeSessions = userSessions.get(calleeId) || [];
        calleeSessions.forEach(sessionSocketId => {
          io.to(sessionSocketId).emit('call_timeout', { roomId });
        });
      }
      
      console.log(`✅ Call timeout notification sent`);
      
    } catch (error) {
      console.error('❌ Call timeout error:', error);
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
});

// ========== END SOCKET.IO IMPLEMENTATION ==========

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

// Initialize server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Load models
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) {
      throw new Error('Failed to load models');
    }
    
    // Load routes
    const routesLoaded = await loadMedicalRoutes();
    if (!routesLoaded) {
      throw new Error('Failed to load routes');
    }
    
    // Start server with Socket.IO
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🔌 Socket.IO enabled and ready for connections`);
      console.log(`📞 Agora video call events integrated`);
      console.log(`🔑 Agora token generation endpoint: POST /api/videocall/generate-token`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();