const Agent = require('../models/Agent.model');
const User = require('../models/User.model');
const Contact = require('../models/Contact.model');

// ── GET /api/agents ──────────────────────────────────────────
exports.getAgents = async (req, res) => {
    try {
        const agents = await Agent.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, agents });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/agents ─────────────────────────────────────────
// নতুন agent যোগ করো (email দিয়ে)
exports.addAgent = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({ message: 'নাম এবং email দরকার' });
        }

        const existing = await Agent.findOne({ ownerId: req.user._id, email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'এই email এ agent আগে থেকে আছে' });

        // এই email এ কোনো registered user আছে কিনা — থাকলে link করো
        const agentUser = await User.findOne({ email: email.toLowerCase() });

        const agent = await Agent.create({
            ownerId: req.user._id,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            role: role || 'agent',
            agentUserId: agentUser?._id || null,
        });

        res.status(201).json({ success: true, agent });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/agents/:agentId ───────────────────────────────
exports.updateAgent = async (req, res) => {
    try {
        const { name, role, active } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (active !== undefined) updates.active = active;

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

// ── DELETE /api/agents/:agentId ──────────────────────────────
exports.deleteAgent = async (req, res) => {
    try {
        const agent = await Agent.findOne({ _id: req.params.agentId, ownerId: req.user._id });
        if (!agent) return res.status(404).json({ message: 'Agent not found' });

        // এই agent এর assigned contact গুলো unassign করো
        await Contact.updateMany({ assignedTo: agent.agentUserId }, { $set: { assignedTo: null } });
        await Agent.deleteOne({ _id: agent._id });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;