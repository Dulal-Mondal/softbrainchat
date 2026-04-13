const router = require('express').Router();
const adminCtrl = require('../controllers/admin.controller');
const authMW = require('../middlewares/auth.middleware');
const adminMW = require('../middlewares/admin.middleware');

// সব admin route এ Firebase auth + admin role check
router.use(authMW, adminMW);

router.get('/stats', adminCtrl.getStats);
router.get('/users', adminCtrl.getAllUsers);
router.get('/users/:userId', adminCtrl.getUser);
router.patch('/users/:userId/plan-override', adminCtrl.setPlanOverride);
router.patch('/users/:userId/plan-override/remove', adminCtrl.removePlanOverride);
router.patch('/users/:userId/role', adminCtrl.updateRole);
router.delete('/users/:userId', adminCtrl.deleteUser);

module.exports = router;