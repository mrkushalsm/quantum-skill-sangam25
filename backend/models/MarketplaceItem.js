const mongoose = require('mongoose');

const marketplaceItemSchema = new mongoose.Schema({
  // Basic information
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
      'electronics',
      'furniture',
      'clothing',
      'books',
      'vehicles',
      'sports_equipment',
      'household_items',
      'appliances',
      'tools',
      'toys',
      'jewelry',
      'antiques',
      'other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Item details
  condition: {
    type: String,
    required: true,
    enum: ['new', 'like_new', 'good', 'fair', 'poor']
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  yearOfPurchase: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  isNegotiable: {
    type: Boolean,
    default: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Availability
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved', 'inactive'],
    default: 'available'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Images
  images: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Contact information
  contactInfo: {
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
      lowercase: true
    },
    preferredContactTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    preferredContactMethod: {
      type: String,
      enum: ['phone', 'email', 'chat', 'any'],
      default: 'any'
    }
  },
  
  // Location
  location: {
    city: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      match: /^[0-9]{6}$/
    },
    landmark: String
  },
  
  // Delivery and pickup
  deliveryOptions: {
    pickup: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: false
    },
    shipping: {
      type: Boolean,
      default: false
    }
  },
  deliveryCharges: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Views and engagement
  views: {
    type: Number,
    default: 0
  },
  uniqueViews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Favorites and watchlist
  favorites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Inquiries and messages
  inquiries: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    response: {
      type: String,
      maxlength: 500
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isResponded: {
      type: Boolean,
      default: false
    }
  }],
  
  // Ratings and reviews (for seller)
  sellerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Tags and keywords
  tags: [String],
  keywords: [String],
  
  // Featured and promotion
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date,
  promotionType: {
    type: String,
    enum: ['none', 'urgent_sale', 'price_drop', 'new_listing'],
    default: 'none'
  },
  
  // Transaction details
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  soldAt: Date,
  soldPrice: Number,
  
  // Reporting and moderation
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate_content', 'fake_listing', 'overpriced', 'spam', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isReported: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'approved'
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderationNotes: String,
  
  // Expiry and renewal
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  renewalCount: {
    type: Number,
    default: 0
  },
  
  // Additional features
  specifications: {
    type: Map,
    of: String
  },
  warranty: {
    hasWarranty: {
      type: Boolean,
      default: false
    },
    warrantyPeriod: String,
    warrantyDetails: String
  },
  
  // Source and metadata
  source: {
    type: String,
    enum: ['web', 'mobile'],
    default: 'web'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
marketplaceItemSchema.index({ seller: 1 });
marketplaceItemSchema.index({ category: 1 });
marketplaceItemSchema.index({ status: 1 });
marketplaceItemSchema.index({ price: 1 });
marketplaceItemSchema.index({ condition: 1 });
marketplaceItemSchema.index({ 'location.city': 1 });
marketplaceItemSchema.index({ 'location.state': 1 });
marketplaceItemSchema.index({ createdAt: -1 });
marketplaceItemSchema.index({ expiresAt: 1 });
marketplaceItemSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Compound indexes
marketplaceItemSchema.index({ category: 1, status: 1 });
marketplaceItemSchema.index({ status: 1, createdAt: -1 });
marketplaceItemSchema.index({ 'location.city': 1, category: 1 });
marketplaceItemSchema.index({ price: 1, category: 1 });

// Virtual for primary image
marketplaceItemSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || (this.images.length > 0 ? this.images[0] : null);
});

// Virtual for days since posted
marketplaceItemSchema.virtual('daysSincePosted').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiry
marketplaceItemSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  
  const now = new Date();
  const diffTime = this.expiresAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for discount percentage
