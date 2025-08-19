import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../config';

class ChatService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.messageListeners = [];
    this.typingListeners = [];
    this.statusListeners = [];
    this.callListeners = [];
    this.connected = false;
    this.connectPromise = null;
  }

  // Initialize the service with user token
  initialize(token) {
    this.token = token;
    this.setupAxiosInterceptors();
    this.connectSocket();
  }

  // Set up axios interceptors for authentication
  setupAxiosInterceptors() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    });
  }

  // Connect to WebSocket server
  connectSocket() {
    if (this.connected) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token: this.token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.connected = true;
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        this.connected = false;
      });
    });

    return this.connectPromise;
  }

  // Set up WebSocket event listeners
  setupSocketListeners() {
    this.socket.on('new_message', (message) => {
      this.messageListeners.forEach(callback => callback(message));
    });

    this.socket.on('typing', (data) => {
      this.typingListeners.forEach(callback => callback(data));
    });

    this.socket.on('user_status', (data) => {
      this.statusListeners.forEach(callback => callback(data));
    });

    this.socket.on('call', (data) => {
      this.callListeners.forEach(callback => callback(data));
    });
  }

  // API Methods
  async getConversations() {
    const response = await this.api.get('/api/chat/conversations');
    return response.data;
  }

  async getMessages(conversationId, { before, limit = 50 } = {}) {
    const params = { limit };
    if (before) params.before = before;
    
    const response = await this.api.get(`/api/chat/conversation/${conversationId}/messages`, { params });
    return response.data;
  }

  async sendTextMessage(conversationId, content, options = {}) {
    const response = await this.api.post('/api/chat/messages', {
      conversationId,
      content,
      type: 'text',
      ...options
    });
    return response.data;
  }

  async sendFileMessage(conversationId, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    formData.append('type', this.getFileType(file.type));
    
    if (options.replyTo) {
      formData.append('replyTo', options.replyTo);
    }
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const response = await this.api.post('/api/chat/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  async markMessagesAsRead(conversationId) {
    if (!this.connected) await this.connectSocket();
    this.socket.emit('mark_read', { conversationId });
  }

  async getOrCreateConversation(participantId) {
    const response = await this.api.get(`/api/chat/conversation/with/${participantId}`);
    return response.data;
  }

  // WebSocket Methods
  sendTypingIndicator(conversationId, isTyping = true) {
    if (!this.connected) return;
    this.socket.emit('typing', { 
      conversationId, 
      isTyping 
    });
  }

  // Event Listeners
  onMessage(callback) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  onTyping(callback) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(cb => cb !== callback);
    };
  }

  onUserStatus(callback) {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  onCall(callback) {
    this.callListeners.push(callback);
    return () => {
      this.callListeners = this.callListeners.filter(cb => cb !== callback);
    };
  }

  // Helper Methods
  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  // Clean up
  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageListeners = [];
    this.typingListeners = [];
    this.statusListeners = [];
    this.callListeners = [];
    this.connected = false;
    this.connectPromise = null;
  }
}

// Export a singleton instance
export const chatService = new ChatService();
export default chatService;
