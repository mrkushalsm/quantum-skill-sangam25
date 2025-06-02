const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification content
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: [
      'welfare_scheme',
      'application_status',
      'grievance_update',
      'emergency_alert',
      'marketplace_inquiry',
      'message_received',
      'system_announcement',
      'reminder',
      'deadline_warning',
      'approval_required',
      'document_verification',
      'other'
    ]
  },
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Notification status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  
  // Related entity
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['WelfareScheme', 'Application', 'Grievance', 'EmergencyAlert', 'MarketplaceItem', 'Message', 'User']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityType'
    }
  },
  
  // Delivery channels
  channels: {
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      deviceTokens: [String],
      response: mongoose.Schema.Types.Mixed
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      emailAddress: String,
      response: mongoose.Schema.Types.Mixed
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      phoneNumber: String,
      response: mongoose.Schema.Types.Mixed
    }
  },
  
  // Interaction tracking
  readAt: Date,
  clickedAt: Date,
  actionTaken: {
    type: String,
    enum: ['clicked', 'dismissed', 'snoozed', 'deleted']
  },
  actionTakenAt: Date,
  
  // Scheduling
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  
  // Retry mechanism
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  nextRetryAt: Date,
  
  // Grouping and batching
  groupId: String,
  batchId: String,
  
  // Personalization
  personalizationData: {
    type: Map,
    of: String
  },
  
  // Action buttons/links
  actions: [{
    label: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    url: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Tracking and analytics
  deliveryAttempts: [{
    channel: {
      type: String,
      enum: ['push', 'email', 'sms']
    },
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    success: Boolean,
    error: String,
    response: mongoose.Schema.Types.Mixed
  }],
  
  // Expiry
  expiresAt: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Template and content
  template: String,
  templateData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['system', 'admin', 'automated', 'user_action'],
    default: 'system'
  },
  sourceUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Campaign tracking
  campaignId: String,
  campaignName: String,
  
  // A/B testing
  variant: String,
  testGroup: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ groupId: 1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ recipient: 1, readAt: 1 });

// Virtual for is read
notificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

// Virtual for is clicked
notificationSchema.virtual('isClicked').get(function() {
  return !!this.clickedAt;
});

// Virtual for delivery success rate
notificationSchema.virtual('deliverySuccessRate').get(function() {
  const totalAttempts = this.deliveryAttempts.length;
  if (totalAttempts === 0) return 0;
  
  const successfulAttempts = this.deliveryAttempts.filter(attempt => attempt.success).length;
  return (successfulAttempts / totalAttempts) * 100;
});

// Virtual for time since creation
notificationSchema.virtual('timeSinceCreation').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  return Math.round(diffTime / (1000 * 60)); // Minutes
});

// Virtual for should retry
notificationSchema.virtual('shouldRetry').get(function() {
  return this.status === 'failed' && 
         this.retryCount < this.maxRetries && 
         (!this.nextRetryAt || new Date() >= this.nextRetryAt);
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Check expiry
  if (this.expiresAt && new Date() > this.expiresAt && !this.isExpired) {
    this.isExpired = true;
    this.status = 'failed';
  }
  
  // Set next retry time if failed
  if (this.isModified('status') && this.status === 'failed' && this.retryCount < this.maxRetries) {
    const retryDelays = [5, 15, 60]; // minutes
    const delay = retryDelays[this.retryCount] || 60;
    this.nextRetryAt = new Date(Date.now() + delay * 60 * 1000);
  }
  
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  if (this.status === 'delivered') {
    this.status = 'read';
  }
  return this.save();
};

notificationSchema.methods.markAsClicked = function(action = 'clicked') {
  this.clickedAt = new Date();
  this.actionTaken = action;
  this.actionTakenAt = new Date();
  return this.save();
};

notificationSchema.methods.addDeliveryAttempt = function(channel, success, error = null, response = null) {
  this.deliveryAttempts.push({
    channel,
    attemptedAt: new Date(),
    success,
    error,
    response
  });
  
  if (success) {
    this.channels[channel].sent = true;
    this.channels[channel].sentAt = new Date();
    this.channels[channel].response = response;
    
    if (this.status === 'pending') {
      this.status = 'sent';
    }
  } else {
    this.retryCount += 1;
    if (this.retryCount >= this.maxRetries) {
      this.status = 'failed';
    }
  }
  
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  return this.save();
};

notificationSchema.methods.snooze = function(minutes = 60) {
  this.scheduledFor = new Date(Date.now() + minutes * 60 * 1000);
  this.isScheduled = true;
  this.actionTaken = 'snoozed';
  this.actionTakenAt = new Date();
  return this.save();
};

notificationSchema.methods.dismiss = function() {
  this.actionTaken = 'dismissed';
  this.actionTakenAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.findUnread = function(userId) {
  return this.find({
    recipient: userId,
    readAt: { $exists: false },
    isExpired: false
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByType = function(userId, type) {
  return this.find({
    recipient: userId,
    type,
    isExpired: false
  }).sort({ createdAt: -1 });
};

notificationSchema.statics.findPending = function() {
  return this.find({
    status: 'pending',
    $or: [
      { scheduledFor: { $exists: false } },
      { scheduledFor: null },
      { scheduledFor: { $lte: new Date() } }
    ],
    isExpired: false
  });
};

notificationSchema.statics.findForRetry = function() {
  return this.find({
    status: 'failed',
    retryCount: { $lt: 3 },
    $or: [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: null },
      { nextRetryAt: { $lte: new Date() } }
    ],
    isExpired: false
  });
};

notificationSchema.statics.markMultipleAsRead = function(userId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      $set: {
        readAt: new Date(),
        status: 'read'
      }
    }
  );
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    readAt: { $exists: false },
    isExpired: false
  });
};

notificationSchema.statics.getNotificationStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        recipient: mongoose.Types.ObjectId(userId),
        isExpired: false
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $not: '$readAt' }, 1, 0]
          }
        },
        clicked: {
          $sum: {
            $cond: [{ $ne: ['$actionTaken', null] }, 1, 0]
          }
        }
      }
    }
  ]);
};

notificationSchema.statics.cleanup = function() {
  // Remove expired notifications older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    $or: [
      { isExpired: true, createdAt: { $lt: thirtyDaysAgo } },
      { status: 'read', createdAt: { $lt: thirtyDaysAgo } }
    ]
  });
};

notificationSchema.statics.createBulkNotifications = function(notifications) {
  const batchId = new mongoose.Types.ObjectId().toString();
  
  const notificationsWithBatch = notifications.map(notification => ({
    ...notification,
    batchId
  }));
  
  return this.insertMany(notificationsWithBatch);
};

module.exports = mongoose.model('Notification', notificationSchema);