marketplaceItemSchema.virtual('discountPercentage').get(function() {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for favorite count
marketplaceItemSchema.virtual('favoriteCount').get(function() {
  return this.favorites.length;
});

// Virtual for inquiry count
marketplaceItemSchema.virtual('inquiryCount').get(function() {
  return this.inquiries.length;
});

// Pre-save middleware
marketplaceItemSchema.pre('save', function(next) {
  // Check expiry
  if (this.expiresAt && new Date() > this.expiresAt && !this.isExpired) {
    this.isExpired = true;
    this.status = 'inactive';
  }
  
  // Ensure only one primary image
  const primaryImages = this.images.filter(img => img.isPrimary);
  if (primaryImages.length > 1) {
    this.images.forEach((img, index) => {
      if (img.isPrimary && index > 0) {
        img.isPrimary = false;
      }
    });
  } else if (primaryImages.length === 0 && this.images.length > 0) {
    this.images[0].isPrimary = true;
  }
  
  // Auto-generate tags from title and description
  if (this.isModified('title') || this.isModified('description')) {
    const text = `${this.title} ${this.description}`.toLowerCase();
    const words = text.match(/\b\w{3,}\b/g) || [];
    this.keywords = [...new Set(words)].slice(0, 10);
  }
  
  next();
});

// Instance methods
marketplaceItemSchema.methods.addView = function(userId) {
  this.views += 1;
  
  // Add to unique views if not already viewed by this user
  const alreadyViewed = this.uniqueViews.some(view => 
    view.user.toString() === userId.toString()
  );
  
  if (!alreadyViewed) {
    this.uniqueViews.push({ user: userId });
  }
  
  return this.save();
};

marketplaceItemSchema.methods.addToFavorites = function(userId) {
  const alreadyFavorited = this.favorites.some(fav => 
    fav.user.toString() === userId.toString()
  );
  
  if (!alreadyFavorited) {
    this.favorites.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

marketplaceItemSchema.methods.removeFromFavorites = function(userId) {
  this.favorites = this.favorites.filter(fav => 
    fav.user.toString() !== userId.toString()
  );
  return this.save();
};

marketplaceItemSchema.methods.addInquiry = function(fromUserId, message) {
  this.inquiries.push({
    from: fromUserId,
    message,
    timestamp: new Date()
  });
  return this.save();
};

marketplaceItemSchema.methods.respondToInquiry = function(inquiryId, response) {
  const inquiry = this.inquiries.id(inquiryId);
  if (inquiry) {
    inquiry.response = response;
    inquiry.isResponded = true;
    return this.save();
  }
  return Promise.reject(new Error('Inquiry not found'));
};

marketplaceItemSchema.methods.markAsSold = function(buyerId, soldPrice) {
  this.status = 'sold';
  this.soldTo = buyerId;
  this.soldAt = new Date();
  this.soldPrice = soldPrice || this.price;
  return this.save();
};

marketplaceItemSchema.methods.renew = function(days = 30) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  this.isExpired = false;
  this.renewalCount += 1;
  if (this.status === 'inactive') {
    this.status = 'available';
  }
  return this.save();
};

marketplaceItemSchema.methods.report = function(userId, reason, description) {
  this.reportedBy.push({
    user: userId,
    reason,
    description
  });
  this.isReported = true;
  this.moderationStatus = 'under_review';
  return this.save();
};

// Static methods
marketplaceItemSchema.statics.findAvailable = function() {
  return this.find({ 
    status: 'available', 
    isExpired: false,
    moderationStatus: 'approved'
  });
};

marketplaceItemSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category, 
    status: 'available', 
    isExpired: false,
    moderationStatus: 'approved'
  });
};

marketplaceItemSchema.statics.findBySeller = function(sellerId) {
  return this.find({ seller: sellerId });
};

marketplaceItemSchema.statics.findInLocation = function(city, state) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'location.state': new RegExp(state, 'i'),
    status: 'available',
    isExpired: false,
    moderationStatus: 'approved'
  });
};

marketplaceItemSchema.statics.findInPriceRange = function(minPrice, maxPrice) {
  return this.find({
    price: { $gte: minPrice, $lte: maxPrice },
    status: 'available',
    isExpired: false,
    moderationStatus: 'approved'
  });
};

marketplaceItemSchema.statics.searchItems = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'available',
    isExpired: false,
    moderationStatus: 'approved',
    ...filters
  };
  
  return this.find(query).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('MarketplaceItem', marketplaceItemSchema);
