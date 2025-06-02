const mongoose = require('mongoose');

const welfareSchemeSchema = new mongoose.Schema({
  name: {
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
      'housing',
      'education', 
      'healthcare',
      'financial_assistance',
      'pension',
      'insurance',
      'recreation',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Eligibility
  eligibilityType: {
    type: String,
    required: true,
    enum: ['officer', 'family_member', 'both']
  },
  eligibilityCriteria: [{
    type: String,
    required: true
  }],
  
  // Required documents
  requiredDocuments: [{
    type: String,
    required: true
  }],
  
  // Benefits
  benefits: [{
    type: String,
    required: true
  }],
  
  // Application details
  applicationProcess: {
    type: String,
    maxlength: 1000
  },
  applicationDeadline: {
    type: Date
  },
  maxApplications: {
    type: Number,
    min: 1
  },
  
  // Financial details
  budgetAllocation: {
    type: Number,
    min: 0
  },
  benefitAmount: {
    type: Number,
    min: 0
  },
  
  // Status and visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  totalApplications: {
    type: Number,
    default: 0
  },
  approvedApplications: {
    type: Number,
    default: 0
  },
  rejectedApplications: {
    type: Number,
    default: 0
  },
  pendingApplications: {
    type: Number,
    default: 0
  },
  
  // Additional metadata
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Approval workflow
  approvalRequired: {
    type: Boolean,
    default: true
  },
  approvalLevels: [{
    level: {
      type: Number,
      required: true
    },
    approverRole: {
      type: String,
      required: true
    },
    description: String
  }],
  
  // Contact information
  contactInfo: {
    department: String,
    phoneNumber: String,
    email: String,
    office: String
  },
  
  // Validity period
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
welfareSchemeSchema.index({ category: 1 });
welfareSchemeSchema.index({ eligibilityType: 1 });
welfareSchemeSchema.index({ isActive: 1 });
welfareSchemeSchema.index({ isVisible: 1 });
welfareSchemeSchema.index({ applicationDeadline: 1 });
welfareSchemeSchema.index({ name: 'text', description: 'text' });
welfareSchemeSchema.index({ createdBy: 1 });
welfareSchemeSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual for applications
welfareSchemeSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'scheme'
});

// Virtual for active applications count
welfareSchemeSchema.virtual('activeApplicationsCount').get(function() {
  return this.totalApplications - this.rejectedApplications;
});

// Virtual for success rate
welfareSchemeSchema.virtual('successRate').get(function() {
  if (this.totalApplications === 0) return 0;
  return ((this.approvedApplications / this.totalApplications) * 100).toFixed(2);
});

// Virtual for deadline status
welfareSchemeSchema.virtual('deadlineStatus').get(function() {
  if (!this.applicationDeadline) return 'no_deadline';
  
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) return 'expired';
  if (daysDiff <= 7) return 'closing_soon';
  if (daysDiff <= 30) return 'closing_this_month';
  return 'open';
});

// Instance methods
welfareSchemeSchema.methods.isEligible = function(user) {
  if (!this.isActive || !this.isVisible) return false;
  
  if (this.eligibilityType === 'both') return true;
  if (this.eligibilityType === user.role) return true;
  
  return false;
};

welfareSchemeSchema.methods.canApply = function() {
  if (!this.isActive || !this.isVisible) return false;
  
  // Check deadline
  if (this.applicationDeadline && new Date() > this.applicationDeadline) {
    return false;
  }
  
  // Check maximum applications
  if (this.maxApplications && this.totalApplications >= this.maxApplications) {
    return false;
  }
  
  // Check validity period
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  
  return true;
};

welfareSchemeSchema.methods.incrementApplicationCount = function() {
  this.totalApplications += 1;
  this.pendingApplications += 1;
  return this.save();
};

welfareSchemeSchema.methods.updateApplicationStatus = function(oldStatus, newStatus) {
  // Decrement old status count
  switch(oldStatus) {
    case 'pending':
      this.pendingApplications = Math.max(0, this.pendingApplications - 1);
      break;
    case 'approved':
      this.approvedApplications = Math.max(0, this.approvedApplications - 1);
      break;
    case 'rejected':
      this.rejectedApplications = Math.max(0, this.rejectedApplications - 1);
      break;
  }
  
  // Increment new status count
  switch(newStatus) {
    case 'pending':
      this.pendingApplications += 1;
      break;
    case 'approved':
      this.approvedApplications += 1;
      break;
    case 'rejected':
      this.rejectedApplications += 1;
      break;
  }
  
  return this.save();
};

// Static methods
welfareSchemeSchema.statics.findActive = function() {
  return this.find({ isActive: true, isVisible: true });
};

welfareSchemeSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true, isVisible: true });
};

welfareSchemeSchema.statics.findEligibleSchemes = function(userRole) {
  return this.find({
    isActive: true,
    isVisible: true,
    $or: [
      { eligibilityType: userRole },
      { eligibilityType: 'both' }
    ]
  });
};

welfareSchemeSchema.statics.findOpenSchemes = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    isVisible: true,
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: null },
      { applicationDeadline: { $gt: now } }
    ],
    $or: [
      { validFrom: { $exists: false } },
      { validFrom: null },
      { validFrom: { $lte: now } }
    ],
    $or: [
      { validUntil: { $exists: false } },
      { validUntil: null },
      { validUntil: { $gt: now } }
    ]
  });
};

// Pre-save middleware
welfareSchemeSchema.pre('save', function(next) {
  // Update lastModifiedBy if document is being modified
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.modifiedBy;
  }
  next();
});

module.exports = mongoose.model('WelfareScheme', welfareSchemeSchema);
