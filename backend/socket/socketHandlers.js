// backend/socket/socketHandlers.js - Enhanced for video calling
const socketIo = require('socket.io');

let io;
const connectedUsers = new Map(); // Store connected users with their socket info
const activeRooms = new Map(); // Track active chat rooms
const activeCalls = new Map(); // Track active video calls

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "*"], // Allow Flutter and React
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Handle user registration (both doctors and patients)
    socket.on('register_user', (data) => {
      const { userId, userType, userName } = data;
      
      console.log(`Registering ${userType}: ${userId} (${userName})`);
      
      // Store user connection info
      connectedUsers.set(userId, {
        socketId: socket.id,
        userType,
        userName,
        status: 'online',
        lastSeen: new Date()
      });
      
      // Store socket mapping
      socket.userId = userId;
      socket.userType = userType;
      socket.userName = userName;
      
      // Confirm registration
      socket.emit('user_registered', {
        success: true,
        userId,
        userType,
        message: `${userType} registered successfully`
      });
      
      // Notify other users about online status
      socket.broadcast.emit('user_status_update', {
        userId,
        status: 'online',
        userType
      });
      
      console.log(`${userType} ${userId} registered with socket ${socket.id}`);
      console.log(`Total connected users: ${connectedUsers.size}`);
    });

    // Handle joining chat rooms
    socket.on('join_room', (data) => {
      const { roomId, userId } = data;
      
      socket.join(roomId);
      
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add(userId);
      
      console.log(`User ${userId} joined room ${roomId}`);
      
      // Notify room members
      socket.to(roomId).emit('user_joined_room', {
        userId,
        roomId,
        timestamp: new Date()
      });
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      const { roomId, senderId, text, type = 'text' } = data;
      
      const messageData = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId,
        senderId,
        text,
        type,
        timestamp: new Date(),
        createdAt: new Date(),
        status: 'sent'
      };
      
      console.log(`Message in room ${roomId} from ${senderId}: ${text}`);
      
      // Send to all users in the room including sender
      io.to(roomId).emit('receive_message', messageData);
    });

    // =================== VIDEO CALL HANDLING ===================
    
    // Handle call initiation (from doctor or patient)
    socket.on('call:initiate', (data) => {
      const { to, from, callerName, isVideo = true, roomId } = data;
      
      console.log(`Call initiation: ${from} -> ${to} (${isVideo ? 'video' : 'audio'})`);
      
      // Generate call ID if not provided
      const callId = roomId || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store call info
      activeCalls.set(callId, {
        callId,
        from,
        to,
        callerName,
        isVideo,
        status: 'calling',
        startTime: new Date(),
        roomId: callId
      });
      
      // Find target user
      const targetUser = connectedUsers.get(to);
      
      if (targetUser && targetUser.socketId) {
        // Send call invitation to target user
        io.to(targetUser.socketId).emit('call:initiate', {
          callId,
          from,
          callerName: callerName || socket.userName || 'Unknown',
          isVideo,
          roomId: callId,
          timestamp: new Date()
        });
        
        console.log(`Call invitation sent to ${to} (${targetUser.socketId})`);
      } else {
        // Target user not found or offline
        console.log(`Target user ${to} not found or offline`);
        
        socket.emit('call:error', {
          callId,
          message: 'User is not available for calls',
          reason: 'user_offline'
        });
        
        // Remove call from active calls
        activeCalls.delete(callId);
      }
    });
    
    // Handle call response (accept/reject)
    socket.on('call:response', (data) => {
      const { to, from, accepted, callId, isVideo } = data;
      
      console.log(`Call response: ${from} -> ${to}, accepted: ${accepted}`);
      
      // Find target user (the one who initiated the call)
      const targetUser = connectedUsers.get(to);
      
      if (targetUser && targetUser.socketId) {
        // Send response to caller
        io.to(targetUser.socketId).emit('call:response', {
          callId,
          from,
          to,
          accepted,
          isVideo,
          timestamp: new Date()
        });
        
        if (accepted) {
          // Update call status
          if (activeCalls.has(callId)) {
            const call = activeCalls.get(callId);
            call.status = 'accepted';
            call.acceptedTime = new Date();
            activeCalls.set(callId, call);
          }
          
          console.log(`Call ${callId} accepted between ${from} and ${to}`);
          
          // Notify both parties that call is starting
          const callStartData = {
            callId,
            participants: [from, to],
            isVideo,
            status: 'connecting',
            timestamp: new Date()
          };
          
          socket.emit('call:start', callStartData);
          io.to(targetUser.socketId).emit('call:start', callStartData);
          
        } else {
          // Call rejected
          console.log(`Call ${callId} rejected by ${from}`);
          
          // Remove from active calls
          activeCalls.delete(callId);
        }
      } else {
        console.log(`Cannot send call response: target user ${to} not found`);
        
        socket.emit('call:error', {
          callId,
          message: 'Cannot reach the other party',
          reason: 'user_disconnected'
        });
      }
    });
    
    // Handle call end
    socket.on('call:end', (data) => {
      const { to, from, callId } = data;
      
      console.log(`Call end: ${from} -> ${to}, callId: ${callId}`);
      
      // Remove from active calls
      if (callId && activeCalls.has(callId)) {
        const call = activeCalls.get(callId);
        call.endTime = new Date();
        call.status = 'ended';
        
        // Calculate call duration
        const duration = call.acceptedTime ? 
          Math.floor((call.endTime - call.acceptedTime) / 1000) : 0;
        
        console.log(`Call ${callId} ended. Duration: ${duration} seconds`);
        
        activeCalls.delete(callId);
      }
      
      // Notify the other party
      if (to) {
        const targetUser = connectedUsers.get(to);
        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit('call:end', {
            callId,
            from,
            timestamp: new Date(),
            reason: 'ended_by_other_party'
          });
        }
      }
      
      // Also notify the sender (confirmation)
      socket.emit('call:end', {
        callId,
        timestamp: new Date(),
        reason: 'call_ended_successfully'
      });
    });

    // =================== CONNECTION HANDLING ===================
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      const { roomId, userId, isTyping } = data;
      
      socket.to(roomId).emit('user_typing', {
        userId,
        isTyping,
        timestamp: new Date()
      });
    });
    
    // Handle leaving rooms
    socket.on('leave_room', (data) => {
      const { roomId, userId } = data;
      
      socket.leave(roomId);
      
      if (activeRooms.has(roomId)) {
        activeRooms.get(roomId).delete(userId);
        
        // Remove room if empty
        if (activeRooms.get(roomId).size === 0) {
          activeRooms.delete(roomId);
        }
      }
      
      console.log(`User ${userId} left room ${roomId}`);
    });
    
    // Handle user status updates
    socket.on('status_update', (data) => {
      const { userId, status } = data;
      
      if (connectedUsers.has(userId)) {
        const user = connectedUsers.get(userId);
        user.status = status;
        user.lastSeen = new Date();
        connectedUsers.set(userId, user);
        
        // Broadcast status update
        socket.broadcast.emit('user_status_update', {
          userId,
          status,
          timestamp: new Date()
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id} (${reason})`);
      
      if (socket.userId) {
        // Update user status to offline
        if (connectedUsers.has(socket.userId)) {
          const user = connectedUsers.get(socket.userId);
          user.status = 'offline';
          user.lastSeen = new Date();
          connectedUsers.set(socket.userId, user);
          
          // Notify others about user going offline
          socket.broadcast.emit('user_status_update', {
            userId: socket.userId,
            status: 'offline',
            userType: socket.userType,
            timestamp: new Date()
          });
        }
        
        // Handle any active calls this user was in
        for (const [callId, call] of activeCalls.entries()) {
          if (call.from === socket.userId || call.to === socket.userId) {
            // End the call due to disconnection
            const otherUserId = call.from === socket.userId ? call.to : call.from;
            const otherUser = connectedUsers.get(otherUserId);
            
            if (otherUser && otherUser.socketId) {
              io.to(otherUser.socketId).emit('call:end', {
                callId,
                reason: 'user_disconnected',
                disconnectedUser: socket.userId,
                timestamp: new Date()
              });
            }
            
            console.log(`Ending call ${callId} due to user ${socket.userId} disconnection`);
            activeCalls.delete(callId);
          }
        }
        
        // Remove from active rooms
        for (const [roomId, users] of activeRooms.entries()) {
          if (users.has(socket.userId)) {
            users.delete(socket.userId);
            
            // Notify room members
            socket.to(roomId).emit('user_left_room', {
              userId: socket.userId,
              roomId,
              reason: 'disconnected',
              timestamp: new Date()
            });
            
            // Remove room if empty
            if (users.size === 0) {
              activeRooms.delete(roomId);
            }
          }
        }
        
        // Don't remove from connectedUsers immediately - keep for offline status
        // connectedUsers.delete(socket.userId);
        
        console.log(`User ${socket.userId} (${socket.userType}) went offline`);
      }
    });

    // Health check endpoint for socket connection
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date(),
        server: 'CardioLink Backend',
        status: 'healthy'
      });
    });
    
    // Get online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(connectedUsers.entries())
        .filter(([userId, user]) => user.status === 'online')
        .map(([userId, user]) => ({
          userId,
          userType: user.userType,
          userName: user.userName,
          status: user.status,
          lastSeen: user.lastSeen
        }));
      
      socket.emit('online_users', onlineUsers);
    });
    
    // Get active calls
    socket.on('get_active_calls', () => {
      const calls = Array.from(activeCalls.values()).map(call => ({
        callId: call.callId,
        participants: [call.from, call.to],
        status: call.status,
        isVideo: call.isVideo,
        startTime: call.startTime
      }));
      
      socket.emit('active_calls', calls);
    });
  });

  return io;
};

// Helper functions for external use
const getConnectedUsers = () => {
  return Array.from(connectedUsers.entries()).map(([userId, user]) => ({
    userId,
    userType: user.userType,
    userName: user.userName,
    status: user.status,
    lastSeen: user.lastSeen
  }));
};

const getActiveCalls = () => {
  return Array.from(activeCalls.values());
};

const sendMessageToUser = (userId, event, data) => {
  const user = connectedUsers.get(userId);
  if (user && user.socketId && io) {
    io.to(user.socketId).emit(event, data);
    return true;
  }
  return false;
};

const broadcastToRoom = (roomId, event, data) => {
  if (io) {
    io.to(roomId).emit(event, data);
    return true;
  }
  return false;
};

// Clean up old offline users periodically (optional)
const cleanupOfflineUsers = () => {
  const now = new Date();
  const maxOfflineTime = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [userId, user] of connectedUsers.entries()) {
    if (user.status === 'offline' && 
        now - user.lastSeen > maxOfflineTime) {
      connectedUsers.delete(userId);
      console.log(`Cleaned up old offline user: ${userId}`);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupOfflineUsers, 60 * 60 * 1000);

module.exports = {
  initializeSocket,
  getConnectedUsers,
  getActiveCalls,
  sendMessageToUser,
  broadcastToRoom
};