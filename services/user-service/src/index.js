require('dotenv').config();

const express = require('express');
const morgan  = require('morgan');
const helmet  = require('helmet');
const cors    = require('cors');
const bcrypt  = require('bcrypt');

const logger                 = require('./utils/logger');
const { register, httpRequestsTotal, httpRequestDuration, httpErrorsTotal } = require('./utils/metrics');
const { swaggerUi, specs }   = require('./swagger/swagger');
const authRoutes             = require('./routes/auth');
const userRoutes             = require('./routes/users');
const pool                   = require('./db/pool');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── HTTP logging ──────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Metrics instrumentation ───────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const labels   = { method: req.method, route: req.path, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe({ method: req.method, route: req.path }, duration);
    if (res.statusCode >= 400) httpErrorsTotal.inc(labels);
  });
  next();
});

// ── API docs ──────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ── Observability ─────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', service: 'user-service', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});

// ── Routes ────────────────────────────────────────────
app.use('/api/v1/auth',  authRoutes);
app.use('/api/v1/users', userRoutes);

// ── Global error handler ──────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Startup with DB retry + seed ──────────────────────
const start = async () => {
  let retries = 10;
  while (retries) {
    try {
      await pool.query('SELECT 1');
      logger.info('✅ Database connected');
      break;
    } catch (err) {
      retries--;
      logger.warn(`DB not ready — retrying in 3s (${retries} left): ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (!retries) {
    logger.error('Could not connect to database. Exiting.');
    process.exit(1);
  }

  // Seed admin user on first boot
  try {
    const { rows } = await pool.query("SELECT id FROM users WHERE email = 'admin@finance.com'");
    if (rows.length === 0) {
      const hash = await bcrypt.hash('Admin123!', 12);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ('Admin', 'admin@finance.com', $1, 'admin')`,
        [hash]
      );
      logger.info('🌱 Seed: admin user created → admin@finance.com / Admin123!');
    }
  } catch (err) {
    logger.warn(`Seed skipped: ${err.message}`);
  }

  app.listen(PORT, () => logger.info(`🚀 User Service listening on port ${PORT}`));
};

start();
