const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { uploadFile } = require('../utils/fileUpload');

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({
      'participants.user': userId,
      isActive: true
    })
    .populate('participants.user', 'name email avatar role')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    
    let query = { conversationId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'name email avatar role')
      .sort({ createdAt: 1 }); // Return in chronological order

    // Update read status for the current user
    await Message.updateMany(
      { 
        conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      { $addToSet: { readBy: req.user._id } }
    );

    // Update conversation's last read for the user
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': req.user._id },
      { $set: { 'participants.$.lastRead': new Date() } }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text' } = req.body;
    const senderId = req.user._id;
    let fileData = {};

    // Handle file upload if present
    if (req.file) {
      const result = await uploadFile(req.file);
      fileData = {
        url: result.url,
        filename: req.file.originalname,
        size: req.file.size
      };
    }

    // Create new message
    const message = new Message({
      conversationId,
      sender: senderId,
      content,
      type,
      ...fileData,
      status: 'sent'
    });

    const savedMessage = await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'name email avatar role');

    // Update conversation's last message and timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: savedMessage._id,
      $inc: { 'participants.$[].unreadCount': 1 },
      $set: { 'participants.$[elem].unreadCount': 0 }
    }, {
      arrayFilters: [{ 'elem.user': senderId }],
      new: true
    });

    // Emit socket event for real-time update
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(conversationId).emit('newMessage', {
        conversationId,
        message: populatedMessage
      });
      
      // Emit conversation update to all participants
      const conversation = await Conversation.findById(conversationId)
        .populate('participants.user', 'name email avatar role')
        .populate('lastMessage');
      
      conversation.participants.forEach(participant => {
        io.to(`user_${participant.user._id}`).emit('conversationUpdated', conversation);
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Start or get existing conversation
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { participantId } = req.params;
    const currentUserId = req.user._id;

    // Prevent self-conversation
    if (participantId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    const conversation = await Conversation.findOrCreateConversation(currentUserId, participantId);
    
    // Populate last message if exists
    if (conversation.lastMessage) {
      await conversation.populate('lastMessage');
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    res.status(500).json({ message: 'Error getting or creating conversation', error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    // Update conversation's last read
    await Conversation.updateOne(
      { _id: conversationId, 'participants.user': userId },
      { 
        $set: { 
          'participants.$.lastRead': new Date(),
          'participants.$.unreadCount': 0
        },
        $inc: { unreadCount: -1 }
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};
