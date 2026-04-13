const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/me', authCtrl.getMe);
router.patch('/profile', authCtrl.updateProfile);
router.patch('/preferences', authCtrl.updatePreferences);
router.post('/llm-provider', authCtrl.addLLMProvider);
router.delete('/llm-provider/:providerId', authCtrl.removeLLMProvider);

module.exports = router;