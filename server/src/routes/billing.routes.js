const router = require('express').Router();
const billingCtrl = require('../controllers/billing.controller');
const authMW = require('../middlewares/auth.middleware');

// Webhook route — raw body দরকার, auth নেই (app.js এ register হয়েছে)
router.post('/webhook', billingCtrl.handleWebhook);

// Protected routes
router.post('/checkout', authMW, billingCtrl.createCheckout);
router.post('/portal', authMW, billingCtrl.createPortal);
router.get('/status', authMW, billingCtrl.getStatus);

module.exports = router;