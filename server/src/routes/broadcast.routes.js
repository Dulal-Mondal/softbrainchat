const router = require('express').Router();
const ctrl = require('../controllers/broadcast.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/', ctrl.getBroadcasts);
router.post('/preview', ctrl.previewBroadcast);
router.post('/', ctrl.sendBroadcast);

module.exports = router;