const express = require('express');
const router = express.Router();
const { createAgentForNumber, getAgent, toDataURLFromQrString } = require('../services/baileys-agent');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const perNumberLimiter = new RateLimiterMemory({ points: 1, duration: 30 });

function checkApiKey(req, res, next) {
  const key = process.env.API_KEY;
  if (!key) return next();
  const auth = req.headers['authorization'] || req.query.key;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  if (auth.startsWith('Bearer ')) {
    if (auth.slice(7) !== key) return res.status(401).json({ error: 'Unauthorized' });
  } else if (auth !== key) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/pair', checkApiKey, async (req, res) => {
  try {
    const number = (req.query.number || '').replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(number)) return res.status(400).json({ error: 'Invalid number' });

    try { await perNumberLimiter.consume(number); } catch (_) { return res.status(429).json({ error: 'Too many requests for this number. Try later.' }); }

    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
    const agent = await createAgentForNumber(number, token);

    const start = Date.now();
    const timeout = 15000;
    while (!agent.qr && (Date.now() - start) < timeout) { await new Promise(r => setTimeout(r, 200)); }

    if (!agent.qr) return res.json({ token, status: agent.status || 'pending' });

    const qrDataUrl = await toDataURLFromQrString(agent.qr);
    return res.json({ token, qr: qrDataUrl, status: agent.status });
  } catch (err) {
    console.error('pair route error:', err && (err.stack || err.message));
    return res.status(500).json({ error: 'Failed to initiate pairing' });
  }
});

router.get('/pair/status', checkApiKey, async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: 'token required' });

  const agent = getAgent(token);
  if (!agent) return res.status(404).json({ error: 'Not found' });

  return res.json({ status: agent.status || 'unknown', number: agent.number, jid: agent.jid || null, createdAt: agent.createdAt || null });
});

module.exports = router;
