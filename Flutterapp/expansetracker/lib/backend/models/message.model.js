import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: { 
    type: String, 
    required: true,
    index: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'document'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    default: null
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

// Virtual for message status
messageSchema.virtual('isRead').get(function() {
  return this.status === 'read';
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  if (this.status !== 'read') {
    this.status = 'read';
    this.read = true;
    await this.save();
  }
  return this;
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(roomId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'name email avatar')
    .populate('receiverId', 'name email avatar')
    .lean();
};

// Static method to get recent conversations for a user
messageSchema.statics.getRecentConversations = async function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
            '$receiverId',
            '$senderId'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$read', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        avatar: '$user.avatar',
        lastMessage: 1,
        unreadCount: 1,
        lastMessageTime: '$lastMessage.createdAt'
      }
    },
    { $sort: { 'lastMessageTime': -1 } }
  ]);
};

const Message = mongoose.model('Message', messageSchema);

export { Message };
