const router = require('express').Router();
const ctrl = require('../controllers/conversation.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/', ctrl.getConversations);
router.get('/:senderId/:channelId', ctrl.getConversation);
router.post('/:senderId/:channelId/reply', ctrl.sendMessage);

module.exports = router;