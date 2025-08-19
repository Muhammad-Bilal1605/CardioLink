const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all conversations for the current user
router.get('/conversations', chatController.getConversations);

// Get or create a conversation with another user
router.get('/conversation/with/:participantId', chatController.getOrCreateConversation);

// Get messages for a conversation
router.get('/conversation/:conversationId/messages', chatController.getMessages);

// Send a new message (with optional file upload)
router.post(
  '/messages', 
  upload.single('file'),
  chatController.sendMessage
);

// Mark messages as read
router.post('/conversation/:conversationId/read', chatController.markAsRead);

module.exports = router;
