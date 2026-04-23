const svc    = require('../services/transactionService');
const logger = require('../utils/logger');

/* ── Fire-and-forget notification ──────────────────────
   Calls the notification-service over Docker's internal
   network after a transaction is saved. Never throws. */
const fireNotification = (token, tx) => {
  const emoji  = tx.type === 'income' ? '📈' : '📉';
  const label  = tx.type === 'income' ? 'Income'  : 'Expense';
  const amount = `$${parseFloat(tx.amount).toFixed(2)}`;

  fetch('http://notification-service:5003/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,            // forward the user's JWT
    },
    body: JSON.stringify({
      type:    tx.type === 'income' ? 'success' : 'info',
      title:   `${emoji} ${label} recorded`,
      message: `${amount} — ${tx.category}`,
    }),
  }).catch((err) => logger.warn(`Notification fire failed: ${err.message}`));
};

const create = async (req, res, next) => {
  try {
    const tx = await svc.create(req.userId, req.body);
    logger.info(`Transaction created: id=${tx.id} user=${req.userId}`);
    res.status(201).json({ success: true, data: tx });
    // Notify after response is sent (non-blocking)
    fireNotification(req.headers.authorization, tx);
  } catch (err) { next(err); }
};


const list = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const result = await svc.list(req.userId, {
      type, category, startDate, endDate,
      page:  Math.max(1, parseInt(page)),
      limit: Math.min(100, Math.max(1, parseInt(limit))),
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const tx = await svc.getById(parseInt(req.params.id), req.userId);
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const tx = await svc.update(parseInt(req.params.id), req.userId, req.body);
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await svc.remove(parseInt(req.params.id), req.userId);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await svc.analytics(req.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getAdminStats = async (req, res, next) => {
  try {
    const data = await svc.adminStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { create, list, getById, update, remove, getAnalytics, getAdminStats };
