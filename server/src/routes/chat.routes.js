const router = require('express').Router();
const chatCtrl = require('../controllers/chat.controller');
const authMW = require('../middlewares/auth.middleware');
const { checkMessageLimit } = require('../middlewares/plan.middleware');
const { chatLimit } = require('../middlewares/rateLimit.middleware');

router.use(authMW);

// Send message — plan limit + rate limit উভয়ই check হবে
router.post('/send', chatLimit, checkMessageLimit, chatCtrl.sendMessage);
router.get('/history', chatCtrl.getChatHistory);
router.get('/:chatId', chatCtrl.getChat);
router.delete('/:chatId', chatCtrl.deleteChat);
router.patch('/:chatId/message/:messageId/correct', chatCtrl.correctMessage);

module.exports = router;