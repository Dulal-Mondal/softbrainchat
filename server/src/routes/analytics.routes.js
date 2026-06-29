const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);
router.get('/dashboard', ctrl.getDashboardStats);

module.exports = router;