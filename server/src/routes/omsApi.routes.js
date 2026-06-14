const router = require('express').Router();
const omsCtrl = require('../controllers/omsApi.controller');
const { apiKeyAuth } = require('../controllers/omsApi.controller');

// সব route এ API key auth
router.use(apiKeyAuth);

// ── Endpoints ─────────────────────────────────────────────────
router.get('/ping', omsCtrl.ping);
router.get('/orders', omsCtrl.listOrders);
router.get('/orders/:orderId', omsCtrl.getOrder);
router.patch('/orders/:orderId', omsCtrl.updateOrder);

module.exports = router;