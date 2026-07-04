const MetaMessage = require('../models/MetaMessage.model');
const MetaChannel = require('../models/MetaChannel.model');
const { sendReply } = require('../services/metaApi.service');
const { emitToUser } = require('../config/socket');

// imageUpload.service optional
let uploadBase64 = async () => '';
try {
    ({ uploadBase64 } = require('../services/imageUpload.service'));
} catch (e) {
    console.warn('⚠️ imageUpload.service not found — image sending disabled');
}

// Contact + agent context optional
let Contact = null;
let resolveContext = async (user) => ({ isAgent: false, ownerId: user._id, agentUserId: null, accessMode: 'all', allowedChannels: [] });
try { Contact = require('../models/Contact.model'); } catch (e) { /* CRM not installed */ }
try { ({ resolveContext } = require('../utils/agentContext')); } catch (e) { /* helper not installed */ }

// ── GET /api/conversations ───────────────────────────────────
// owner: সব conversation
// agent + accessMode 'channel': allowedChannels এর সব message
// agent + accessMode 'assigned': শুধু assigned conversation
exports.getConversations = async (req, res) => {
    try {
        const { platform, search, tag } = req.query;
        const ctx = await resolveContext(req.user);

        const match = { userId: ctx.ownerId };
        if (platform && platform !== 'all') match.platform = platform;

        // ── Agent এর access ──
        if (ctx.isAgent) {
            // agent এর allowed channel গুলো (খালি হলে সব channel)
            if (ctx.allowedChannels?.length) {
                match.channelId = { $in: ctx.allowedChannels };
            }

            // accessMode = 'assigned' → শুধু assigned conversation
            if (ctx.accessMode === 'assigned' && Contact) {
                const myContacts = await Contact.find({
                    userId: ctx.ownerId,
                    assignedTo: ctx.agentUserId,
                }).select('senderId');
                const assignedSenderIds = myContacts.map(c => c.senderId);
                if (assignedSenderIds.length === 0) {
                    return res.json({ success: true, conversations: [], isAgent: true, accessMode: 'assigned' });
                }
                match.senderId = { $in: assignedSenderIds };
            }
            // accessMode = 'channel' → allowedChannels এর সব message (উপরে channelId filter করা আছে)
        }

        // ── Tag filter ──
        if (tag && Contact) {
            const tagged = await Contact.find({ userId: ctx.ownerId, tags: tag }).select('senderId');
            const taggedIds = tagged.map(c => c.senderId);
            if (taggedIds.length === 0) {
                return res.json({ success: true, conversations: [] });
            }
            if (match.senderId?.$in) {
                match.senderId.$in = match.senderId.$in.filter(id => taggedIds.includes(id));
            } else {
                match.senderId = { $in: taggedIds };
            }
        }

        const pipeline = [
            { $match: match },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: { senderId: '$senderId', channelId: '$channelId' },
                    lastMessage: { $first: '$$ROOT' },
                    messageCount: { $sum: 1 },
                    unreadCount: { $sum: { $cond: [{ $eq: ['$status', 'review_needed'] }, 1, 0] } },
                },
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $limit: 100 },
        ];

        let conversations = await MetaMessage.aggregate(pipeline);

        conversations = conversations.map(c => ({
            senderId: c._id.senderId,
            channelId: c._id.channelId,
            platform: c.lastMessage.platform,
            senderName: c.lastMessage.senderName,
            senderProfilePic: c.lastMessage.senderProfilePic,
            lastMessage: {
                text: c.lastMessage.finalReply || c.lastMessage.customerMessage,
                fromAI: !!c.lastMessage.finalReply,
                createdAt: c.lastMessage.createdAt,
                status: c.lastMessage.status,
            },
            messageCount: c.messageCount,
            unreadCount: c.unreadCount,
        }));

        if (search) {
            const s = search.toLowerCase();
            conversations = conversations.filter(c =>
                c.senderName?.toLowerCase().includes(s) || c.senderId?.includes(s)
            );
        }

        res.json({ success: true, conversations });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/conversations/:senderId/:channelId ──────────────
