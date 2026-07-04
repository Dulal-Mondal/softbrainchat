const Contact = require('../models/Contact.model');
const Agent = require('../models/Agent.model');
const { emitToUser } = require('../config/socket');

// agent context helper
let resolveContext = async (user) => ({ isAgent: false, ownerId: user._id, agentUserId: null, allowedChannels: [], accessMode: 'all' });
try { ({ resolveContext } = require('../utils/agentContext')); } catch (e) { /* helper not installed */ }

// ── Agent এর contact filter তৈরি করো ─────────────────────────
// agent হলে: allowed channel এর সব contact (import করা সহ)
//            accessMode='assigned' হলে শুধু assigned
function buildAgentFilter(ctx, baseFilter) {
    if (!ctx.isAgent) return baseFilter;

    // allowed channel এর contact (খালি হলে সব channel)
    if (ctx.allowedChannels?.length) {
        baseFilter.channelId = { $in: ctx.allowedChannels };
    }

    // accessMode = 'assigned' → শুধু assigned contact
    if (ctx.accessMode === 'assigned') {
        baseFilter.assignedTo = ctx.agentUserId;
    }
    // accessMode = 'channel' → channel এর সব (উপরে channelId filter)

    return baseFilter;
}

// ── GET /api/contacts ────────────────────────────────────────
exports.getContacts = async (req, res) => {
    try {
        const { assignedTo, tag, stage, search, channelId } = req.query;
        const ctx = await resolveContext(req.user);

        let filter = { userId: ctx.ownerId };

        // owner filter করতে পারে
        if (!ctx.isAgent) {
            if (assignedTo) filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
        }

        // agent access filter (channel-ভিত্তিক)
        filter = buildAgentFilter(ctx, filter);

        // channel filter (dropdown থেকে)
        if (channelId) filter.channelId = channelId;
        if (tag) filter.tags = tag;
        if (stage) filter['lead.stage'] = stage;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const contacts = await Contact.find(filter)
            .populate('assignedTo', 'name email')
            .sort({ lastMessageAt: -1 })
            .limit(500);

        res.json({ success: true, contacts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/contacts/:contactId ─────────────────────────────
exports.getContact = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: ctx.ownerId })
            .populate('assignedTo', 'name email');
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        // agent হলে — এই contact এর channel access আছে কিনা
        if (ctx.isAgent && ctx.allowedChannels?.length) {
            const allowed = ctx.allowedChannels.map(String);
            if (!allowed.includes(String(contact.channelId))) {
                return res.status(403).json({ message: 'এই contact এ আপনার access নেই' });
            }
        }

        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/contacts/:contactId ───────────────────────────
exports.updateContact = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const allowed = ['name', 'email', 'phone', 'notes', 'tags'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: ctx.ownerId },
            { $set: updates },
            { new: true }
        ).populate('assignedTo', 'name email');

        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/contacts/:contactId/assign ─────────────────────
// শুধু owner assign করতে পারবে
exports.assignContact = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        if (ctx.isAgent) {
            return res.status(403).json({ message: 'শুধু admin conversation assign করতে পারে' });
        }

        const { agentId } = req.body;

        const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id });
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        if (contact.assignedTo) {
            await Agent.updateOne({ agentUserId: contact.assignedTo }, { $inc: { assignedCount: -1 } });
        }

        contact.assignedTo = agentId || null;
        await contact.save();

        if (agentId) {
            const agent = await Agent.findOne({
                ownerId: req.user._id,
                $or: [{ agentUserId: agentId }, { _id: agentId }],
            });
            if (agent) {
                await Agent.updateOne({ _id: agent._id }, { $inc: { assignedCount: 1 } });
                if (agent.agentUserId) {
                    emitToUser(agent.agentUserId, 'contact:assigned', { contact });
                }
            }
        }

        const populated = await Contact.findById(contact._id).populate('assignedTo', 'name email');
        res.json({ success: true, contact: populated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/contacts/:contactId/stage ─────────────────────
exports.updateStage = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { stage } = req.body;
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: ctx.ownerId },
            { $set: { 'lead.stage': stage } },
            { new: true }
        );
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/contacts/:contactId/tags ───────────────────────
// admin ও agent দুজনেই tag দিতে পারবে
exports.addTag = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { tag } = req.body;
        if (!tag?.trim()) return res.status(400).json({ message: 'tag দরকার' });

        const clean = tag.trim();
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: ctx.ownerId },
            { $addToSet: { tags: clean } },
            { new: true }
        );
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/contacts/:contactId/tags/:tag ────────────────
exports.removeTag = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const tag = decodeURIComponent(req.params.tag);
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: ctx.ownerId },
            { $pull: { tags: tag } },
            { new: true }
        );
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/contacts/meta/tags ──────────────────────────────
// admin ও agent — owner এর সব tag (agent allowed channel এর)
exports.getAllTags = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        let filter = { userId: ctx.ownerId };
        // agent হলে allowed channel এর contact এর tag
        if (ctx.isAgent && ctx.allowedChannels?.length) {
            filter.channelId = { $in: ctx.allowedChannels };
        }
        const tags = await Contact.distinct('tags', filter);
        res.json({ success: true, tags: tags.filter(Boolean) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/contacts/:contactId/analyze ────────────────────
exports.analyzeLead = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: ctx.ownerId });
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        let analyzeLeadFromConversation = null;
        try {
            ({ analyzeLeadFromConversation } = require('../services/leadQualification.service'));
        } catch (e) {
            return res.status(503).json({ message: 'Lead analysis service unavailable' });
        }

        const MetaMessage = require('../models/MetaMessage.model');
        const msgs = await MetaMessage.find({
            userId: ctx.ownerId,
            senderId: contact.senderId,
            channelId: contact.channelId,
        }).sort({ createdAt: 1 }).limit(50);

        const bubbles = [];
        for (const m of msgs) {
            if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
                bubbles.push({ from: 'customer', text: m.customerMessage });
            }
            if (m.finalReply) {
                bubbles.push({ from: 'ai', text: m.finalReply });
            }
        }

        const result = await analyzeLeadFromConversation(bubbles);
        if (!result) {
            return res.status(400).json({ message: 'যথেষ্ট conversation নেই analyze করার জন্য' });
        }

        contact.lead.problem = result.problem;
        contact.lead.urgency = result.urgency;
        contact.lead.budget = result.budget;
        contact.lead.interest = result.interest;
        contact.lead.summary = result.summary;
        contact.lead.score = result.score;
        contact.lead.analyzedAt = new Date();
        await contact.save();

        res.json({ success: true, contact, lead: contact.lead });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/contacts/:contactId/extract ────────────────────
