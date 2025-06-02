const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Reference to scheme and applicant
  scheme: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WelfareScheme',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Application ID (unique identifier)
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Application status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'cancelled'],
    default: 'draft'
  },
  
  // Personal details
  personalDetails: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    fatherName: String,
    motherName: String,
    spouseName: String,
    
    // Address
    address: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true,
        match: /^[0-9]{6}$/
      },
      country: {
        type: String,
        default: 'India'
      }
    },
    
    // Contact details
    phoneNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    alternatePhoneNumber: {
      type: String,
      match: /^[0-9]{10}$/
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    
    // Bank details (for financial schemes)
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
      accountHolderName: String
    }
  },
  
  // Officer details (for family member applications)
  officerDetails: {
    serviceNumber: String,
    rank: String,
    unit: String,
    name: String,
    relationship: String
  },
  
  // Documents
  documents: [{
    documentType: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationNote: String
  }],
  
  // Additional information specific to scheme
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Application workflow
  currentApprovalLevel: {
    type: Number,
    default: 1
  },
  approvalHistory: [{
    level: {
      type: Number,
      required: true
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'returned'],
      required: true
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status tracking
  submittedAt: Date,
  reviewedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  
  // Comments and notes
  applicantComments: String,
  adminComments: String,
  internalNotes: String,
  
  // Rejection/Return reasons
  rejectionReason: String,
  returnReason: String,
  
  // Financial details (for monetary schemes)
  requestedAmount: Number,
  approvedAmount: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed', 'completed'],
    default: 'pending'
  },
  paymentReference: String,
  paymentDate: Date,
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  urgencyReason: String,
  
  // Application completion
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  missingDocuments: [String],
  missingInformation: [String],
  
  // Notification tracking
  notificationsSent: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Review and feedback
  applicantRating: {
    type: Number,
    min: 1,
    max: 5
  },
  applicantFeedback: String,
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'offline'],
    default: 'web'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
applicationSchema.index({ applicationId: 1 });
applicationSchema.index({ scheme: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ submittedAt: 1 });
applicationSchema.index({ priority: 1 });
applicationSchema.index({ paymentStatus: 1 });
applicationSchema.index({ 'personalDetails.phoneNumber': 1 });
applicationSchema.index({ 'officerDetails.serviceNumber': 1 });

// Compound indexes
applicationSchema.index({ scheme: 1, applicant: 1 });
applicationSchema.index({ status: 1, submittedAt: -1 });
applicationSchema.index({ scheme: 1, status: 1 });

// Virtual for days since submission
applicationSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.submittedAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.submittedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for processing time
applicationSchema.virtual('processingTime').get(function() {
  if (!this.submittedAt) return null;
  const endDate = this.approvedAt || this.rejectedAt || new Date();
  const diffTime = Math.abs(endDate - this.submittedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for current status display
applicationSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'pending_documents': 'Pending Documents',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
});

// Pre-save middleware
applicationSchema.pre('save', function(next) {
  // Generate application ID if not exists
  if (this.isNew && !this.applicationId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.applicationId = `APP${year}${month}${randomNum}`;
  }
  
  // Set submission date when status changes to submitted
  if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  // Set approval/rejection dates
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date();
    } else if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
    }
  }
  
  // Calculate completion percentage
  this.calculateCompletionPercentage();
  
  next();
});

// Instance methods
applicationSchema.methods.calculateCompletionPercentage = function() {
  let completedFields = 0;
  let totalFields = 0;
  
  // Check personal details
  totalFields += 6; // Basic required fields
  if (this.personalDetails.fullName) completedFields++;
  if (this.personalDetails.dateOfBirth) completedFields++;
  if (this.personalDetails.gender) completedFields++;
  if (this.personalDetails.address && this.personalDetails.address.street) completedFields++;
  if (this.personalDetails.phoneNumber) completedFields++;
  if (this.personalDetails.email) completedFields++;
  
  // Check documents (assume at least 2 documents required)
  totalFields += 2;
  completedFields += Math.min(this.documents.length, 2);
  
  this.completionPercentage = Math.round((completedFields / totalFields) * 100);
};

applicationSchema.methods.canBeSubmitted = function() {
  return this.completionPercentage >= 80 && this.status === 'draft';
};

applicationSchema.methods.addApprovalHistory = function(level, approver, action, comments) {
  this.approvalHistory.push({
    level,
    approver,
    action,
    comments,
    timestamp: new Date()
  });
  
  if (action === 'approved') {
    this.currentApprovalLevel += 1;
  }
};

applicationSchema.methods.addDocument = function(documentType, fileName, filePath, fileSize) {
  this.documents.push({
    documentType,
    fileName,
    filePath,
    fileSize,
    uploadedAt: new Date()
  });
  
  this.calculateCompletionPercentage();
};

applicationSchema.methods.removeDocument = function(documentId) {
  this.documents = this.documents.filter(doc => doc._id.toString() !== documentId.toString());
  this.calculateCompletionPercentage();
};

// Static methods
applicationSchema.statics.findByApplicant = function(applicantId) {
  return this.find({ applicant: applicantId }).populate('scheme', 'name category');
};

applicationSchema.statics.findByScheme = function(schemeId) {
  return this.find({ scheme: schemeId }).populate('applicant', 'firstName lastName email');
};

applicationSchema.statics.findPendingApplications = function() {
  return this.find({ 
    status: { $in: ['submitted', 'under_review', 'pending_documents'] } 
  }).populate('scheme applicant');
};

applicationSchema.statics.getApplicationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Application', applicationSchema);
