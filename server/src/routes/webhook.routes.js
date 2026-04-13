const router = require('express').Router();
const metaCtrl = require('../controllers/meta.controller');
const { webhookLimit } = require('../middlewares/rateLimit.middleware');

// Rate limit apply করো — Meta spam prevent
router.use(webhookLimit);

// GET  /webhook/meta/:channelId — Meta webhook verification
// POST /webhook/meta/:channelId — Incoming message handler
router.get('/meta/:channelId', metaCtrl.webhookVerify);
router.post('/meta/:channelId', metaCtrl.webhookReceive);

module.exports = router;