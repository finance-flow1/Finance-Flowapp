const pool = require('../db/pool');

const createUser = async ({ name, email, passwordHash, role = 'user' }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role]
  );
  return rows[0];
};

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

/** Admin: get all users with pagination */
const findAll = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [countRes, dataRes] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    ),
  ]);
  return {
    users: dataRes.rows,
    pagination: {
      total: parseInt(countRes.rows[0].count),
      page:  parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
    },
  };
};

module.exports = { createUser, findByEmail, findById, findAll };
