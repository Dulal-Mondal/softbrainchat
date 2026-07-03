const router = require('express').Router();
const ctrl = require('../controllers/subscription.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

// Client (admin)
router.post('/', ctrl.requestSubscription);
router.get('/my', ctrl.getMySubscriptions);

// Super admin
router.get('/all', ctrl.getAllSubscriptions);
router.post('/:subId/approve', ctrl.approveSubscription);
router.post('/:subId/reject', ctrl.rejectSubscription);

module.exports = router;