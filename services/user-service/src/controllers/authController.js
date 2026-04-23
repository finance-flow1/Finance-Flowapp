const authService  = require('../services/authService');
const { findAll }  = require('../models/userModel');
const pool         = require('../db/pool');
const logger       = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    logger.info(`New user registered: ${user.email}`);
    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    logger.info(`User logged in: ${user.email}`);
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId || req.headers['x-user-id'];
    const user   = await authService.getProfile(userId);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/** Admin: list all users */
const listUsers = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || 1));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || 20)));
    const result = await findAll({ page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/** Admin: system-wide user statistics */
const getAdminStats = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::INTEGER                                                   AS total_users,
        COUNT(*) FILTER (WHERE role = 'admin')::INTEGER                    AS total_admins,
        COUNT(*) FILTER (WHERE role = 'user')::INTEGER                     AS total_regular_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::INTEGER AS new_users_30d,
        MIN(created_at)                                                     AS oldest_account,
        MAX(created_at)                                                     AS newest_account
      FROM users
    `);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, listUsers, getAdminStats };