exports.extractCustomData = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: ctx.ownerId });
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        let CrmConfig = null, extractCustomData = null;
        try {
            CrmConfig = require('../models/CrmConfig.model');
            ({ extractCustomData } = require('../services/crmExtract.service'));
        } catch (e) {
            return res.status(503).json({ message: 'CRM extract service unavailable' });
        }

        const config = await CrmConfig.findOne({ userId: ctx.ownerId });
        if (!config || !config.fields?.length) {
            return res.status(400).json({ message: 'আগে CRM Setup এ column define করুন' });
        }

        const MetaMessage = require('../models/MetaMessage.model');
        const msgs = await MetaMessage.find({
            userId: ctx.ownerId,
            senderId: contact.senderId,
            channelId: contact.channelId,
        }).sort({ createdAt: 1 }).limit(50);

        const bubbles = [];
        for (const m of msgs) {
            if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
                bubbles.push({ from: 'customer', text: m.customerMessage });
            }
            if (m.finalReply) bubbles.push({ from: 'ai', text: m.finalReply });
        }

        const extracted = await extractCustomData(config.fields, bubbles);

        contact.customData = { ...(contact.customData || {}), ...extracted };
        contact.markModified('customData');
        await contact.save();

        res.json({ success: true, customData: contact.customData });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/contacts/:contactId/custom ─────────────────────
exports.updateCustomData = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { customData } = req.body;
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: ctx.ownerId });
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        contact.customData = { ...(contact.customData || {}), ...customData };
        contact.markModified('customData');
        await contact.save();

        res.json({ success: true, customData: contact.customData });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;