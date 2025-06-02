const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  // Alert identification
  alertId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Alert details
  type: {
    type: String,
    required: true,
    enum: [
      'medical',
      'security',
      'natural_disaster',
      'accident',
      'fire',
      'theft',
      'violence',
      'missing_person',
      'infrastructure_failure',
      'other'
    ]
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Reporter information
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactNumber: {
    type: String,
    match: /^[0-9]{10}$/
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Location information
  location: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      required: true,
      maxlength: 500
    },
    landmark: String,
    area: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: /^[0-9]{6}$/
    }
  },
  
  // Status and handling
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'responding', 'resolved', 'false_alarm', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Response team information
  assignedTo: [{
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['first_responder', 'medical', 'security', 'fire', 'coordinator']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    estimatedArrival: Date,
    actualArrival: Date,
    status: {
      type: String,
      enum: ['assigned', 'en_route', 'on_scene', 'completed'],
      default: 'assigned'
    }
  }],
  
  // Timeline
  acknowledgedAt: Date,
  responseStartedAt: Date,
  resolvedAt: Date,
  estimatedResponseTime: Number, // in minutes
  actualResponseTime: Number, // in minutes
  
  // Communication and updates
  updates: [{
    updateBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  
  // Attachments (photos, videos)
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document']
    },
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  
  // Notification tracking
  notificationsSent: [{
    type: {
      type: String,
      enum: ['sms', 'email', 'push', 'call']
    },
    recipients: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      contactInfo: String,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'read']
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }],
    message: String,
    isEmergencyBroadcast: {
      type: Boolean,
      default: false
    }
  }],
  
  // Emergency contacts involved
  emergencyContactsNotified: [{
    name: String,
    relationship: String,
    phoneNumber: String,
    notifiedAt: Date,
    notificationMethod: String,
    responseReceived: Boolean
  }],
  
  // Verification and validation
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Escalation
  escalationLevel: {
    type: Number,
    default: 0
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedAt: Date,
  escalationReason: String,
  
  // Resolution details
  resolutionDetails: {
    type: String,
    maxlength: 1000
  },
  actionTaken: {
    type: String,
    maxlength: 1000
  },
  resourcesUsed: [String],
  
  // Affected persons
  affectedPersons: [{
    name: String,
    age: Number,
    gender: String,
    injuries: String,
    medicalAttention: Boolean,
    hospitalizedAt: String,
    contactNumber: String,
    relationship: String
  }],
  
  // Environmental and situational data
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    visibility: String
  },
  trafficImpact: {
    type: Boolean,
    default: false
  },
  infrastructureImpact: {
    type: Boolean,
    default: false
  },
  
  // Related alerts
  relatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyAlert'
  }],
  
  // Follow-up requirements
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Analytics and reporting
  responseEffectiveness: {
    type: Number,
    min: 1,
    max: 5
  },
  lessonsLearned: String,
  improvementSuggestions: String,
  
  // Legal and documentation
  policeReportFiled: {
    type: Boolean,
    default: false
  },
  policeReportNumber: String,
  insuranceClaim: {
    type: Boolean,
    default: false
  },
  insuranceClaimNumber: String,
  
  // Source and metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'call', 'radio', 'other'],
    default: 'mobile'
  },
  
  // Auto-resolved flags
  isAutoResolved: {
    type: Boolean,
    default: false
  },
  autoResolvedReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
emergencyAlertSchema.index({ alertId: 1 });
emergencyAlertSchema.index({ reportedBy: 1 });
emergencyAlertSchema.index({ type: 1 });
emergencyAlertSchema.index({ severity: 1 });
emergencyAlertSchema.index({ status: 1 });
emergencyAlertSchema.index({ priority: 1 });
emergencyAlertSchema.index({ createdAt: -1 });
emergencyAlertSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
emergencyAlertSchema.index({ 'location.city': 1 });
emergencyAlertSchema.index({ 'location.area': 1 });

// Compound indexes
emergencyAlertSchema.index({ status: 1, severity: 1 });
emergencyAlertSchema.index({ type: 1, status: 1 });
emergencyAlertSchema.index({ createdAt: -1, status: 1 });

// Virtual for response time in minutes
emergencyAlertSchema.virtual('responseTimeMinutes').get(function() {
  if (!this.responseStartedAt || !this.createdAt) return null;
  
  const diffTime = this.responseStartedAt.getTime() - this.createdAt.getTime();
  return Math.round(diffTime / (1000 * 60));
});

// Virtual for total resolution time
emergencyAlertSchema.virtual('totalResolutionTime').get(function() {
  if (!this.resolvedAt || !this.createdAt) return null;
  
  const diffTime = this.resolvedAt.getTime() - this.createdAt.getTime();
  return Math.round(diffTime / (1000 * 60));
});

// Virtual for time since alert
emergencyAlertSchema.virtual('timeSinceAlert').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  return Math.round(diffTime / (1000 * 60));
});

