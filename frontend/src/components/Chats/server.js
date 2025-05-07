// Socket.io server for DoctorChats application

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";


const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your client URL
    methods: ["GET", "POST"]
  }
});

// Track online users
const users = new Map();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle user login
  socket.on('user_login', (data) => {
    const { userId, userType } = data;
    users.set(socket.id, { userId, userType, socketId: socket.id });
    
    // Broadcast user status to all connected clients
    io.emit('status_change', {
      userId,
      status: 'online'
    });
  });
  
  // Handle user logout or disconnect
  const handleDisconnect = () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Broadcast user status to all connected clients
      io.emit('status_change', {
        userId: user.userId,
        status: 'offline'
      });
    }
  };
  
  socket.on('disconnect', handleDisconnect);
  socket.on('user_logout', handleDisconnect);
  
  // Handle sending messages
  socket.on('send_message', (data) => {
    const { sender, receiver, text, timestamp, type, audioUrl } = data;
    
    // Find the receiver's socket if they're online
    const receiverSocket = Array.from(users.values()).find(user => 
      user.userId === receiver
    );
    
    if (receiverSocket) {
      // Send to specific user if they're online
      io.to(receiverSocket.socketId).emit('receive_message', {
        sender,
        text,
        timestamp,
        type,
        audioUrl
      });
    }
    
    // In a real application, you would also store the message in a database
    // so it can be retrieved when the user comes online
  });
  
  // Handle user typing status
  socket.on('typing', (data) => {
    const { sender, receiver } = data;
    
    // Find the receiver's socket if they're online
    const receiverSocket = Array.from(users.values()).find(user => 
      user.userId === receiver
    );
    
    if (receiverSocket) {
      // Send typing notification to specific user
      io.to(receiverSocket.socketId).emit('user_typing', {
        sender
      });
    }
  });
  
  // Handle user stop typing
  socket.on('stop_typing', (data) => {
    const { sender, receiver } = data;
    
    // Find the receiver's socket if they're online
    const receiverSocket = Array.from(users.values()).find(user => 
      user.userId === receiver
    );
    
    if (receiverSocket) {
      // Send stop typing notification to specific user
      io.to(receiverSocket.socketId).emit('user_stop_typing', {
        sender
      });
    }
  });
  
  // Handle read receipts
  socket.on('message_read', (data) => {
    const { sender, messageIds } = data;
    
    // Find the sender's socket if they're online
    const senderSocket = Array.from(users.values()).find(user => 
      user.userId === sender
    );
    
    if (senderSocket) {
      // Send read receipt to the original sender
      io.to(senderSocket.socketId).emit('receipt_read', {
        messageIds
      });
    }
    
    // In a real application, you would also update the read status in your database
  });
  
  // Handle audio/video call requests
  socket.on('call_request', (data) => {
    const { caller, receiver, callType } = data;
    
    // Find the receiver's socket if they're online
    const receiverSocket = Array.from(users.values()).find(user => 
      user.userId === receiver
    );
    
    if (receiverSocket) {
      // Send call request to specific user
      io.to(receiverSocket.socketId).emit('incoming_call', {
        caller,
        callType
      });
    }
  });
  
  // Handle call responses (accept/reject)
  socket.on('call_response', (data) => {
    const { responder, caller, response, callType } = data;
    
    // Find the caller's socket if they're online
    const callerSocket = Array.from(users.values()).find(user => 
      user.userId === caller
    );
    
    if (callerSocket) {
      // Send response to the caller
      io.to(callerSocket.socketId).emit('call_response', {
        responder,
        response,
        callType
      });
    }
  });
  
  // Handle WebRTC signaling
  socket.on('webrtc_signal', (data) => {
    const { signal, to } = data;
    
    // Find the recipient's socket
    const toSocket = Array.from(users.values()).find(user => 
      user.userId === to
    );
    
    if (toSocket) {
      // Forward the WebRTC signal
      io.to(toSocket.socketId).emit('webrtc_signal', {
        signal,
        from: users.get(socket.id)?.userId
      });
    }
  });
  
  // Handle user status changes (away, busy, etc.)
  socket.on('status_update', (data) => {
    const { status } = data;
    const user = users.get(socket.id);
    
    if (user) {
      // Update user status
      io.emit('status_change', {
        userId: user.userId,
        status
      });
    }
  });
});

// API routes
app.get('/', (req, res) => {
  res.send('DoctorChats Socket.io Server');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});