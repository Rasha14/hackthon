const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = express.Router();
const db = admin.firestore();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await db.collection('Users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      trust_score: 50, // Default trust score
      role: 'user',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await db.collection('Users').add(userData);
    const userId = userRef.id;

    // Generate JWT token
    const token = jwt.sign(
      { uid: userId, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        uid: userId,
        name,
        email,
        phone,
        trust_score: 50,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const userSnapshot = await db.collection('Users').where('email', '==', email).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { uid: userDoc.id, email, role: userData.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        uid: userDoc.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        trust_score: userData.trust_score,
        role: userData.role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    // This would typically use JWT middleware, but for now we'll get from query
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const userDoc = await db.collection('Users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    res.json({
      user: {
        uid: userDoc.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        trust_score: userData.trust_score,
        role: userData.role || 'user'
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

module.exports = router;
