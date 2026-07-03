const router = require('express').Router();
const ctrl = require('../controllers/agent.controller');
const authMW = require('../middlewares/auth.middleware');

// ── Public invite routes (auth ছাড়া — agent এখনো login করেনি) ──
router.get('/invite/:token', ctrl.getInviteInfo);
router.post('/invite/:token/accept', ctrl.acceptInvite);

// ── Protected routes (admin) ──
router.use(authMW);
router.get('/my-access', ctrl.getMyAccess);
router.get('/all-emails', ctrl.getAllAgentEmails);   // super admin — agent badge
router.get('/', ctrl.getAgents);
router.post('/', ctrl.addAgent);
router.patch('/:agentId', ctrl.updateAgent);
router.post('/:agentId/resend', ctrl.resendInvite);
router.delete('/:agentId', ctrl.deleteAgent);

module.exports = router;