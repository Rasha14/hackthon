const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 * Returns user profile and JWT token
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, email, phone, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format'
      });
    }

    // Check if user already exists
    const existingUser = await req.db.collection('Users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user document
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userData = {
      id: userId,
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'user',
      trustScore: 100,
      failedVerifications: 0,
      successfulVerifications: 0,
      itemsReported: 0,
      itemsRecovered: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Save user to Firestore
    await req.db.collection('Users').doc(userId).set(userData);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('Creating JWT token with secret:', secret === 'your-secret-key' ? 'DEFAULT' : 'FROM_ENV');
    const token = jwt.sign(
      {
        userId,
        email,
        name,
        role: 'user'
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        name,
        email,
        phone,
        role: 'user',
        trustScore: 100
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Registration Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 * Returns user profile and JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const userSnapshot = await req.db.collection('Users').where('email', '==', email).get();

    if (userSnapshot.empty) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!userData.isActive) {
      return res.status(403).json({
        error: 'Account Disabled',
        message: 'Your account has been disabled'
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('Creating JWT token for login with secret:', secret === 'your-secret-key' ? 'DEFAULT' : 'FROM_ENV');
    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user'
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        trustScore: userData.trustScore
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires authentication)
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user from Firestore
    const userDoc = await req.db.collection('Users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const userData = userDoc.data();

    // Don't send password to client
    delete userData.password;

    res.json({
      user: userData
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile Fetch Failed',
      message: error.message
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, phone, photo } = req.body;

    // Validate update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (photo) updateData.photo = photo;
    updateData.updatedAt = new Date().toISOString();

    if (Object.keys(updateData).length === 1) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least one field must be provided for update'
      });
    }

    // Update user document
    await req.db.collection('Users').doc(userId).update(updateData);

    // Get updated user
    const userDoc = await req.db.collection('Users').doc(userId).get();
    const userData = userDoc.data();
    delete userData.password;

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile Update Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (token invalidation on client side)
 */
router.post('/logout', verifyToken, (req, res) => {
  // In a real application, you might want to maintain a token blacklist
  // For now, logout is handled client-side by removing the token
  res.json({
    message: 'Logged out successfully'
  });
});

module.exports = router;
