const router = require('express').Router();
const ctrl = require('../controllers/agent.controller');
const authMW = require('../middlewares/auth.middleware');

router.use(authMW);

router.get('/', ctrl.getAgents);
router.post('/', ctrl.addAgent);
router.patch('/:agentId', ctrl.updateAgent);
router.delete('/:agentId', ctrl.deleteAgent);

module.exports = router;