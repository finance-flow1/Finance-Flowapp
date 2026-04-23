require('dotenv').config();

const express  = require('express');
const morgan   = require('morgan');
const helmet   = require('helmet');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const winston  = require('winston');
const prom     = require('prom-client');

const app  = express();
const PORT = process.env.PORT || 5003;

// ── Metrics ───────────────────────────────────────────
const register = new prom.Registry();
prom.collectDefaultMetrics({ register });
const httpRequestsTotal = new prom.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// ── Logger ────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'notification-service' },
  transports: [new winston.transports.Console()],
});

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Metrics Middleware ────────────────────────────────
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// ── Auth middleware ───────────────────────────────────
const verifyToken = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (userId) {
    req.userId   = parseInt(userId, 10);
    req.userRole = req.headers['x-user-role'] || 'user';
    return next();
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.userId   = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── In-memory store (replace with DB in production) ───
const notifications = [];

// ── Health ────────────────────────────────────────────
// ── Observability ─────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (_req, res) =>
  res.json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() })
);

// ── List notifications for current user ───────────────
app.get('/api/v1/notifications', verifyToken, (req, res) => {
  const userNotifs = notifications
    .filter((n) => n.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, data: userNotifs });
});

// ── Create notification ───────────────────────────────
app.post('/api/v1/notifications', verifyToken, (req, res) => {
  const { type = 'info', title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }
  const notification = {
    id:        Date.now(),
    userId:    req.userId,
    type,          // 'info' | 'success' | 'warning' | 'error'
    title,
    message,
    read:      false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notification);
  logger.info(`Notification created for user ${req.userId}: ${title}`);
  res.status(201).json({ success: true, data: notification });
});

// ── Mark notification read ────────────────────────────
app.patch('/api/v1/notifications/:id/read', verifyToken, (req, res) => {
  const id    = parseInt(req.params.id);
  const notif = notifications.find((n) => n.id === id && n.userId === req.userId);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });
  notif.read = true;
  res.json({ success: true, data: notif });
});

// ── 404 ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => logger.info(`🔔 Notification Service listening on port ${PORT}`));
