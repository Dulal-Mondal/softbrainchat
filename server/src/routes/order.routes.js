const router = require('express').Router();
const orderCtrl = require('../controllers/order.controller');
const omsConfigCtrl = require('../controllers/omsConfig.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

// ── Orders ────────────────────────────────────────────────────
router.get('/', orderCtrl.getOrders);
router.get('/:orderId', orderCtrl.getOrder);
router.patch('/:orderId/status', orderCtrl.updateStatus);
router.delete('/:orderId', orderCtrl.deleteOrder);

// ── API Keys (OMS software দেওয়ার জন্য) ─────────────────────
router.get('/api-keys', orderCtrl.getApiKeys);
router.post('/api-keys', orderCtrl.createApiKey);
router.delete('/api-keys/:keyId', orderCtrl.revokeApiKey);

// ── OMS Config (user এর OMS software connection) ─────────────
router.get('/oms-config', omsConfigCtrl.getConfig);
router.patch('/oms-config', omsConfigCtrl.updateConfig);
router.post('/oms-config/test', omsConfigCtrl.testConfig);

module.exports = router;