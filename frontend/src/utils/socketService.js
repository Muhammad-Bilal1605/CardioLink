import { io } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Initialize socket connection
  init(token) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Setup default event handlers
    this.setupEventHandlers();
    
    return this.socket;
  }

  // Setup default event handlers
  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.emitEvent('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emitEvent('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.emitEvent('connect_error', error);
    });
  }

  // Join a room
  joinRoom(roomId, userId, userType) {
    if (!this.socket) return;
    this.socket.emit('join_room', { roomId, userId, userType });
  }

  // Leave a room
  leaveRoom(roomId, userId) {
    if (!this.socket) return;
    this.socket.emit('leave_room', { roomId, userId });
  }

  // Send a message
  sendMessage(messageData) {
    if (!this.socket) return;
    return new Promise((resolve, reject) => {
      this.socket.emit('send_message', messageData, (response) => {
        if (response?.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Typing indicators
  startTyping(roomId, userId) {
    if (!this.socket) return;
    this.socket.emit('typing_start', { roomId, userId });
  }

  stopTyping(roomId, userId) {
    if (!this.socket) return;
    this.socket.emit('typing_stop', { roomId, userId });
  }

  // Mark messages as read
  markMessagesRead(roomId, messageIds, userId) {
    if (!this.socket) return;
    this.socket.emit('mark_messages_read', { roomId, messageIds, userId });
  }

  // Add event listener
  on(event, callback) {
    if (!this.socket) return;
    
    const listener = (...args) => callback(...args);
    this.socket.on(event, listener);
    
    // Store the listener for later removal
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;
    
    this.socket.off(event, callback);
    
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit custom event to listeners
  emitEvent(event, ...args) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      }
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      // Remove all listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();
      
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();

export default socketService;
