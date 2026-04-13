const router = require('express').Router();
const metaCtrl = require('../controllers/meta.controller');
const authMW = require('../middlewares/auth.middleware');
const { requirePlan } = require('../middlewares/plan.middleware');

router.use(authMW, requirePlan('pro'));

router.get('/channels', metaCtrl.getChannels);
router.post('/channels', metaCtrl.addChannel);
router.patch('/channels/:channelId', metaCtrl.updateChannel);
router.delete('/channels/:channelId', metaCtrl.deleteChannel);

router.get('/messages', metaCtrl.getMessages);
router.patch('/messages/:msgId/reply', metaCtrl.humanReply);

module.exports = router;