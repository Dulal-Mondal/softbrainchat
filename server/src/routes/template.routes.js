const router = require('express').Router();
const ctrl = require('../controllers/template.controller');
const authMW = require('../middlewares/auth.middleware');
const { requirePlan } = require('../middlewares/plan.middleware');

// সব template route এ pro plan দরকার (agent হলে owner এর plan)
router.use(authMW, requirePlan('pro'));

// ── Broadcast ──
router.post('/broadcast', ctrl.sendTemplateBroadcast);

// ── Template management (create + list + status) ──
router.get('/:channelId/all', ctrl.getAllChannelTemplates);   // সব + status
router.post('/:channelId/create', ctrl.createChannelTemplate);    // নতুন তৈরি
router.delete('/:channelId/:templateName', ctrl.deleteChannelTemplate);    // মুছুন

// ── Broadcast এর জন্য শুধু approved ──
router.get('/:channelId', ctrl.getChannelTemplates);      // approved only

module.exports = router;