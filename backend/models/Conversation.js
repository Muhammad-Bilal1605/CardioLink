const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastRead: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const conversationSchema = new mongoose.Schema({
  participants: [participantSchema],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String
  }
}, { timestamps: true });

// Compound index for faster participant lookups
conversationSchema.index({ 'participants.user': 1, updatedAt: -1 });

// Static method to find or create conversation between two users
conversationSchema.statics.findOrCreateConversation = async function(user1Id, user2Id) {
  let conversation = await this.findOne({
    isGroup: false,
    participants: {
      $all: [
        { $elemMatch: { user: user1Id } },
        { $elemMatch: { user: user2Id } }
      ],
      $size: 2
    }
  }).populate('participants.user', 'name email avatar');

  if (!conversation) {
    conversation = await this.create({
      participants: [
        { user: user1Id },
        { user: user2Id }
      ]
    });
    
    // Populate the participants for the newly created conversation
    conversation = await this.findById(conversation._id)
      .populate('participants.user', 'name email avatar');
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
