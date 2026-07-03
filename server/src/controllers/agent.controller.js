const Agent = require('../models/Agent.model');
const User = require('../models/User.model');
const Contact = require('../models/Contact.model');

let sendAgentInvite = async () => ({ sent: false });
try { ({ sendAgentInvite } = require('../services/email.service')); } catch (e) { }

const ALL_FEATURES = ['inbox', 'crm', 'broadcast', 'import', 'orders', 'agents', 'analytics', 'business', 'meta'];

// ── GET /api/agents ──────────────────────────────────────────
exports.getAgents = async (req, res) => {
    try {
        const agents = await Agent.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, agents, allFeatures: ALL_FEATURES });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/agents ─────────────────────────────────────────
// নতুন agent যোগ + invite email পাঠাও
exports.addAgent = async (req, res) => {
    try {
        const { name, email, role, permissions } = req.body;
        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({ message: 'নাম এবং email দরকার' });
        }

        const cleanEmail = email.toLowerCase().trim();
        const existing = await Agent.findOne({ ownerId: req.user._id, email: cleanEmail });
        if (existing) return res.status(400).json({ message: 'এই email এ agent আগে থেকে আছে' });

        // ── Agent count limit (plan অনুযায়ী) ──
        const AGENT_LIMITS = { free: 0, pro: 3, 'pro-max': 10 };
        const plan = req.user.effectivePlan || req.user.plan || 'free';
        const limit = AGENT_LIMITS[plan] ?? 0;
        const currentCount = await Agent.countDocuments({ ownerId: req.user._id });

        if (currentCount >= limit) {
            return res.status(403).json({
                message: plan === 'free'
                    ? 'Free plan এ agent যোগ করা যায় না। Pro plan নিন (৩ জন) বা Pro Max (১০ জন)।'
                    : `আপনার ${plan} plan এ সর্বোচ্চ ${limit} জন agent। Upgrade করুন আরও যোগ করতে।`,
            });
        }

        // registered user আছে কিনা
        const agentUser = await User.findOne({ email: cleanEmail });

        const agent = new Agent({
            ownerId: req.user._id,
            name: name.trim(),
            email: cleanEmail,
            role: role || 'agent',
            permissions: Array.isArray(permissions) && permissions.length ? permissions : ['inbox'],
            agentUserId: agentUser?._id || null,
        });

        // invite token তৈরি করো
        const token = agent.generateInviteToken();
        await agent.save();

        // Email পাঠাও
        const emailResult = await sendAgentInvite({
            toEmail: cleanEmail,
            agentName: agent.name,
            ownerName: req.user.name || 'আপনার Team Admin',
            ownerEmail: req.user.email,   // Reply-To = client এর email
            inviteToken: token,
        });

        res.status(201).json({
            success: true,
            agent,
            emailSent: emailResult.sent,
            inviteLink: emailResult.inviteLink,   // email fail হলে admin manually পাঠাতে পারবে
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/agents/:agentId ───────────────────────────────
// permission, role, active, allowedChannels update
exports.updateAgent = async (req, res) => {
    try {
        const { name, role, active, permissions, allowedChannels } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (active !== undefined) updates.active = active;
        if (Array.isArray(permissions)) updates.permissions = permissions;
        if (Array.isArray(allowedChannels)) updates.allowedChannels = allowedChannels;

        const agent = await Agent.findOneAndUpdate(
            { _id: req.params.agentId, ownerId: req.user._id },
            { $set: updates },
            { new: true }
        );
        if (!agent) return res.status(404).json({ message: 'Agent not found' });
        res.json({ success: true, agent });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/agents/:agentId/resend ─────────────────────────
// invite আবার পাঠাও
exports.resendInvite = async (req, res) => {
    try {
        const agent = await Agent.findOne({ _id: req.params.agentId, ownerId: req.user._id });
        if (!agent) return res.status(404).json({ message: 'Agent not found' });

        const token = agent.generateInviteToken();
        await agent.save();

        const emailResult = await sendAgentInvite({
            toEmail: agent.email,
            agentName: agent.name,
            ownerName: req.user.name || 'আপনার Team Admin',
            ownerEmail: req.user.email,   // Reply-To = client এর email
            inviteToken: token,
        });

        res.json({ success: true, emailSent: emailResult.sent, inviteLink: emailResult.inviteLink });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/agents/:agentId ──────────────────────────────
exports.deleteAgent = async (req, res) => {
    try {
        const agent = await Agent.findOne({ _id: req.params.agentId, ownerId: req.user._id });
        if (!agent) return res.status(404).json({ message: 'Agent not found' });

        if (agent.agentUserId) {
            await Contact.updateMany({ assignedTo: agent.agentUserId }, { $set: { assignedTo: null } });
        }
        await Agent.deleteOne({ _id: agent._id });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ══════════ INVITE ACCEPT (public, no auth) ══════════

// ── GET /api/agents/invite/:token ────────────────────────────
// invite info দেখাও (accept page এর জন্য)
exports.getInviteInfo = async (req, res) => {
    try {
        const agent = await Agent.findOne({ inviteToken: req.params.token })
            .populate('ownerId', 'name');
        if (!agent) return res.status(404).json({ message: 'Invite পাওয়া যায়নি বা মেয়াদ শেষ' });

        res.json({
            success: true,
            invite: {
                name: agent.name,
                email: agent.email,
                ownerName: agent.ownerId?.name || 'Team',
                alreadyAccepted: agent.inviteStatus === 'accepted',
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/agents/invite/:token/accept ────────────────────
// agent Firebase এ account বানানোর পরে — এই endpoint link করে
// body: { firebaseUid }  (client Firebase এ password দিয়ে account বানিয়ে uid পাঠাবে)
exports.acceptInvite = async (req, res) => {
    try {
        const { firebaseUid, name } = req.body;
        if (!firebaseUid) return res.status(400).json({ message: 'firebaseUid দরকার' });

        const agent = await Agent.findOne({ inviteToken: req.params.token });
        if (!agent) return res.status(404).json({ message: 'Invite পাওয়া যায়নি' });

        // এই email এ User তৈরি/খুঁজো
        let user = await User.findOne({ email: agent.email });
        if (!user) {
            user = await User.create({
                uid: firebaseUid,
                email: agent.email,
                name: name || agent.name,
                role: 'user',
            });
        } else {
            // uid update করো (নতুন Firebase account হলে)
            user.uid = firebaseUid;
            await user.save();
        }

        // Agent এর সাথে link করো
        agent.agentUserId = user._id;
        agent.inviteStatus = 'accepted';
        agent.acceptedAt = new Date();
        agent.inviteToken = null;   // token আর কাজ করবে না
        await agent.save();

        res.json({ success: true, message: 'Invite accepted! এখন login করুন।' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/agents/my-access ────────────────────────────────
// current user agent কিনা + permission + owner এর plan
exports.getMyAccess = async (req, res) => {
    try {
        // auth.middleware already agent detect করেছে
        res.json({
            success: true,
            isAgent: req.isAgent || false,
            permissions: req.isAgent ? (req.agentPermissions || ['inbox']) : null,
            allowedChannels: req.isAgent ? (req.allowedChannels || []) : null,
            effectivePlan: req.effectivePlan || req.user.plan,
            agentName: req.agentDoc?.name || null,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;