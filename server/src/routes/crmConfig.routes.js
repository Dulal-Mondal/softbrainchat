const router = require('express').Router();
const ctrl = require('../controllers/crmConfig.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/', ctrl.getConfig);
router.patch('/', ctrl.updateConfig);

module.exports = router;