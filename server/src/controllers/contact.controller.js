// const Contact = require('../models/Contact.model');
// const Agent = require('../models/Agent.model');
// const { emitToUser } = require('../config/socket');

// // ── GET /api/contacts ────────────────────────────────────────
// // filter: ?assignedTo=agentId  ?tag=VIP  ?stage=new  ?search=
// exports.getContacts = async (req, res) => {
//     try {
//         const { assignedTo, tag, stage, search } = req.query;
//         const filter = { userId: req.user._id };

//         if (assignedTo) filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
//         if (tag) filter.tags = tag;
//         if (stage) filter['lead.stage'] = stage;
//         if (search) {
//             filter.$or = [
//                 { name: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } },
//             ];
//         }

//         const contacts = await Contact.find(filter)
//             .populate('assignedTo', 'name email')
//             .sort({ lastMessageAt: -1 })
//             .limit(200);

//         res.json({ success: true, contacts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/contacts/:contactId ─────────────────────────────
// exports.getContact = async (req, res) => {
//     try {
//         const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id })
//             .populate('assignedTo', 'name email');
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/contacts/:contactId ───────────────────────────
// // নাম, email, notes, tags update
// exports.updateContact = async (req, res) => {
//     try {
//         const allowed = ['name', 'email', 'phone', 'notes', 'tags'];
//         const updates = {};
//         for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $set: updates },
//             { new: true }
//         ).populate('assignedTo', 'name email');

//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/contacts/:contactId/assign ─────────────────────
// // Conversation একটা agent কে assign করো
// exports.assignContact = async (req, res) => {
//     try {
//         const { agentId } = req.body;   // null হলে unassign

//         const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id });
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });

//         // আগের agent এর count কমাও
//         if (contact.assignedTo) {
//             await Agent.updateOne({ agentUserId: contact.assignedTo }, { $inc: { assignedCount: -1 } });
//         }

//         contact.assignedTo = agentId || null;
//         await contact.save();

//         // নতুন agent কে notify + count বাড়াও
//         if (agentId) {
//             const agent = await Agent.findOne({ _id: agentId });
//             if (agent) {
//                 await Agent.updateOne({ _id: agentId }, { $inc: { assignedCount: 1 } });
//                 // agent এর নিজের login থাকলে তাকে real-time notify করো
//                 if (agent.agentUserId) {
//                     emitToUser(agent.agentUserId, 'contact:assigned', { contact });
//                 }
//             }
//         }

//         const populated = await Contact.findById(contact._id).populate('assignedTo', 'name email');
//         res.json({ success: true, contact: populated });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/contacts/:contactId/stage ─────────────────────
// // Lead stage পরিবর্তন
// exports.updateStage = async (req, res) => {
//     try {
//         const { stage } = req.body;
//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $set: { 'lead.stage': stage } },
//             { new: true }
//         );
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = exports;








// const Contact = require('../models/Contact.model');
// const Agent = require('../models/Agent.model');
// const { emitToUser } = require('../config/socket');

// // ── GET /api/contacts ────────────────────────────────────────
// // filter: ?assignedTo=agentId  ?tag=VIP  ?stage=new  ?search=
// exports.getContacts = async (req, res) => {
//     try {
//         const { assignedTo, tag, stage, search } = req.query;
//         const filter = { userId: req.user._id };

//         if (assignedTo) filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
//         if (tag) filter.tags = tag;
//         if (stage) filter['lead.stage'] = stage;
//         if (search) {
//             filter.$or = [
//                 { name: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } },
//             ];
//         }

//         const contacts = await Contact.find(filter)
//             .populate('assignedTo', 'name email')
//             .sort({ lastMessageAt: -1 })
//             .limit(200);

//         res.json({ success: true, contacts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/contacts/:contactId ─────────────────────────────
// exports.getContact = async (req, res) => {
//     try {
//         const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id })
//             .populate('assignedTo', 'name email');
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/contacts/:contactId ───────────────────────────
// // নাম, email, notes, tags update
// exports.updateContact = async (req, res) => {
//     try {
//         const allowed = ['name', 'email', 'phone', 'notes', 'tags'];
//         const updates = {};
//         for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $set: updates },
//             { new: true }
//         ).populate('assignedTo', 'name email');

//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/contacts/:contactId/assign ─────────────────────
// // Conversation একটা agent কে assign করো
// exports.assignContact = async (req, res) => {
//     try {
//         const { agentId } = req.body;   // null হলে unassign

//         const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id });
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });

//         // আগের agent এর count কমাও
//         if (contact.assignedTo) {
//             await Agent.updateOne({ agentUserId: contact.assignedTo }, { $inc: { assignedCount: -1 } });
//         }

//         // agentId = agent এর User _id (ContactPanel dropdown থেকে)
//         // assignedTo তে User ref save হয়
//         contact.assignedTo = agentId || null;
//         await contact.save();

//         // নতুন agent কে notify + count বাড়াও
//         if (agentId) {
//             // agentId দিয়ে Agent doc খুঁজো — হয় agentUserId, নাহলে _id দিয়ে
//             const agent = await Agent.findOne({
//                 ownerId: req.user._id,
//                 $or: [{ agentUserId: agentId }, { _id: agentId }],
//             });
//             if (agent) {
//                 await Agent.updateOne({ _id: agent._id }, { $inc: { assignedCount: 1 } });
//                 // agent এর নিজের login থাকলে তাকে real-time notify করো
//                 if (agent.agentUserId) {
//                     emitToUser(agent.agentUserId, 'contact:assigned', { contact });
//                 }
//             }
//         }

//         const populated = await Contact.findById(contact._id).populate('assignedTo', 'name email');
//         res.json({ success: true, contact: populated });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/contacts/:contactId/stage ─────────────────────
// // Lead stage পরিবর্তন
// exports.updateStage = async (req, res) => {
//     try {
//         const { stage } = req.body;
//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $set: { 'lead.stage': stage } },
//             { new: true }
//         );
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = exports;






// const Contact = require('../models/Contact.model');
// const Agent = require('../models/Agent.model');
// const { emitToUser } = require('../config/socket');

// // ── GET /api/contacts ────────────────────────────────────────
// // filter: ?assignedTo=agentId  ?tag=VIP  ?stage=new  ?search=
// exports.getContacts = async (req, res) => {
//     try {
//         const { assignedTo, tag, stage, search } = req.query;
//         const filter = { userId: req.user._id };

//         if (assignedTo) filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
//         if (tag) filter.tags = tag;
//         if (stage) filter['lead.stage'] = stage;
//         if (search) {
//             filter.$or = [
//                 { name: { $regex: search, $options: 'i' } },
//                 { phone: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } },
//             ];
//         }

//         const contacts = await Contact.find(filter)
//             .populate('assignedTo', 'name email')
//             .sort({ lastMessageAt: -1 })
//             .limit(200);

//         res.json({ success: true, contacts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/contacts/:contactId ─────────────────────────────
// exports.getContact = async (req, res) => {
//     try {
//         const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id })
//             .populate('assignedTo', 'name email');
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/contacts/:contactId ───────────────────────────
// // নাম, email, notes, tags update
// exports.updateContact = async (req, res) => {
//     try {
//         const allowed = ['name', 'email', 'phone', 'notes', 'tags'];
//         const updates = {};
//         for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $set: updates },
//             { new: true }
//         ).populate('assignedTo', 'name email');

//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/contacts/:contactId/assign ─────────────────────
// // Conversation একটা agent কে assign করো
// exports.assignContact = async (req, res) => {
//     try {
//         const { agentId } = req.body;   // null হলে unassign

//         const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id });
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });

//         // আগের agent এর count কমাও
//         if (contact.assignedTo) {
//             await Agent.updateOne({ agentUserId: contact.assignedTo }, { $inc: { assignedCount: -1 } });
//         }

//         // agentId = agent এর User _id (ContactPanel dropdown থেকে)
//         // assignedTo তে User ref save হয়
//         contact.assignedTo = agentId || null;
//         await contact.save();

//         // নতুন agent কে notify + count বাড়াও
//         if (agentId) {
//             // agentId দিয়ে Agent doc খুঁজো — হয় agentUserId, নাহলে _id দিয়ে
//             const agent = await Agent.findOne({
//                 ownerId: req.user._id,
//                 $or: [{ agentUserId: agentId }, { _id: agentId }],
//             });
//             if (agent) {
//                 await Agent.updateOne({ _id: agent._id }, { $inc: { assignedCount: 1 } });
//                 // agent এর নিজের login থাকলে তাকে real-time notify করো
//                 if (agent.agentUserId) {
//                     emitToUser(agent.agentUserId, 'contact:assigned', { contact });
//                 }
//             }
//         }

//         const populated = await Contact.findById(contact._id).populate('assignedTo', 'name email');
//         res.json({ success: true, contact: populated });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/contacts/:contactId/stage ─────────────────────
// // Lead stage পরিবর্তন
// exports.updateStage = async (req, res) => {
//     try {
//         const { stage } = req.body;
//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $set: { 'lead.stage': stage } },
//             { new: true }
//         );
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/contacts/:contactId/tags ───────────────────────
// // একটা tag যোগ করো
// exports.addTag = async (req, res) => {
//     try {
//         const { tag } = req.body;
//         if (!tag?.trim()) return res.status(400).json({ message: 'tag দরকার' });

//         const clean = tag.trim();
//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $addToSet: { tags: clean } },   // duplicate এড়ায়
//             { new: true }
//         );
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/contacts/:contactId/tags/:tag ────────────────
// // একটা tag মুছো
// exports.removeTag = async (req, res) => {
//     try {
//         const tag = decodeURIComponent(req.params.tag);
//         const contact = await Contact.findOneAndUpdate(
//             { _id: req.params.contactId, userId: req.user._id },
//             { $pull: { tags: tag } },
//             { new: true }
//         );
//         if (!contact) return res.status(404).json({ message: 'Contact not found' });
//         res.json({ success: true, contact });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/contacts/meta/tags ──────────────────────────────
// // এই business এর সব unique tag (filter dropdown এর জন্য)
// exports.getAllTags = async (req, res) => {
//     try {
//         const tags = await Contact.distinct('tags', { userId: req.user._id });
//         res.json({ success: true, tags: tags.filter(Boolean) });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = exports;







const Contact = require('../models/Contact.model');
const Agent = require('../models/Agent.model');
const { emitToUser } = require('../config/socket');

// ── GET /api/contacts ────────────────────────────────────────
// filter: ?assignedTo=agentId  ?tag=VIP  ?stage=new  ?search=
exports.getContacts = async (req, res) => {
    try {
        const { assignedTo, tag, stage, search } = req.query;
        const filter = { userId: req.user._id };

        if (assignedTo) filter.assignedTo = assignedTo === 'unassigned' ? null : assignedTo;
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
            .limit(200);

        res.json({ success: true, contacts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/contacts/:contactId ─────────────────────────────
exports.getContact = async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id })
            .populate('assignedTo', 'name email');
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/contacts/:contactId ───────────────────────────
// নাম, email, notes, tags update
exports.updateContact = async (req, res) => {
    try {
        const allowed = ['name', 'email', 'phone', 'notes', 'tags'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: req.user._id },
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
// Conversation একটা agent কে assign করো
exports.assignContact = async (req, res) => {
    try {
        const { agentId } = req.body;   // null হলে unassign

        const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id });
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        // আগের agent এর count কমাও
        if (contact.assignedTo) {
            await Agent.updateOne({ agentUserId: contact.assignedTo }, { $inc: { assignedCount: -1 } });
        }

        // agentId = agent এর User _id (ContactPanel dropdown থেকে)
        // assignedTo তে User ref save হয়
        contact.assignedTo = agentId || null;
        await contact.save();

        // নতুন agent কে notify + count বাড়াও
        if (agentId) {
            // agentId দিয়ে Agent doc খুঁজো — হয় agentUserId, নাহলে _id দিয়ে
            const agent = await Agent.findOne({
                ownerId: req.user._id,
                $or: [{ agentUserId: agentId }, { _id: agentId }],
            });
            if (agent) {
                await Agent.updateOne({ _id: agent._id }, { $inc: { assignedCount: 1 } });
                // agent এর নিজের login থাকলে তাকে real-time notify করো
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
// Lead stage পরিবর্তন
exports.updateStage = async (req, res) => {
    try {
        const { stage } = req.body;
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: req.user._id },
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
// একটা tag যোগ করো
exports.addTag = async (req, res) => {
    try {
        const { tag } = req.body;
        if (!tag?.trim()) return res.status(400).json({ message: 'tag দরকার' });

        const clean = tag.trim();
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: req.user._id },
            { $addToSet: { tags: clean } },   // duplicate এড়ায়
            { new: true }
        );
        if (!contact) return res.status(404).json({ message: 'Contact not found' });
        res.json({ success: true, contact });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/contacts/:contactId/tags/:tag ────────────────
// একটা tag মুছো
exports.removeTag = async (req, res) => {
    try {
        const tag = decodeURIComponent(req.params.tag);
        const contact = await Contact.findOneAndUpdate(
            { _id: req.params.contactId, userId: req.user._id },
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
// এই business এর সব unique tag (filter dropdown এর জন্য)
exports.getAllTags = async (req, res) => {
    try {
        const tags = await Contact.distinct('tags', { userId: req.user._id });
        res.json({ success: true, tags: tags.filter(Boolean) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/contacts/:contactId/analyze ────────────────────
// AI দিয়ে conversation analyze করে lead data বের করো
exports.analyzeLead = async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.contactId, userId: req.user._id });
        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        // lead analysis service optional
        let analyzeLeadFromConversation = null;
        try {
            ({ analyzeLeadFromConversation } = require('../services/leadQualification.service'));
        } catch (e) {
            return res.status(503).json({ message: 'Lead analysis service unavailable' });
        }

        // এই contact এর conversation নাও
        const MetaMessage = require('../models/MetaMessage.model');
        const msgs = await MetaMessage.find({
            userId: req.user._id,
            senderId: contact.senderId,
            channelId: contact.channelId,
        }).sort({ createdAt: 1 }).limit(50);

        // chat bubble format এ পরিণত করো
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

        // Contact এ save করো
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

module.exports = exports;