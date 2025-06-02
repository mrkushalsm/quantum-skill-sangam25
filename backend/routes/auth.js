const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { admin, verifyIdToken, createCustomToken } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, address, role, serviceNumber, rank, unit } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phoneNumber || !address || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists in our database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user in Firebase
    let firebaseUser;
    try {
      console.log('Attempting to create Firebase user for email:', email);
      
      // First, check if the email is already registered in Firebase
      try {
        const existingFirebaseUser = await admin.auth().getUserByEmail(email);
        if (existingFirebaseUser) {
          console.log('Firebase user already exists with this email:', email);
          return res.status(400).json({
            success: false,
            message: 'This email is already registered'
          });
        }
      } catch (error) {
        // User doesn't exist, which is what we want
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      // Create the new user
      firebaseUser = await admin.auth().createUser({
        email: email.trim(),
        password: password,
        displayName: `${firstName} ${lastName}`.trim(),
        emailVerified: false,
        disabled: false
      });
      
      console.log('Successfully created Firebase user:', firebaseUser.uid);
      
    } catch (firebaseError) {
      console.error('Firebase user creation error:', firebaseError);
      
      // More specific error handling
      let errorMessage = 'Failed to create user';
      let statusCode = 400;
      
      if (firebaseError.code === 'auth/email-already-exists') {
        errorMessage = 'This email is already registered';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'The email address is invalid';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak';
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password authentication is not enabled';
        statusCode = 500; // Internal server error for configuration issues
      }
      
      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: firebaseError.message
      });
    }

    // Create user in our database
    const userData = {
      firebaseUid: firebaseUser.uid,
      email,
      name: `${firstName} ${lastName}`.trim(),
      phoneNumber,
      address,
      role,
      serviceNumber: serviceNumber || `TEMP-${Date.now()}`,
      isActive: true
    };

    // Add role-specific fields
    if (role === 'officer') {
      if (!rank || !unit) {
        // Clean up the Firebase user if we fail to create in our DB
        await admin.auth().deleteUser(firebaseUser.uid);
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

    // Create a session token
    const token = await createCustomToken(firebaseUser.uid, {
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
      token
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Sign in with Firebase Auth
    let firebaseUser;
    try {
      // First, get the user by email
      firebaseUser = await admin.auth().getUserByEmail(email);
      
      // Then verify the password using Firebase Admin SDK
      // Note: Firebase Admin SDK doesn't have a direct password verification method
      // So we'll use the Firebase REST API to verify the password
      const firebaseRestApiKey = process.env.FIREBASE_WEB_API_KEY;
      if (!firebaseRestApiKey) {
        throw new Error('Firebase Web API key is not configured');
      }
      
      // Call Firebase REST API to verify password
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseRestApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
            returnSecureToken: true,
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Invalid email or password');
      }
      
      // Update the user's last login time
      await admin.auth().updateUser(firebaseUser.uid, {
        lastLoginAt: new Date().toISOString(),
      });
      
    } catch (authError) {
      console.error('Firebase auth error:', authError);
      return res.status(401).json({
        success: false,
        message: authError.message || 'Invalid email or password'
      });
    }
    
    // Find user in database
    const user = await User.findOne({ firebaseUid: firebaseUser.uid });

    if (!user) {
      // Clean up the Firebase user if not found in our database
      await admin.auth().deleteUser(firebaseUser.uid);
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

    // Create a session token
    const token = await createCustomToken(firebaseUser.uid, {
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
      token
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
