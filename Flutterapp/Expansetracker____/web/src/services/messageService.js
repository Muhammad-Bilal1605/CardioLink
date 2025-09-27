import axios from 'axios';
import { DATABASE_CONFIG, generateRoomId } from '../config/database.js';

class MessageService {
  constructor() {
    this.baseURL = DATABASE_CONFIG.API_BASE_URL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Set authentication token
  setAuthToken(token) {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  // Send message to database
  async sendMessage(doctorId, patientId, message, messageType = 'text', mediaUrl = null) {
    try {
      const roomId = generateRoomId(doctorId, patientId);
      
      console.log('📤 Sending message to database:');
      console.log('   Database:', DATABASE_CONFIG.DATABASE_NAME);
      console.log('   Collection:', DATABASE_CONFIG.COLLECTIONS.MESSAGES);
      console.log('   Room ID:', roomId);
      console.log('   Message:', message);

      const response = await this.axiosInstance.post(DATABASE_CONFIG.MESSAGE_ENDPOINTS.SEND_MESSAGE, {
        roomId: roomId,
        receiverId: patientId,
        message: message,
        messageType: messageType,
        mediaUrl: mediaUrl
      });

      if (response.data.status === 'success') {
        console.log('✅ Message stored in MongoDB successfully');
        console.log('   Message ID:', response.data.data.message._id);
        console.log('   Stored in:', `${DATABASE_CONFIG.DATABASE_NAME}.${DATABASE_CONFIG.COLLECTIONS.MESSAGES}`);
        return response.data.data.message;
      }

      throw new Error('Failed to send message');
    } catch (error) {
      console.error('❌ Error sending message to database:', error);
      throw error;
    }
  }

  // Get conversation history from database
  async getConversation(doctorId, patientId, page = 1, limit = 50) {
    try {
      const roomId = generateRoomId(doctorId, patientId);
      
      console.log('📚 Loading conversation from database:');
      console.log('   Database:', DATABASE_CONFIG.DATABASE_NAME);
      console.log('   Collection:', DATABASE_CONFIG.COLLECTIONS.MESSAGES);
      console.log('   Room ID:', roomId);

      const response = await this.axiosInstance.get(
        `${DATABASE_CONFIG.MESSAGE_ENDPOINTS.GET_CONVERSATION}/${roomId}`,
        {
          params: { page, limit }
        }
      );

      if (response.data.status === 'success') {
        const messages = response.data.data.messages || [];
        console.log('✅ Loaded messages from MongoDB:', messages.length);
        return messages;
      }

      return [];
    } catch (error) {
      console.error('❌ Error loading conversation from database:', error);
      return [];
    }
  }

  // Get all conversations for a user
  async getConversations(userId) {
    try {
      console.log('📋 Loading conversations from database:');
      console.log('   Database:', DATABASE_CONFIG.DATABASE_NAME);
      console.log('   Collection:', DATABASE_CONFIG.COLLECTIONS.MESSAGES);
      console.log('   User ID:', userId);

      const response = await this.axiosInstance.get(DATABASE_CONFIG.MESSAGE_ENDPOINTS.GET_CONVERSATIONS);

      if (response.data.status === 'success') {
        const conversations = response.data.data || [];
        console.log('✅ Loaded conversations from MongoDB:', conversations.length);
        return conversations;
      }

      return [];
    } catch (error) {
      console.error('❌ Error loading conversations from database:', error);
      return [];
    }
  }

  // Mark messages as read in database
  async markMessagesAsRead(messageIds) {
    try {
      console.log('📖 Marking messages as read in database:', messageIds);

      const response = await this.axiosInstance.patch(DATABASE_CONFIG.MESSAGE_ENDPOINTS.MARK_READ, {
        messageIds: messageIds
      });

      if (response.data.status === 'success') {
        console.log('✅ Messages marked as read in MongoDB');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      return false;
    }
  }

  // Delete message from database
  async deleteMessage(messageId) {
    try {
      console.log('🗑️ Deleting message from database:', messageId);

      const response = await this.axiosInstance.delete(`${DATABASE_CONFIG.MESSAGE_ENDPOINTS.DELETE_MESSAGE}/${messageId}`);

      if (response.data.status === 'success') {
        console.log('✅ Message deleted from MongoDB');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return false;
    }
  }

  // Get database connection info
  getDatabaseInfo() {
    return {
      mongoUri: DATABASE_CONFIG.MONGO_URI,
      database: DATABASE_CONFIG.DATABASE_NAME,
      collection: DATABASE_CONFIG.COLLECTIONS.MESSAGES,
      fullPath: `${DATABASE_CONFIG.DATABASE_NAME}.${DATABASE_CONFIG.COLLECTIONS.MESSAGES}`,
      cluster: 'cluster0.xxtyk.mongodb.net'
    };
  }
}

export default new MessageService();
