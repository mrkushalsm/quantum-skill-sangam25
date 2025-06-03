const express = require('express');
const router = express.Router();
const { authenticateUser, checkOwnership } = require('../middleware/auth');
const { validateMarketplaceItem } = require('../middleware/validation');
const { uploadMarketplaceImages } = require('../middleware/upload');
const MarketplaceItem = require('../models/MarketplaceItem');
const User = require('../models/User');
const { createNotification } = require('../utils/notification');

// Root marketplace endpoint
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    // Get summary statistics
    const [totalItems, userItems, categories] = await Promise.all([
      MarketplaceItem.countDocuments({ status: 'available' }),
      MarketplaceItem.countDocuments({ sellerId: user._id }),
      MarketplaceItem.distinct('category')
    ]);
    
    const recentItems = await MarketplaceItem.find({ status: 'available' })
      .populate('sellerId', 'name rank service')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category price location images');
    
    res.json({
      message: 'Armed Forces Marketplace API',
      user: {
        name: user.name,
        role: user.role,
        service: user.service
      },
      summary: {
        totalItems,
        userItems,
        categoriesCount: categories.length,
        recentItems
      },
      endpoints: {
        items: '/api/marketplace/items',
        categories: '/api/marketplace/categories',
        userItems: '/api/marketplace/user/items',
        chat: '/api/marketplace/chat'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Armed Forces Marketplace API', 
      error: error.message 
    });
  }
});

// Get all marketplace items
router.get('/items', authenticateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      condition, 
      priceMin, 
      priceMax,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { status: 'available' };
    
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (location) {
      query['location.city'] = { $regex: location, $options: 'i' };
    }
    
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const items = await MarketplaceItem.find(query)
      .populate('sellerId', 'name rank unit service profilePicture')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MarketplaceItem.countDocuments(query);
    
    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching marketplace items', error: error.message });
  }
});

// Get item by ID
router.get('/items/:id', authenticateUser, async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id)
      .populate('sellerId', 'name rank unit service phoneNumber email profilePicture')
      .populate('inquiries.buyerId', 'name rank profilePicture')
      .populate('reviews.reviewerId', 'name rank profilePicture');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Increment view count
    item.views += 1;
    await item.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});

// Create new marketplace item
router.post('/items', 
  authenticateUser,
  uploadMarketplaceImages,
  validateMarketplaceItem,
  async (req, res) => {
    try {
      const user = req.user; // Use req.user directly
      
      // Process uploaded images
      const images = req.files ? req.files.map(file => ({
        url: `/uploads/marketplace/${file.filename}`,
        alt: file.originalname
      })) : [];

      const item = new MarketplaceItem({
        ...req.body,
        sellerId: user._id,
        images,
        status: 'available'
      });

      await item.save();

      res.status(201).json({ 
        message: 'Item listed successfully', 
        item: {
          _id: item._id,
          title: item.title,
          price: item.price,
          status: item.status
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating item', error: error.message });
    }
  }
);

// Update marketplace item
router.put('/items/:id', 
  authenticateUser,
  checkOwnership,
  uploadMarketplaceImages,
  validateMarketplaceItem,
  async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      // Process new uploaded images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
          url: `/uploads/marketplace/${file.filename}`,
          alt: file.originalname
        }));
        
        // If keepExistingImages is true, append new images, otherwise replace
        if (req.body.keepExistingImages === 'true') {
          const existingItem = await MarketplaceItem.findById(req.params.id);
          updateData.images = [...existingItem.images, ...newImages];
        } else {
          updateData.images = newImages;
        }
      }

      const item = await MarketplaceItem.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('sellerId', 'name rank');

      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      res.json({ message: 'Item updated successfully', item });
    } catch (error) {
      res.status(500).json({ message: 'Error updating item', error: error.message });
    }
  }
);

// Delete marketplace item
router.delete('/items/:id', 
  authenticateUser,
  checkOwnership,
  async (req, res) => {
    try {
      const item = await MarketplaceItem.findById(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      // Check if there are pending inquiries
      const pendingInquiries = item.inquiries.filter(
        inquiry => inquiry.status === 'pending'
      );

      if (pendingInquiries.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete item with pending inquiries' 
        });
      }

      await MarketplaceItem.findByIdAndDelete(req.params.id);

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting item', error: error.message });
    }
  }
);