exports.getConversation = async (req, res) => {
    try {
        const { senderId, channelId } = req.params;
        const ctx = await resolveContext(req.user);

        // Agent access check
        if (ctx.isAgent) {
            // channel access — allowedChannels এ আছে কিনা
            if (ctx.allowedChannels?.length) {
                const allowed = ctx.allowedChannels.map(String);
                if (!allowed.includes(String(channelId))) {
                    return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
                }
            }
            // accessMode 'assigned' হলে — এই conversation assigned কিনা
            if (ctx.accessMode === 'assigned' && Contact) {
                const c = await Contact.findOne({ userId: ctx.ownerId, senderId, channelId });
                if (!c || String(c.assignedTo) !== String(ctx.agentUserId)) {
                    return res.status(403).json({ message: 'এই conversation আপনাকে assign করা হয়নি' });
                }
            }
            // accessMode 'channel' হলে — channel access থাকলেই দেখতে পারবে
        }

        const messages = await MetaMessage.find({
            userId: ctx.ownerId,
            senderId,
            channelId,
        }).sort({ createdAt: 1 });

        const bubbles = [];
        for (const m of messages) {
            if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
                bubbles.push({
                    _id: m._id + '_in',
                    from: 'customer',
                    text: m.customerMessage,
                    type: m.messageType,
                    createdAt: m.createdAt,
                });
            }
            if (m.finalReply) {
                bubbles.push({
                    _id: m._id + '_out',
                    from: m.status === 'human_replied' ? 'human' : 'ai',
                    text: m.finalReply,
                    repliedBy: m.humanRepliedBy?.name || (m.status === 'human_replied' ? 'Agent' : 'AI'),
                    createdAt: m.repliedAt || m.createdAt,
                    status: m.status,
                });
            }
        }

        const first = messages[0];
        let contact = null;
        if (first) {
            let ContactModel = null;
            try { ContactModel = require('../models/Contact.model'); } catch (e) { /* CRM not installed */ }

            let dbContact = null;
            if (ContactModel) {
                dbContact = await ContactModel.findOne({ userId: ctx.ownerId, senderId, channelId })
                    .populate('assignedTo', 'name email');
            }

            contact = {
                _id: dbContact?._id || null,
                senderId,
                channelId,
                platform: first.platform,
                name: dbContact?.name || first.senderName,
                profilePic: dbContact?.profilePic || first.senderProfilePic,
                phone: dbContact?.phone || (first.platform === 'whatsapp' ? senderId : ''),
                email: dbContact?.email || '',
                notes: dbContact?.notes || '',
                tags: dbContact?.tags || [],
                assignedTo: dbContact?.assignedTo || null,
                lead: dbContact?.lead || { stage: 'new' },
                customData: dbContact?.customData || {},
            };
        }

        res.json({ success: true, contact, messages: bubbles });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/conversations/:senderId/:channelId/reply ───────
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, channelId } = req.params;
        const { text, imageBase64, imageMimeType } = req.body;

        if (!text?.trim() && !imageBase64) {
            return res.status(400).json({ message: 'text অথবা image দরকার' });
        }

        const ctx = await resolveContext(req.user);

        // Agent access check
        if (ctx.isAgent) {
            if (ctx.allowedChannels?.length) {
                const allowed = ctx.allowedChannels.map(String);
                if (!allowed.includes(String(channelId))) {
                    return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
                }
            }
            if (ctx.accessMode === 'assigned' && Contact) {
                const c = await Contact.findOne({ userId: ctx.ownerId, senderId, channelId });
                if (!c || String(c.assignedTo) !== String(ctx.agentUserId)) {
                    return res.status(403).json({ message: 'এই conversation আপনাকে assign করা হয়নি' });
                }
            }
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        let imageUrl = '';
        if (imageBase64) {
            imageUrl = await uploadBase64(imageBase64, imageMimeType || 'image/jpeg', 'softbrainchat/sent');
        }

        const replyText = text?.trim() || '';
        if (replyText) {
            await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: replyText });
        }
        if (imageUrl) {
            await sendReply({ platform: channel.platform, channel, recipientId: senderId, imageUrl });
        }

        const finalText = replyText + (imageUrl ? `\n${imageUrl}` : '');
        const msg = await MetaMessage.create({
            userId: ctx.ownerId,
            channelId,
            platform: channel.platform,
            senderId,
            senderName: 'Customer',
            customerMessage: '[Agent initiated]',
            messageType: 'text',
            metaMessageId: `manual-${Date.now()}`,
            finalReply: finalText,
            humanReply: finalText,
            status: 'human_replied',
            replySent: true,
            repliedAt: new Date(),
            humanRepliedBy: {
                userId: req.user._id,
                name: req.user.name,
                email: req.user.email,
                photo: req.user.photo || '',
                repliedAt: new Date(),
            },
        });

        emitToUser(ctx.ownerId, 'meta:message_updated', { message: msg });
        if (ctx.isAgent) emitToUser(ctx.agentUserId, 'meta:message_updated', { message: msg });

        res.json({ success: true, imageUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;