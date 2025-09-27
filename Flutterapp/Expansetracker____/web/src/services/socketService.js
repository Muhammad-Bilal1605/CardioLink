import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.userType = null;
    
    // Update this to your server IP
    this.serverUrl = 'http://192.168.1.8:5000'; // Change to your network IP
  }

  // Initialize socket connection
  init(userId, userType, token) {
    this.userId = userId;
    this.userType = userType;

    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
      
      // Join user's personal room
      this.socket.emit('join_user', {
        userId,
        userType,
        name: 'User Name' // Get from user data
      });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  // Join a specific chat room
  joinChatRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat_room', {
        roomId,
        userId: this.userId,
      });
    }
  }

  // Leave a chat room
  leaveChatRoom(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat_room', {
        roomId,
        userId: this.userId,
      });
    }
  }

  // Send a message
  sendMessage({ roomId, senderId, receiverId, message, messageType = 'text', mediaUrl }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        roomId,
        senderId,
        receiverId,
        message,
        messageType,
        mediaUrl,
      });
    }
  }

  // Send typing indicator
  startTyping(roomId, userName) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', {
        roomId,
        userId: this.userId,
        userName,
      });
    }
  }

  // Stop typing indicator
  stopTyping(roomId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', {
        roomId,
        userId: this.userId,
      });
    }
  }

  // Mark messages as read
  markMessagesAsRead(roomId, messageIds) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_messages_read', {
        roomId,
        userId: this.userId,
        messageIds,
      });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageNotification(callback) {
    if (this.socket) {
      this.socket.on('message_notification', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages_read', callback);
    }
  }

  onUserStatusChanged(callback) {
    if (this.socket) {
      this.socket.on('user_status_changed', callback);
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export default new SocketService();
