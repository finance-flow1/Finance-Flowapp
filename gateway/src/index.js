require('dotenv').config();

const express       = require('express');
const morgan        = require('morgan');
const helmet        = require('helmet');
const cors          = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const logger                                              = require('./utils/logger');
const { register, httpRequestsTotal, httpRequestDuration, httpErrorsTotal } = require('./utils/metrics');
const { verifyToken }                                     = require('./middleware/auth');
const { rateLimiter }                                     = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 4000;

const USER_SERVICE        = process.env.USER_SERVICE_URL        || 'http://user-service:5001';
const TRANSACTION_SERVICE = process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:5002';

// ── Security ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// ── HTTP logging ──────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ── Metrics instrumentation ───────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route    = req.path;
    const labels   = { method: req.method, route, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe({ method: req.method, route }, duration);
    if (res.statusCode >= 400) httpErrorsTotal.inc(labels);
  });
  next();
});

// ── Observability endpoints ───────────────────────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (_req, res) =>
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString() })
);

// ── Rate limiting ─────────────────────────────────────
app.use(rateLimiter);

// ── Proxy helper ──────────────────────────────────────
// Using http-proxy-middleware v2 API (onError / onProxyReq at top level).
// v3 uses a nested `on: {}` object — do NOT mix them.
const makeProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    onError: (err, _req, res) => {
      logger.error(`Proxy error → ${target}: ${err.message}`);
      res.status(502).json({ error: 'Upstream service unavailable' });
    },
    onProxyReq: (proxyReq, req) => {
      // Propagate enriched user-context headers to downstream services
      ['x-user-id', 'x-user-email', 'x-user-role'].forEach((h) => {
        if (req.headers[h]) proxyReq.setHeader(h, req.headers[h]);
      });
    },
  });

// ── Public routes (no JWT check) ──────────────────────
app.use('/api/v1/auth', makeProxy(USER_SERVICE));

// ── Protected routes ──────────────────────────────────
app.use('/api/v1/users',        verifyToken, makeProxy(USER_SERVICE));
app.use('/api/v1/transactions', verifyToken, makeProxy(TRANSACTION_SERVICE));

// ── 404 ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Gateway: route not found' }));

app.listen(PORT, () => logger.info(`🚀  API Gateway listening on port ${PORT}`));
