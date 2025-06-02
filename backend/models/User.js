const mongoose = require('mongoose');
const emergencyPlugin = require('../plugins/emergency');

// Core schema
const coreSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['Admin', 'Officer', 'Family'],
    required: true
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    }
  }
});

// Officer extension
const officerExtension = new mongoose.Schema({
  serviceNumber: {
    type: String,
    required: true,
    unique: true,
    sparse: true
  },
  rank: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  postingLocation: {
    type: String
  },
  joiningDate: {
    type: Date
  },
  retirementDate: {
    type: Date
  }
});

// Family member extension
const familyMemberExtension = new mongoose.Schema({
  relationToOfficer: {
    type: String,
    required: true,
    enum: ['spouse', 'child', 'parent', 'sibling', 'other']
  },
  officerServiceNumber: {
    type: String,
    required: true
  },
  dependentId: {
    type: String
  }
});

// User schema
const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  coreData: coreSchema,
  extensions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: /^[0-9]{6}$/
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    emergencyAlerts: {
      type: Boolean,
      default: true
    }
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'unit_only', 'private'],
    default: 'unit_only'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ 'coreData.contactInfo.email': 1 });
userSchema.index({ 'extensions.serviceNumber': 1 });
userSchema.index({ 'extensions.officerServiceNumber': 1 });
userSchema.index({ 'coreData.role': 1 });
userSchema.index({ 'extensions.unit': 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.coreData.firstName} ${this.coreData.lastName}`;
});

// Virtual for applications
userSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'applicant'
});

// Virtual for grievances
userSchema.virtual('grievances', {
  ref: 'Grievance',
  localField: '_id',
  foreignField: 'submittedBy'
});

// Virtual for marketplace items
userSchema.virtual('marketplaceItems', {
  ref: 'MarketplaceItem',
  localField: '_id',
  foreignField: 'seller'
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Ensure only one primary emergency contact
  const primaryContacts = this.emergencyContacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length > 1) {
    // Keep only the first primary contact
    this.emergencyContacts.forEach((contact, index) => {
      if (contact.isPrimary && index > 0) {
        contact.isPrimary = false;
      }
    });
  }
  next();
});

// Instance methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.firebaseUid;
  
  return user;
};

userSchema.methods.hasRole = function(role) {
  return this.coreData.role === role;
};

userSchema.methods.canAccessResource = function(resourceUserId) {
  return this.coreData.role === 'Admin' || this._id.toString() === resourceUserId.toString();
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findOfficers = function() {
  return this.find({ 'coreData.role': 'Officer', isActive: true });
};

userSchema.statics.findByUnit = function(unit) {
  return this.find({ 'extensions.unit': unit, isActive: true });
};

userSchema.statics.findFamilyMembers = function(serviceNumber) {
  return this.find({ 'extensions.officerServiceNumber': serviceNumber, isActive: true });
};

userSchema.plugin(emergencyPlugin);

module.exports = mongoose.model('User', userSchema);
