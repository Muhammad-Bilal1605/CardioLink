# MERN Stack Chat Integration Guide

## Overview
This document provides context for implementing real-time chat functionality in your MERN web application using the existing shared backend that's already configured for Flutter mobile app.

## Backend Architecture (Already Implemented)

### 1. Database Schema
```javascript
// Message Model (MongoDB)
{
  roomId: "room_doctorId_patientId", // Format for organizing conversations
  senderId: ObjectId, // Reference to User collection
  receiverId: ObjectId, // Reference to User collection
  message: String, // Text content
  messageType: "text" | "image" | "audio" | "document",
  mediaUrl: String, // Optional file URL
  read: Boolean, // Read status
  status: "sent" | "delivered" | "read",
  createdAt: Date,
  updatedAt: Date
}
```

### 2. API Endpoints (Available)
```javascript
// Base URL: http://192.168.56.1:5000/api/messages
POST   /                          // Send new message
GET    /conversation/:roomId       // Get conversation history
GET    /conversations             // Get recent conversations list
PATCH  /read                      // Mark messages as read
DELETE /:id                       // Delete message
POST   /upload-media              // Upload files/media
```

### 3. Socket.IO Events (Real-time)
```javascript
// Client → Server Events
socket.emit('join_user', { userId, userType, name });
socket.emit('join_chat_room', { roomId, userId });
socket.emit('send_message', { roomId, senderId, receiverId, message });
socket.emit('typing_start', { roomId, userId, userName });
socket.emit('typing_stop', { roomId, userId });
socket.emit('mark_messages_read', { roomId, userId, messageIds });

// Server → Client Events
socket.on('new_message', (message) => {});
socket.on('message_notification', (data) => {});
socket.on('user_typing', ({ userId, userName }) => {});
socket.on('user_stopped_typing', ({ userId }) => {});
socket.on('messages_read', ({ messageIds, readBy }) => {});
socket.on('user_online', ({ userId }) => {});
socket.on('user_offline', ({ userId }) => {});
```

## MERN Web Integration Steps

### 1. Install Dependencies
```bash
npm install socket.io-client axios
```

### 2. Socket Service Setup
```javascript
// services/socketService.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = 'http://192.168.56.1:5000'; // Your backend URL
  }

  init(userId, userType, token) {
    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.socket.emit('join_user', { userId, userType, name: 'User Name' });
    });

    return this.socket;
  }

  joinChatRoom(roomId) {
    this.socket?.emit('join_chat_room', { roomId, userId: this.userId });
  }

  sendMessage(messageData) {
    this.socket?.emit('send_message', messageData);
  }

  // Add other methods as needed
}

export default new SocketService();
```

### 3. API Service for HTTP Requests
```javascript
// services/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://192.168.56.1:5000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get conversation history
  async getConversation(roomId, page = 1, limit = 50) {
    const response = await this.client.get(`/messages/conversation/${roomId}?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Get recent conversations
  async getRecentConversations() {
    const response = await this.client.get('/messages/conversations');
    return response.data;
  }

  // Send message via HTTP (backup to socket)
  async sendMessage(messageData) {
    const response = await this.client.post('/messages', messageData);
    return response.data;
  }

  // Mark messages as read
  async markAsRead(roomId, messageIds) {
    const response = await this.client.patch('/messages/read', {
      roomId,
      messageIds,
    });
    return response.data;
  }
}

export default new ApiService();
```

### 4. React Hook for Chat
```javascript
// hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import apiService from '../services/apiService';

export const useChat = (currentUser, roomId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !roomId) return;

    // Initialize socket
    const socket = socketService.init(currentUser.id, currentUser.type, currentUser.token);
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Join chat room
    socketService.joinChatRoom(roomId);

    // Load message history
    loadMessages();

    // Set up real-time listeners
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('messages_read', handleMessagesRead);
      socketService.disconnect();
    };
  }, [currentUser, roomId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await apiService.getConversation(roomId);
      setMessages(data.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !isConnected) return;

    const messageData = {
      roomId,
      senderId: currentUser.id,
      receiverId: getOtherUserId(roomId, currentUser.id),
      message: text.trim(),
      messageType: 'text',
    };

    socketService.sendMessage(messageData);
  }, [roomId, currentUser, isConnected]);

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    
    // Mark as read if not from current user
    if (message.senderId !== currentUser.id) {
      apiService.markAsRead(roomId, [message._id]);
    }
  };

  const handleUserTyping = ({ userId, userName }) => {
    if (userId !== currentUser.id) {
      setTypingUsers(prev => new Set([...prev, userName]));
    }
  };

  const handleUserStoppedTyping = ({ userId }) => {
    if (userId !== currentUser.id) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        // Remove user from typing (you'd need to map userId to userName)
        return newSet;
      });
    }
  };

  const handleMessagesRead = ({ messageIds }) => {
    setMessages(prev => 
      prev.map(msg => 
        messageIds.includes(msg._id) 
          ? { ...msg, status: 'read' }
          : msg
      )
    );
  };

  return {
    messages,
    isConnected,
    typingUsers,
    loading,
    sendMessage,
  };
};

// Helper function to extract other user ID from roomId
function getOtherUserId(roomId, currentUserId) {
  const [_, doctorId, patientId] = roomId.split('_');
  return currentUserId === doctorId ? patientId : doctorId;
}
```

### 5. Room ID Generation
```javascript
// utils/chatUtils.js
export const generateRoomId = (doctorId, patientId) => {
  return `room_${doctorId}_${patientId}`;
};

export const parseRoomId = (roomId) => {
  const [_, doctorId, patientId] = roomId.split('_');
  return { doctorId, patientId };
};

// Example usage:
// For Dr. Muhammad Bilal (ID: 68320f2b9dad89de97c68e60) 
// and Patient (ID: 68939b1445d55e455ddb0f2d)
const roomId = generateRoomId('68320f2b9dad89de97c68e60', '68939b1445d55e455ddb0f2d');
// Result: "room_68320f2b9dad89de97c68e60_68939b1445d55e455ddb0f2d"
```

## Implementation Notes

### Authentication
- Use the same JWT tokens from your existing auth system
- Backend already configured with `protect` middleware for message routes

### User Identification
- Doctor ID: `68320f2b9dad89de97c68e60` (Muhammad Bilal)
- Patient ID: `68939b1445d55e455ddb0f2d` (Millie)
- Use these IDs to create room: `room_68320f2b9dad89de97c68e60_68939b1445d55e455ddb0f2d`

### Network Configuration
- Backend running on: `http://192.168.56.1:5000`
- Socket.IO endpoint: `http://192.168.56.1:5000`
- CORS already configured for web clients

### Database Access
- Messages stored in `messages` collection
- Users referenced from existing `users` collection
- All queries use proper MongoDB ObjectId references

## Testing
1. Start backend: `npm run dev` in `/lib/backend`
2. Backend should show: "✅ Server ready for Flutter connections!"
3. Test API endpoints with Postman or your web app
4. Socket.IO connection should establish automatically

## Error Handling
- Handle connection failures gracefully
- Implement retry logic for failed messages
- Show offline indicators when socket disconnected
- Cache messages locally for better UX

This integration allows your MERN web application to seamlessly communicate with the same backend and database that your Flutter mobile app uses, ensuring consistent real-time messaging across all platforms.