// Virtual for urgency level
emergencyAlertSchema.virtual('urgencyLevel').get(function() {
  const timeSinceAlert = this.timeSinceAlert;
  const severityWeight = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  
  const baseUrgency = severityWeight[this.severity] || 1;
  const timeMultiplier = Math.min(timeSinceAlert / 30, 3); // Max 3x after 30 minutes
  
  return Math.min(baseUrgency * (1 + timeMultiplier), 10);
});

// Virtual for active responders count
emergencyAlertSchema.virtual('activeRespondersCount').get(function() {
  return this.assignedTo.filter(responder => 
    responder.status !== 'completed'
  ).length;
});

// Pre-save middleware
emergencyAlertSchema.pre('save', function(next) {
  // Generate alert ID if not exists
  if (this.isNew && !this.alertId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.alertId = `EMG${year}${month}${day}${randomNum}`;
  }
  
  // Set timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    
    switch(this.status) {
      case 'acknowledged':
        if (!this.acknowledgedAt) this.acknowledgedAt = now;
        break;
      case 'responding':
        if (!this.responseStartedAt) this.responseStartedAt = now;
        break;
      case 'resolved':
        if (!this.resolvedAt) this.resolvedAt = now;
        break;
    }
  }
  
  // Calculate actual response time
  if (this.responseStartedAt && this.createdAt) {
    this.actualResponseTime = Math.round(
      (this.responseStartedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)
    );
  }
  
  // Set priority based on severity and type
  if (this.isNew || this.isModified('severity') || this.isModified('type')) {
    if (this.severity === 'critical' || 
        ['medical', 'fire', 'violence'].includes(this.type)) {
      this.priority = 'urgent';
    } else if (this.severity === 'high') {
      this.priority = 'high';
    } else if (this.severity === 'medium') {
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  
  next();
});

// Instance methods
emergencyAlertSchema.methods.acknowledge = function(acknowledgedBy) {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  this.isVerified = true;
  this.verifiedBy = acknowledgedBy;
  this.verifiedAt = new Date();
  return this.save();
};

emergencyAlertSchema.methods.assignResponder = function(responderId, role, estimatedArrival) {
  this.assignedTo.push({
    responder: responderId,
    role,
    assignedAt: new Date(),
    estimatedArrival,
    status: 'assigned'
  });
  
  if (this.status === 'active') {
    this.status = 'acknowledged';
  }
  
  return this.save();
};

emergencyAlertSchema.methods.updateResponderStatus = function(responderId, status, actualArrival) {
  const responder = this.assignedTo.find(r => 
    r.responder.toString() === responderId.toString()
  );
  
  if (responder) {
    responder.status = status;
    if (actualArrival) responder.actualArrival = actualArrival;
    
    // Update alert status based on responder status
    if (status === 'on_scene' && this.status !== 'responding') {
      this.status = 'responding';
      if (!this.responseStartedAt) this.responseStartedAt = new Date();
    }
    
    return this.save();
  }
  
  return Promise.reject(new Error('Responder not found'));
};

emergencyAlertSchema.methods.addUpdate = function(updateBy, message, isPublic = true) {
  this.updates.push({
    updateBy,
    message,
    isPublic,
    timestamp: new Date()
  });
  return this.save();
};

emergencyAlertSchema.methods.escalate = function(escalatedTo, reason) {
  this.escalationLevel += 1;
  this.escalatedTo = escalatedTo;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  this.priority = 'urgent';
  return this.save();
};

emergencyAlertSchema.methods.resolve = function(resolutionDetails, actionTaken) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolutionDetails = resolutionDetails;
  this.actionTaken = actionTaken;
  
  // Mark all responders as completed
  this.assignedTo.forEach(responder => {
    if (responder.status !== 'completed') {
      responder.status = 'completed';
    }
  });
  
  return this.save();
};

emergencyAlertSchema.methods.addAttachment = function(fileName, filePath, fileType, fileSize, uploadedBy, description) {
  this.attachments.push({
    fileName,
    filePath,
    fileType,
    fileSize,
    uploadedBy,
    description,
    uploadedAt: new Date()
  });
  return this.save();
};

// Static methods
emergencyAlertSchema.statics.findActive = function() {
  return this.find({ 
    status: { $in: ['active', 'acknowledged', 'responding'] } 
  });
};

emergencyAlertSchema.statics.findByType = function(type) {
  return this.find({ type });
};

emergencyAlertSchema.statics.findBySeverity = function(severity) {
  return this.find({ severity });
};

emergencyAlertSchema.statics.findNearLocation = function(latitude, longitude, radiusInKm = 5) {
  const radiusInRadians = radiusInKm / 6371; // Earth's radius in km
  
  return this.find({
    'location.latitude': {
      $gte: latitude - radiusInRadians,
      $lte: latitude + radiusInRadians
    },
    'location.longitude': {
      $gte: longitude - radiusInRadians,
      $lte: longitude + radiusInRadians
    },
    status: { $in: ['active', 'acknowledged', 'responding'] }
  });
};

emergencyAlertSchema.statics.getAlertStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

emergencyAlertSchema.statics.findUnacknowledged = function() {
  return this.find({ 
    status: 'active',
    isVerified: false
  });
};

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
