const jwt = require('jsonwebtoken');

/**
 * Verify JWT token middleware
 * Extracts and validates JWT from Authorization header
 * Requires token to be present and valid
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const secret = process.env.JWT_SECRET || 'your-secret-key';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message, 'using secret:', secret === 'your-secret-key' ? 'DEFAULT' : 'FROM_ENV');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      details: error.message
    });
  }
};

/**
 * Require admin role
 * Used after verifyToken to ensure user has admin privileges
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No user found'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
      userRole: req.user.role
    });
  }

  next();
};

/**
 * Optional token verification - doesn't fail if no token
 */
const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    } catch (error) {
      // Silently fail - user is optional
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  optionalVerifyToken
};
