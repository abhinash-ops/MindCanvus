const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, read: 1 });

// Static method to get conversation between two users
messageSchema.statics.getConversation = async function(userId1, userId2, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  const messages = await this.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sender', 'username firstName lastName avatar')
    .populate('recipient', 'username firstName lastName avatar');
    
  return messages;
};

// Static method to get all conversations for a user
messageSchema.statics.getUserConversations = async function(userId) {
  // Get unique users this user has exchanged messages with
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [{ sender: userObjectId }, { recipient: userObjectId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", userObjectId] },
            "$recipient",
            "$sender"
          ]
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ["$recipient", userObjectId] },
                { $eq: ["$read", false] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    {
      // Populate the sender of the last message
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'lastMessage.senderData'
      }
    },
    {
      // Populate the recipient of the last message
      $lookup: {
        from: 'users',
        localField: 'lastMessage.recipient',
        foreignField: '_id',
        as: 'lastMessage.recipientData'
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
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: 1,
        user: {
          _id: 1,
          username: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1
        },
        lastMessage: {
          _id: 1,
          content: 1,
          read: 1,
          createdAt: 1,
          sender: { $arrayElemAt: ["$lastMessage.senderData", 0] },
          recipient: { $arrayElemAt: ["$lastMessage.recipientData", 0] }
        },
        unreadCount: 1
      }
    }
  ]);
  
  return conversations;
};

// Method to mark message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Message', messageSchema);