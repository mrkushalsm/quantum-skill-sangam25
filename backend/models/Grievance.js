const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  // Basic information
  grievanceId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'administrative',
      'welfare_scheme',
      'harassment',
      'discrimination',
      'facility_related',
      'financial',
      'medical',
      'accommodation',
      'promotion',
      'transfer',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Submitter information
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Contact details (for anonymous grievances)
  anonymousContact: {
    phoneNumber: {
      type: String,
      match: /^[0-9]{10}$/
    },
    email: {
      type: String,
      lowercase: true
    }
  },
  
  // Status and priority
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'escalated'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Assignment and handling
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  department: {
    type: String,
    enum: ['administration', 'welfare', 'medical', 'engineering', 'security', 'hr', 'other']
  },
  
  // Timeline
  acknowledgedAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  targetResolutionDate: Date,
  
  // Resolution details
  adminResponse: {
    type: String,
    maxlength: 2000
  },
  resolutionDetails: {
    type: String,
    maxlength: 2000
  },
  actionTaken: {
    type: String,
    maxlength: 1000
  },
  
  // Attachments
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: Number,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Communication history
  communications: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      fileName: String,
      filePath: String
    }]
  }],
  
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
  
  // Location and incident details
  incidentLocation: {
    type: String,
    trim: true
  },
  incidentDate: Date,
  witnessDetails: {
    type: String,
    maxlength: 500
  },
  
  // Satisfaction and feedback
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: 1000
  },
  
  // Investigation details
  investigationRequired: {
    type: Boolean,
    default: false
  },
  investigationStarted: Date,
  investigationCompleted: Date,
  investigationFindings: {
    type: String,
    maxlength: 2000
  },
  investigator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Legal and compliance
  legalImplications: {
    type: Boolean,
    default: false
  },
  complianceIssue: {
    type: Boolean,
    default: false
  },
  
  // Tracking and metrics
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Related grievances
  relatedGrievances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grievance'
  }],
  
  // Tags and keywords
  tags: [String],
  
  // Internal notes (admin only)
  internalNotes: {
    type: String,
    maxlength: 1000
  },
  
  // Follow-up required
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  
  // Source of grievance
  source: {
    type: String,
    enum: ['web', 'mobile', 'email', 'phone', 'in_person'],
    default: 'web'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
grievanceSchema.index({ grievanceId: 1 });
grievanceSchema.index({ submittedBy: 1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ priority: 1 });
grievanceSchema.index({ category: 1 });
grievanceSchema.index({ assignedTo: 1 });
grievanceSchema.index({ department: 1 });
grievanceSchema.index({ createdAt: -1 });
grievanceSchema.index({ targetResolutionDate: 1 });
grievanceSchema.index({ title: 'text', description: 'text' });

// Compound indexes
grievanceSchema.index({ status: 1, priority: 1 });
grievanceSchema.index({ category: 1, status: 1 });
grievanceSchema.index({ assignedTo: 1, status: 1 });

// Virtual for days pending
grievanceSchema.virtual('daysPending').get(function() {
  if (this.status === 'resolved' || this.status === 'closed') return 0;
  
  const startDate = this.createdAt;
  const now = new Date();
  const diffTime = Math.abs(now - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for resolution time
grievanceSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  
  const startDate = this.createdAt;
  const endDate = this.resolvedAt;
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
grievanceSchema.virtual('isOverdue').get(function() {
  if (!this.targetResolutionDate || this.status === 'resolved' || this.status === 'closed') {
    return false;
  }
  
  return new Date() > this.targetResolutionDate;
});

// Virtual for status display
grievanceSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending',
    'acknowledged': 'Acknowledged',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'escalated': 'Escalated'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware
grievanceSchema.pre('save', function(next) {
  // Generate grievance ID if not exists
  if (this.isNew && !this.grievanceId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.grievanceId = `GRV${year}${month}${randomNum}`;
  }
  
  // Set timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    
    switch(this.status) {
      case 'acknowledged':
        if (!this.acknowledgedAt) this.acknowledgedAt = now;
        break;
      case 'resolved':
        if (!this.resolvedAt) this.resolvedAt = now;
        break;
      case 'closed':
        if (!this.closedAt) this.closedAt = now;
        break;
    }
  }
  
  // Set target resolution date based on priority
  if (this.isNew && !this.targetResolutionDate) {
    const days = this.priority === 'urgent' ? 1 : 
                 this.priority === 'high' ? 7 : 
                 this.priority === 'medium' ? 15 : 30;
    
    this.targetResolutionDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Instance methods
grievanceSchema.methods.acknowledge = function(acknowledgedBy) {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  this.assignedTo = acknowledgedBy;
  this.assignedAt = new Date();
  return this.save();
};

grievanceSchema.methods.assignTo = function(userId, department) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  if (department) this.department = department;
  if (this.status === 'pending') this.status = 'acknowledged';
  return this.save();
};

grievanceSchema.methods.addCommunication = function(from, message, isInternal = false, attachments = []) {
  this.communications.push({
    from,
    message,
    isInternal,
    attachments,
    timestamp: new Date()
  });
  return this.save();
};

grievanceSchema.methods.escalate = function(escalatedTo, reason) {
  this.escalationLevel += 1;
  this.status = 'escalated';
  this.escalatedTo = escalatedTo;
  this.escalatedAt = new Date();
  this.escalationReason = reason;
  return this.save();
};

grievanceSchema.methods.resolve = function(resolutionDetails, actionTaken) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolutionDetails = resolutionDetails;
  this.actionTaken = actionTaken;
  return this.save();
};

grievanceSchema.methods.close = function(adminResponse) {
  this.status = 'closed';
  this.closedAt = new Date();
  if (adminResponse) this.adminResponse = adminResponse;
  return this.save();
};

// Static methods
grievanceSchema.statics.findBySubmitter = function(submitterId) {
  return this.find({ submittedBy: submitterId });
};

grievanceSchema.statics.findPending = function() {
  return this.find({ status: { $in: ['pending', 'acknowledged', 'in_progress'] } });
};

grievanceSchema.statics.findOverdue = function() {
  return this.find({
    status: { $in: ['pending', 'acknowledged', 'in_progress'] },
    targetResolutionDate: { $lt: new Date() }
  });
};

grievanceSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

grievanceSchema.statics.getGrievanceStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Grievance', grievanceSchema);
