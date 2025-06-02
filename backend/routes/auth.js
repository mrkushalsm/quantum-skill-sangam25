const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyFirebaseToken, createCustomToken } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { idToken, serviceNumber, name, role, rank, unit, phoneNumber, address, familyMembers } = req.body;

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { firebaseUid: decodedToken.uid },
        { email: decodedToken.email },
        { serviceNumber: serviceNumber }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const userData = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      serviceNumber: serviceNumber.toUpperCase(),
      name,
      role,
      phoneNumber,
      address,
      familyMembers
    };

    // Add role-specific fields
    if (role === 'officer') {
      if (!rank || !unit) {
        return res.status(400).json({
          success: false,
          message: 'Rank and unit are required for officers'
        });
      }
      userData.rank = rank;
      userData.unit = unit;
    }

    const user = new User(userData);
    await user.save();

    // Create custom token
    const customToken = await createCustomToken(decodedToken.uid, {
      role: user.role,
      userId: user._id.toString()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        serviceNumber: user.serviceNumber
      },
      customToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase token is required'
      });
    }

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);
    
    // Find user in database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create custom token
    const customToken = await createCustomToken(decodedToken.uid, {
      role: user.role,
      userId: user._id.toString()
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        serviceNumber: user.serviceNumber,
        rank: user.rank,
        unit: user.unit
      },
      customToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

module.exports = router;
