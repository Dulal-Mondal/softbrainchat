const router = require('express').Router();
const ctrl = require('../controllers/template.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/:channelId', ctrl.getChannelTemplates);
router.post('/broadcast', ctrl.sendTemplateBroadcast);

module.exports = router;