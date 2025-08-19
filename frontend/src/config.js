/**
 * Application configuration
 * This file contains all the configuration variables used throughout the application
 */

// Base URL for API requests
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// WebSocket configuration
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:5000';

// File upload configuration
const UPLOAD_CONFIG = {
  // Maximum file size in bytes (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Allowed file types for upload
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  ALLOWED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm'
  ],
  
  // File type extensions for validation
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_DOCUMENT_EXTENSIONS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
  ALLOWED_AUDIO_EXTENSIONS: ['mp3', 'wav', 'ogg', 'webm']
};

// Chat configuration
const CHAT_CONFIG = {
  // Maximum number of messages to load per batch
  MESSAGES_PER_PAGE: 50,
  
  // Typing indicator timeout in milliseconds
  TYPING_TIMEOUT: 2000,
  
  // Message status update interval in milliseconds
  STATUS_UPDATE_INTERVAL: 5000,
  
  // Time format for message timestamps
  TIME_FORMAT: 'h:mm a',
  DATE_FORMAT: 'MMM d, yyyy',
  
  // Maximum number of characters in a message
  MAX_MESSAGE_LENGTH: 2000,
  
  // Maximum number of files that can be attached to a single message
  MAX_FILES_PER_MESSAGE: 5
};

// WebSocket events
const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Authentication events
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  UNAUTHORIZED: 'unauthorized',
  
  // Message events
  MESSAGE: 'message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  MESSAGE_ERROR: 'message_error',
  
  // Typing events
  TYPING_START: 'typing_start',
  TYPING_END: 'typing_end',
  
  // User status events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_TYPING: 'user_typing',
  
  // Call events
  CALL_INITIATE: 'call_initiate',
  CALL_ACCEPT: 'call_accept',
  CALL_REJECT: 'call_reject',
  CALL_END: 'call_end',
  CALL_ICE_CANDIDATE: 'call_ice_candidate',
  CALL_OFFER: 'call_offer',
  CALL_ANSWER: 'call_answer'
};

// API endpoints
const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  
  // User endpoints
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    AVATAR: '/users/avatar',
    SEARCH: '/users/search',
    ONLINE_STATUS: '/users/online-status'
  },
  
  // Chat endpoints
  CHATS: {
    BASE: '/chats',
    CONVERSATIONS: '/chats/conversations',
    MESSAGES: (chatId) => `/chats/${chatId}/messages`,
    MARK_AS_READ: (chatId) => `/chats/${chatId}/read`,
    MARK_AS_DELIVERED: (chatId) => `/chats/${chatId}/delivered`,
    UPLOAD: '/chats/upload',
    DOWNLOAD: (fileId) => `/chats/download/${fileId}`
  },
  
  // Call endpoints
  CALLS: {
    BASE: '/calls',
    START: '/calls/start',
    END: (callId) => `/calls/${callId}/end`,
    RATE: (callId) => `/calls/${callId}/rate`,
    HISTORY: '/calls/history'
  }
};

export {
  API_BASE_URL,
  WS_BASE_URL,
  UPLOAD_CONFIG,
  CHAT_CONFIG,
  SOCKET_EVENTS,
  ENDPOINTS
};