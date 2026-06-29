const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/', ctrl.getContacts);
router.get('/:contactId', ctrl.getContact);
router.patch('/:contactId', ctrl.updateContact);
router.post('/:contactId/assign', ctrl.assignContact);
router.patch('/:contactId/stage', ctrl.updateStage);

module.exports = router;