const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },  email: {
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
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  role: {
    type: String,
    enum: ['officer', 'family_member', 'admin'],
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // Officer-specific fields
  serviceNumber: {
    type: String,
    required: function() { return this.role === 'officer'; },
    unique: true,
    sparse: true
  },
  rank: {
    type: String,
    required: function() { return this.role === 'officer'; }
  },
  unit: {
    type: String,
    required: function() { return this.role === 'officer'; }
  },
  postingLocation: {
    type: String
  },
  joiningDate: {
    type: Date
  },
  retirementDate: {
    type: Date
  },
  
  // Family member-specific fields
  relationToOfficer: {
    type: String,
    required: function() { return this.role === 'family_member'; },
    enum: ['spouse', 'child', 'parent', 'sibling', 'other']
  },
  officerServiceNumber: {
    type: String,
    required: function() { return this.role === 'family_member'; }
  },
  dependentId: {
    type: String
  },
  
  // Contact information
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
  
  // Account status
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
  
  // Notifications preferences
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
  
  // Privacy settings
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
userSchema.index({ email: 1 });
userSchema.index({ serviceNumber: 1 });
userSchema.index({ officerServiceNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ unit: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
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
  return this.role === role;
};

userSchema.methods.canAccessResource = function(resourceUserId) {
  return this.role === 'admin' || this._id.toString() === resourceUserId.toString();
};

// Static methods
userSchema.statics.findByFirebaseUid = function(firebaseUid) {
  return this.findOne({ firebaseUid });
};

userSchema.statics.findOfficers = function() {
  return this.find({ role: 'officer', isActive: true });
};

userSchema.statics.findByUnit = function(unit) {
  return this.find({ unit, isActive: true });
};

userSchema.statics.findFamilyMembers = function(serviceNumber) {
  return this.find({ officerServiceNumber: serviceNumber, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
