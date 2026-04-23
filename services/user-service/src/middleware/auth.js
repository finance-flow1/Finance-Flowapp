const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token — supports both direct calls and gateway-forwarded headers.
 * Sets req.userId and req.userRole on success.
 */
const verifyToken = (req, res, next) => {
  // Trust context headers injected by the gateway (defence-in-depth kept for compat)
  const userId = req.headers['x-user-id'];
  if (userId) {
    req.userId   = parseInt(userId, 10);
    req.userRole = req.headers['x-user-role'] || 'user';
    return next();
  }

  // Fallback: verify JWT directly (direct calls / when no gateway is used)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Require admin role. Must be used AFTER verifyToken.
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin };
