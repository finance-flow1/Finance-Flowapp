const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { createUser, findByEmail, findById } = require('../models/userModel');

const SALT_ROUNDS = 12;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

const register = async ({ name, email, password }) => {
  const existing = await findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user  = await createUser({ name, email, passwordHash });
  const token = signToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }
  const token = signToken(user);
  return {
    user:  { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
};

const getProfile = async (userId) => {
  const user = await findById(parseInt(userId));
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
};

module.exports = { register, login, getProfile };
