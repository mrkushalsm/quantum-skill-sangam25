const express = require('express');
const User = require('../models/User');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-firebaseUid');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// Update current user profile
router.put('/profile', 
  authenticateUser, 
  uploadProfilePicture,
  async (req, res) => {
    try {
      const allowedUpdates = [
        'name', 'phoneNumber', 'address', 'emergencyContacts', 
        'familyMembers', 'dateOfBirth', 'preferences'
      ];
      
      const updates = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Handle profile picture upload
      if (req.file) {
        updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        { new: true, runValidators: true }
      ).select('-firebaseUid');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
);

// Get user by ID (admin only)
router.get('/:userId', 
  authenticateUser, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId).select('-firebaseUid');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  }
);

// Get all users (admin only)
router.get('/', 
  authenticateUser, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { serviceNumber: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .select('-firebaseUid')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }
);

// Update user status (admin only)
router.put('/:userId/status', 
  authenticateUser, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive },
        { new: true }
      ).select('-firebaseUid');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error.message
      });
    }
  }
);

// Delete user (admin only)
router.delete('/:userId', 
  authenticateUser, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete by deactivating instead of hard delete
      await User.findByIdAndUpdate(req.params.userId, { isActive: false });

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  }
);

// Get user statistics (admin only)
router.get('/admin/statistics', 
  authenticateUser, 
  authorizeRoles('admin'), 
  async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            inactive: {
              $sum: { $cond: ['$isActive', 0, 1] }
            }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const newUsersThisMonth = await User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      });

      res.json({
        success: true,
        statistics: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          newThisMonth: newUsersThisMonth,
          byRole: stats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics',
        error: error.message
      });
    }
  }
);

module.exports = router;
