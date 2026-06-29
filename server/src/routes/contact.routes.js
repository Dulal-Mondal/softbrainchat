// const router = require('express').Router();
// const ctrl = require('../controllers/contact.controller');
// const authMW = require('../middlewares/auth.middleware');

// router.use(authMW);

// router.get('/', ctrl.getContacts);
// router.get('/:contactId', ctrl.getContact);
// router.patch('/:contactId', ctrl.updateContact);
// router.post('/:contactId/assign', ctrl.assignContact);
// router.patch('/:contactId/stage', ctrl.updateStage);

// module.exports = router;





// const router = require('express').Router();
// const ctrl = require('../controllers/contact.controller');
// const authMW = require('../middlewares/auth.middleware');

// router.use(authMW);

// // ⚠️ specific route আগে, dynamic (:contactId) পরে
// router.get('/meta/tags', ctrl.getAllTags);

// router.get('/', ctrl.getContacts);
// router.get('/:contactId', ctrl.getContact);
// router.patch('/:contactId', ctrl.updateContact);
// router.post('/:contactId/assign', ctrl.assignContact);
// router.patch('/:contactId/stage', ctrl.updateStage);
// router.post('/:contactId/tags', ctrl.addTag);
// router.delete('/:contactId/tags/:tag', ctrl.removeTag);

// module.exports = router;








// const router = require('express').Router();
// const ctrl = require('../controllers/contact.controller');
// const authMW = require('../middlewares/auth.middleware');

// router.use(authMW);

// // ⚠️ specific route আগে, dynamic (:contactId) পরে
// router.get('/meta/tags', ctrl.getAllTags);

// router.get('/', ctrl.getContacts);
// router.get('/:contactId', ctrl.getContact);
// router.patch('/:contactId', ctrl.updateContact);
// router.post('/:contactId/assign', ctrl.assignContact);
// router.patch('/:contactId/stage', ctrl.updateStage);
// router.post('/:contactId/tags', ctrl.addTag);
// router.delete('/:contactId/tags/:tag', ctrl.removeTag);
// router.post('/:contactId/analyze', ctrl.analyzeLead);

// module.exports = router;








// const router = require('express').Router();
// const ctrl = require('../controllers/contact.controller');
// const importCtrl = require('../controllers/contactImport.controller');
// const authMW = require('../middlewares/auth.middleware');

// router.use(authMW);

// // ⚠️ specific route আগে, dynamic (:contactId) পরে
// router.get('/meta/tags', ctrl.getAllTags);
// router.post('/import', importCtrl.importContacts);

// router.get('/', ctrl.getContacts);
// router.get('/:contactId', ctrl.getContact);
// router.patch('/:contactId', ctrl.updateContact);
// router.post('/:contactId/assign', ctrl.assignContact);
// router.patch('/:contactId/stage', ctrl.updateStage);
// router.post('/:contactId/tags', ctrl.addTag);
// router.delete('/:contactId/tags/:tag', ctrl.removeTag);
// router.post('/:contactId/analyze', ctrl.analyzeLead);

// module.exports = router;






const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const importCtrl = require('../controllers/contactImport.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

// ⚠️ specific route আগে, dynamic (:contactId) পরে
router.get('/meta/tags', ctrl.getAllTags);
router.post('/import', importCtrl.importContacts);

router.get('/', ctrl.getContacts);
router.get('/:contactId', ctrl.getContact);
router.patch('/:contactId', ctrl.updateContact);
router.post('/:contactId/assign', ctrl.assignContact);
router.patch('/:contactId/stage', ctrl.updateStage);
router.post('/:contactId/tags', ctrl.addTag);
router.delete('/:contactId/tags/:tag', ctrl.removeTag);
router.post('/:contactId/analyze', ctrl.analyzeLead);
router.post('/:contactId/extract', ctrl.extractCustomData);
router.patch('/:contactId/custom', ctrl.updateCustomData);

module.exports = router;