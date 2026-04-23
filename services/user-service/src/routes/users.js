const router = require('express').Router();
const { getProfile, listUsers, getAdminStats } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and admin management endpoints
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, getProfile);

/**
 * @swagger
 * /api/v1/users/admin/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get system-wide user statistics (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       403:
 *         description: Admin access required
 */
router.get('/admin/stats', verifyToken, requireAdmin, getAdminStats);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Admin access required
 */
router.get('/', verifyToken, requireAdmin, listUsers);

module.exports = router;

