const authService = require('../services/authService');
const logger      = require('../utils/logger');

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
    const userId = req.headers['x-user-id'];
    const user   = await authService.getProfile(userId);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };
