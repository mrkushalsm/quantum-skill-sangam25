const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message participants
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
  
  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'voice', 'location'],
    default: 'text'
  },
  
  // File attachment (for file/image messages)
  attachment: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    fileType: String,
    thumbnailPath: String
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  readAt: Date,
  
  // Message context
  context: {
    type: String,
    enum: ['general', 'marketplace', 'emergency', 'grievance', 'welfare'],
    default: 'general'
  },
  contextId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'contextModel'
  },
  contextModel: {
    type: String,
    enum: ['MarketplaceItem', 'EmergencyAlert', 'Grievance', 'WelfareScheme']
  },
  
  // Message metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply/thread support
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Location data (for location messages)
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Message reactions/acknowledgments
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Encryption and security
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  // Auto-delete settings
  expiresAt: Date,
  
  // Delivery receipt
  deliveryReceipt: {
    type: Boolean,
    default: false
  },
  readReceipt: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ context: 1, contextId: 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ context: 1, contextId: 1, createdAt: -1 });

// Virtual for conversation participants
messageSchema.virtual('participants').get(function() {
  return [this.sender, this.recipient];
});

// Virtual for message age
messageSchema.virtual('messageAge').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  return Math.round(diffTime / (1000 * 60)); // Age in minutes
});

// Virtual for is read
messageSchema.virtual('isRead').get(function() {
  return this.status === 'read';
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Auto-set delivery receipt for urgent messages
  if (this.isUrgent || this.priority === 'urgent') {
    this.deliveryReceipt = true;
    this.readReceipt = true;
  }
  
  // Set delivered timestamp when status changes to delivered
  if (this.isModified('status') && this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  // Set read timestamp when status changes to read
  if (this.isModified('status') && this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

// Instance methods
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

messageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

messageSchema.methods.addReaction = function(userId, reaction) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    reaction,
    reactedAt: new Date()
  });
  
  return this.save();
};

messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => 
    r.user.toString() !== userId.toString()
  );
  return this.save();
};

messageSchema.methods.deleteForUser = function(userId) {
  const alreadyDeleted = this.deletedBy.some(d => 
    d.user.toString() === userId.toString()
  );
  
  if (!alreadyDeleted) {
    this.deletedBy.push({
      user: userId,
      deletedAt: new Date()
    });
    
    // If deleted by both participants, mark as deleted
    if (this.deletedBy.length >= 2) {
      this.isDeleted = true;
    }
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

messageSchema.methods.isDeletedForUser = function(userId) {
  return this.deletedBy.some(d => 
    d.user.toString() === userId.toString()
  );
};

// Static methods
messageSchema.statics.findConversation = function(user1Id, user2Id, limit = 50) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ],
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender recipient', 'firstName lastName profilePicture');
};

messageSchema.statics.findUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { recipient: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
            '$recipient',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                  { $ne: ['$status', 'read'] }
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
        as: 'participant'
      }
    },
    {
      $unwind: '$participant'
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

messageSchema.statics.markConversationAsRead = function(senderId, recipientId) {
  return this.updateMany(
    {
      sender: senderId,
      recipient: recipientId,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: { $ne: 'read' },
    isDeleted: false
  });
};

messageSchema.statics.findMessagesByContext = function(context, contextId) {
  return this.find({
    context,
    contextId,
    isDeleted: false
  })
  .sort({ createdAt: 1 })
  .populate('sender recipient', 'firstName lastName profilePicture');
};

messageSchema.statics.searchMessages = function(userId, searchTerm) {
  return this.find({
    $or: [
      { sender: userId },
      { recipient: userId }
    ],
    content: { $regex: searchTerm, $options: 'i' },
    isDeleted: false
  })
  .sort({ createdAt: -1 })
  .populate('sender recipient', 'firstName lastName profilePicture');
};

messageSchema.statics.getMessageStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { recipient: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        sentMessages: {
          $sum: {
            $cond: [{ $eq: ['$sender', mongoose.Types.ObjectId(userId)] }, 1, 0]
          }
        },
        receivedMessages: {
          $sum: {
            $cond: [{ $eq: ['$recipient', mongoose.Types.ObjectId(userId)] }, 1, 0]
          }
        },
        unreadMessages: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                  { $ne: ['$status', 'read'] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Message', messageSchema);
