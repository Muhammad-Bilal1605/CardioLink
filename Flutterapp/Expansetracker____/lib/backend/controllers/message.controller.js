import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import mongoose from 'mongoose';

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
export const sendMessage = catchAsync(async (req, res, next) => {
  const { roomId, receiverId, message, messageType = 'text', mediaUrl } = req.body;
  const senderId = req.user.id;

  // Validate receiverId
  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return next(new AppError('Invalid receiver ID format', 400));
  }

  // Validate receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Create new message
  const newMessage = await Message.create({
    roomId,
    senderId,
    receiverId,
    message,
    messageType,
    mediaUrl,
    status: 'sent'
  });

  // Populate sender and receiver details
  await newMessage.populate('senderId', 'name email avatar');
  await newMessage.populate('receiverId', 'name email avatar');

  // Emit socket event
  const io = req.app.get('socketio');
  io.to(roomId).emit('newMessage', newMessage);
  
  // Update unread count for the receiver
  io.to(`user_${receiverId}`).emit('updateUnreadCount', { roomId });

  res.status(201).json({
    status: 'success',
    data: {
      message: newMessage
    }
  });
});

/**
 * @desc    Get conversation between two users
 * @route   GET /api/messages/conversation/:roomId
 * @access  Private
 */
export const getConversation = catchAsync(async (req, res, next) => {
  const { roomId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  const messages = await Message.getConversation(roomId, page, limit);

  // Mark messages as read
  await Message.updateMany(
    {
      roomId,
      receiverId: req.user.id,
      read: false
    },
    { 
      $set: { 
        read: true,
        status: 'read'
      } 
    }
  );

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      messages
    }
  });
});

/**
 * @desc    Get recent conversations for the logged-in user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getRecentConversations = catchAsync(async (req, res, next) => {
  const conversations = await Message.getRecentConversations(req.user.id);
  
  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations
    }
  });
});

/**
 * @desc    Mark messages as read
 * @route   PATCH /api/messages/read
 * @access  Private
 */
export const markAsRead = catchAsync(async (req, res, next) => {
  const { messageIds, roomId } = req.body;
  const userId = req.user.id;

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      receiverId: userId,
      roomId
    },
    { 
      $set: { 
        read: true,
        status: 'read'
      } 
    }
  );

  // Emit socket event to update read status
  const io = req.app.get('socketio');
  io.to(roomId).emit('messagesRead', { messageIds });

  res.status(200).json({
    status: 'success',
    message: 'Messages marked as read'
  });
});

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
export const deleteMessage = catchAsync(async (req, res, next) => {
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    return next(new AppError('No message found with that ID', 404));
  }

  // Check if user is the sender
  if (message.senderId.toString() !== req.user.id) {
    return next(new AppError('Not authorized to delete this message', 403));
  }

  // If message has media, delete from storage
  if (message.mediaUrl) {
    // Implement media deletion logic if using cloud storage
    // await deleteFromCloudinary(message.mediaUrl);
  }

  // Soft delete: mark as deleted for the user
  if (!message.deletedFor.includes(req.user.id)) {
    message.deletedFor.push(req.user.id);
    await message.save();
  }

  // Emit socket event
  const io = req.app.get('socketio');
  io.to(message.roomId).emit('messageDeleted', { messageId: message._id });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * @desc    Upload chat media (images, audio, documents)
 * @route   POST /api/messages/upload-media
 * @access  Private
 */
export const uploadMedia = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Determine file type
  let fileType = 'document';
  if (req.file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (req.file.mimetype.startsWith('audio/')) {
    fileType = 'audio';
  }

  // Upload to cloud storage
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'chat_media',
    resource_type: fileType === 'image' ? 'image' : 'raw'
  });

  res.status(200).json({
    status: 'success',
    data: {
      mediaUrl: result.secure_url,
      mediaType: fileType,
      publicId: result.public_id
    }
  });
});