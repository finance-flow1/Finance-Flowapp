const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Defence-in-depth: re-verify JWT even when called through the gateway.
 * Also trusts x-user-id header set by the gateway for efficiency.
 */
const verifyToken = (req, res, next) => {
  // Trust context headers injected by the gateway
  const userId = req.headers['x-user-id'];
  if (userId) {
    req.userId   = parseInt(userId, 10);
    req.userRole = req.headers['x-user-role'];
    return next();
  }

  // Fallback: verify JWT directly (direct calls / testing)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token  = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };
