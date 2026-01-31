const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const db = admin.firestore();

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to verify it still exists
    const userDoc = await db.collection('Users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request object
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Require admin role
const requireAdmin = async (req, res, next) => {
  try {
    // verifyToken should have already run and set req.user
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user has admin role
    const userDoc = await db.collection('Users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin
};
