// Database configuration for MERN stack application
export const DATABASE_CONFIG = {
  // MongoDB Connection Details
  MONGO_URI: 'mongodb+srv://zaheermbilal1605:zCN7GYUy5x6MWhav@cluster0.xxtyk.mongodb.net/Hospitals?retryWrites=true&w=majority&appName=Cluster0',
  
  // Database and Collection Names
  DATABASE_NAME: 'Hospitals',
  COLLECTIONS: {
    MESSAGES: 'messages',
    USERS: 'users',
    DOCTORS: 'doctors',
    PATIENTS: 'patients',
    APPOINTMENTS: 'appointments'
  },
  
  // API Endpoints
  API_BASE_URL: 'http://192.168.56.1:5000/api',
  SOCKET_URL: 'http://192.168.56.1:5000',
  
  // Message API Endpoints
  MESSAGE_ENDPOINTS: {
    SEND_MESSAGE: '/messages',
    GET_CONVERSATION: '/messages/conversation',
    GET_CONVERSATIONS: '/messages/conversations',
    MARK_READ: '/messages/read',
    DELETE_MESSAGE: '/messages'
  },
  
  // Room ID Format
  ROOM_ID_FORMAT: 'room_{doctorId}_{patientId}',
  
  // Message Types
  MESSAGE_TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    AUDIO: 'audio',
    DOCUMENT: 'document'
  },
  
  // Message Status
  MESSAGE_STATUS: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read'
  }
};

// Helper function to generate room ID
export const generateRoomId = (doctorId, patientId) => {
  return `room_${doctorId}_${patientId}`;
};

// Helper function to parse room ID
export const parseRoomId = (roomId) => {
  const parts = roomId.split('_');
  return {
    doctorId: parts[1],
    patientId: parts[2]
  };
};

export default DATABASE_CONFIG;