// Get user's marketplace items
router.get('/my-items', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user = req.user; // Use req.user directly
    
    const query = { sellerId: user._id };
    if (status) query.status = status;
    
    const items = await MarketplaceItem.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await MarketplaceItem.countDocuments(query);
    
    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your items', error: error.message });
  }
});

// Send inquiry for an item
router.post('/items/:id/inquiries', authenticateUser, async (req, res) => {
  try {
    const { message, contactPhone } = req.body;
    const user = req.user; // Use req.user directly
    
    const item = await MarketplaceItem.findById(req.params.id)
      .populate('sellerId', 'name');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.sellerId._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot inquire about your own item' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ message: 'Item is not available for inquiry' });
    }

    // Check if user already has a pending inquiry
    const existingInquiry = item.inquiries.find(
      inquiry => inquiry.buyerId.toString() === user._id.toString() && 
                inquiry.status === 'pending'
    );

    if (existingInquiry) {
      return res.status(400).json({ message: 'You already have a pending inquiry for this item' });
    }

    // Add inquiry
    item.inquiries.push({
      buyerId: user._id,
      message,
      contactPhone,
      status: 'pending',
      createdAt: new Date()
    });

    await item.save();

    // Create notification for seller
    await createNotification({
      userId: item.sellerId._id,
      title: 'New Item Inquiry',
      message: `${user.name} is interested in your item "${item.title}"`,
      type: 'info',
      relatedId: item._id,
      relatedType: 'marketplace_item'
    });

    res.json({ message: 'Inquiry sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending inquiry', error: error.message });
  }
});

// Respond to inquiry
router.put('/items/:id/inquiries/:inquiryId', 
  authenticateUser,
  checkOwnership,
  async (req, res) => {
    try {
      const { status, response } = req.body;
      const user = req.user; // Use req.user directly
      
      const item = await MarketplaceItem.findById(req.params.id);

      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }

      const inquiry = item.inquiries.id(req.params.inquiryId);
      if (!inquiry) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      inquiry.status = status;
      inquiry.response = response;
      inquiry.respondedAt = new Date();

      await item.save();

      // Create notification for buyer
      await createNotification({
        userId: inquiry.buyerId,
        title: 'Inquiry Response',
        message: `The seller has ${status} your inquiry for "${item.title}"`,
        type: status === 'accepted' ? 'success' : 'info',
        relatedId: item._id,
        relatedType: 'marketplace_item'
      });

      res.json({ message: 'Inquiry response sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error responding to inquiry', error: error.message });
    }
  }
);

// Get user's inquiries
router.get('/my-inquiries', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'sent' } = req.query;
    const user = req.user; // Use req.user directly
    
    let items;
    let total;
    
    if (type === 'sent') {
      // Inquiries sent by user
      items = await MarketplaceItem.find({
        'inquiries.buyerId': user._id
      })
      .populate('sellerId', 'name rank profilePicture')
      .sort({ 'inquiries.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
      total = await MarketplaceItem.countDocuments({
        'inquiries.buyerId': user._id
      });
      
      // Filter inquiries to show only user's inquiries
      items = items.map(item => ({
        ...item.toObject(),
        inquiries: item.inquiries.filter(
          inquiry => inquiry.buyerId.toString() === user._id.toString()
        )
      }));
      
    } else {
      // Inquiries received by user (for their items)
      items = await MarketplaceItem.find({
        sellerId: user._id,
        'inquiries.0': { $exists: true }
      })
      .populate('inquiries.buyerId', 'name rank profilePicture')
      .sort({ 'inquiries.createdAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
      total = await MarketplaceItem.countDocuments({
        sellerId: user._id,
        'inquiries.0': { $exists: true }
      });
    }
    
    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inquiries', error: error.message });
  }
});

// Add to favorites
router.post('/items/:id/favorite', authenticateUser, async (req, res) => {
  try {
    const user = req.user; // Use req.user directly
    const item = await MarketplaceItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const alreadyFavorited = item.favorites.some(
      fav => fav.userId.toString() === user._id.toString()
    );

    if (alreadyFavorited) {
      return res.status(400).json({ message: 'Item already in favorites' });
    }

    item.favorites.push({
      userId: user._id,
      addedAt: new Date()
    });

    await item.save();

    res.json({ message: 'Item added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to favorites', error: error.message });
  }
});

// Remove from favorites
router.delete('/items/:id/favorite', authenticateUser, async (req, res) => {
  try {
    const user = req.user; // Use req.user directly
    const item = await MarketplaceItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.favorites = item.favorites.filter(
      fav => fav.userId.toString() !== user._id.toString()
    );

    await item.save();

    res.json({ message: 'Item removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites', error: error.message });
  }
});

// Get user's favorites
router.get('/favorites', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const user = req.user; // Use req.user directly
    
    const items = await MarketplaceItem.find({
      'favorites.userId': user._id,
      status: 'available'
    })
    .populate('sellerId', 'name rank profilePicture')
    .sort({ 'favorites.addedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await MarketplaceItem.countDocuments({
      'favorites.userId': user._id,
      status: 'available'
    });
    
    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

// Add review for seller
router.post('/items/:id/reviews', authenticateUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const user = req.user; // Use req.user directly
    
    const item = await MarketplaceItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user has a completed transaction with this seller
    const hasTransaction = item.inquiries.some(
      inquiry => inquiry.buyerId.toString() === user._id.toString() && 
                inquiry.status === 'accepted'
    );

    if (!hasTransaction) {
      return res.status(400).json({ 
        message: 'You can only review sellers you have transacted with' 
      });
    }

    // Check if user already reviewed this seller for this item
    const existingReview = item.reviews.find(
      review => review.reviewerId.toString() === user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this seller' });
    }

    item.reviews.push({
      reviewerId: user._id,
      rating,
      comment,
      createdAt: new Date()
    });

    await item.save();

    // Create notification for seller
    await createNotification({
      userId: item.sellerId,
      title: 'New Review Received',
      message: `${user.name} left a review for your item "${item.title}"`,
      type: 'info',
      relatedId: item._id,
      relatedType: 'marketplace_item'
    });

    res.json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
});

// Get marketplace categories
router.get('/categories', authenticateUser, async (req, res) => {
  try {
    const categories = await MarketplaceItem.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get marketplace statistics
router.get('/statistics', authenticateUser, async (req, res) => {
  try {
    const user = req.user; // Use req.user directly
    
    let stats = {};
    
    if (user.role === 'admin') {
      // Admin statistics
      const [
        totalItems,
        availableItems,
        soldItems,
        totalUsers,
        itemsByCategory,
        recentActivity
      ] = await Promise.all([
        MarketplaceItem.countDocuments(),
        MarketplaceItem.countDocuments({ status: 'available' }),
        MarketplaceItem.countDocuments({ status: 'sold' }),
        MarketplaceItem.distinct('sellerId').then(sellers => sellers.length),
        MarketplaceItem.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        MarketplaceItem.find()
          .populate('sellerId', 'name')
          .sort({ createdAt: -1 })
          .limit(10)
          .select('title sellerId createdAt status')
      ]);
      
      stats = {
        totalItems,
        availableItems,
        soldItems,
        totalUsers,
        itemsByCategory,
        recentActivity
      };
    } else {
      // User statistics
      const [
        myItems,
        myActiveItems,
        mySoldItems,
        myFavorites,
        myInquiries,
        receivedInquiries
      ] = await Promise.all([
        MarketplaceItem.countDocuments({ sellerId: user._id }),
        MarketplaceItem.countDocuments({ sellerId: user._id, status: 'available' }),
        MarketplaceItem.countDocuments({ sellerId: user._id, status: 'sold' }),
        MarketplaceItem.countDocuments({ 'favorites.userId': user._id }),
        MarketplaceItem.countDocuments({ 'inquiries.buyerId': user._id }),
        MarketplaceItem.countDocuments({ 
          sellerId: user._id, 
          'inquiries.0': { $exists: true } 
        })
      ]);
      
      stats = {
        myItems,
        myActiveItems,
        mySoldItems,
        myFavorites,
        myInquiries,
        receivedInquiries
      };
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Search marketplace items
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const { q, category, priceRange, location } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const query = {
      status: 'available',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) query.category = category;
    if (location) query['location.city'] = { $regex: location, $options: 'i' };
    
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(p => parseFloat(p));
      query.price = { $gte: min, $lte: max };
    }

    const items = await MarketplaceItem.find(query)
      .populate('sellerId', 'name rank profilePicture')
      .select('title price images category condition location createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error searching items', error: error.message });
  }
});

module.exports = router;