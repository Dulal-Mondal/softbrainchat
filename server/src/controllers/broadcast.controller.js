const Broadcast = require('../models/Broadcast.model');
const Contact = require('../models/Contact.model');
const MetaChannel = require('../models/MetaChannel.model');
const MetaMessage = require('../models/MetaMessage.model');   // inbox record এর জন্য
const { sendReply } = require('../services/metaApi.service');
const { emitToUser } = require('../config/socket');

// agent context — না থাকলেও crash করবে না
let resolveContext = async (user) => ({ isAgent: false, ownerId: user._id, agentUserId: null });
try { ({ resolveContext } = require('../utils/agentContext')); } catch (e) { /* helper not installed */ }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── GET /api/broadcasts ──────────────────────────────────────
exports.getBroadcasts = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const broadcasts = await Broadcast.find({ userId: ctx.ownerId })
            .populate('channelId', 'name platform')
            .sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, broadcasts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/broadcasts/preview ─────────────────────────────
exports.previewBroadcast = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { channelId, targetTag, targetTags } = req.body;

        // agent হলে — শুধু allowed channel এ broadcast করতে পারবে
        if (ctx.isAgent && ctx.agentDoc?.allowedChannels?.length) {
            const allowed = ctx.agentDoc.allowedChannels.map(String);
            if (!allowed.includes(String(channelId))) {
                return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
            }
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        const filter = { userId: ctx.ownerId, channelId };
        const tags = targetTags?.length ? targetTags : (targetTag ? [targetTag] : []);
        if (tags.length) filter.tags = { $in: tags };

        const count = await Contact.countDocuments(filter);
        res.json({ success: true, count, platform: channel.platform });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/broadcasts ─────────────────────────────────────
exports.sendBroadcast = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { name, message, imageUrl, channelId, targetTag, targetTags } = req.body;

        if (!message?.trim() && !imageUrl) {
            return res.status(400).json({ message: 'message অথবা image দরকার' });
        }

        // agent হলে — শুধু allowed channel
        if (ctx.isAgent && ctx.agentDoc?.allowedChannels?.length) {
            const allowed = ctx.agentDoc.allowedChannels.map(String);
            if (!allowed.includes(String(channelId))) {
                return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
            }
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        const filter = { userId: ctx.ownerId, channelId };
        const tags = targetTags?.length ? targetTags : (targetTag ? [targetTag] : []);
        if (tags.length) filter.tags = { $in: tags };
        const contacts = await Contact.find(filter).select('senderId name');

        if (contacts.length === 0) {
            return res.status(400).json({ message: 'কোনো recipient নেই' });
        }

        const broadcast = await Broadcast.create({
            userId: ctx.ownerId,   // owner এর অধীনে save
            name: name || `Broadcast ${new Date().toLocaleDateString()}`,
            message: message || '',
            imageUrl: imageUrl || '',
            channelId,
            platform: channel.platform,
            targetTag: tags.join(', ') || '',
            status: 'sending',
            totalRecipients: contacts.length,
            startedAt: new Date(),
        });

        res.json({ success: true, broadcast });

        // background sender — owner কে real-time update (agent হলেও owner এর socket)
        processBroadcast(broadcast, contacts, channel, ctx.ownerId);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Background sender ────────────────────────────────────────
async function processBroadcast(broadcast, contacts, channel, userId) {
    const DELAY_MS = 120;

    for (const contact of contacts) {
        try {
            if (broadcast.imageUrl) {
                await sendReply({
                    platform: channel.platform, channel,
                    recipientId: contact.senderId,
                    imageUrl: broadcast.imageUrl,
                    caption: broadcast.message,
                });
            } else {
                await sendReply({
                    platform: channel.platform, channel,
                    recipientId: contact.senderId,
                    text: broadcast.message,
                });
            }
            broadcast.sentCount += 1;

            // ── Inbox এ record তৈরি করো (customer conversation এ দেখাবে) ──
            try {
                const sentText = broadcast.message + (broadcast.imageUrl ? `\n${broadcast.imageUrl}` : '');
                await MetaMessage.create({
                    userId,
                    channelId: channel._id,
                    platform: channel.platform,
                    senderId: contact.senderId,
                    senderName: contact.name || 'Customer',
                    customerMessage: '[Broadcast]',
                    messageType: broadcast.imageUrl ? 'image' : 'text',
                    metaMessageId: `broadcast-${broadcast._id}-${contact.senderId}-${Date.now()}`,
                    finalReply: sentText,
                    status: 'human_replied',
                    replySent: true,
                    repliedAt: new Date(),
                    humanRepliedBy: {
                        name: `📢 Broadcast: ${broadcast.name}`,
                        repliedAt: new Date(),
                    },
                });

                // Contact এর lastMessage update করো (inbox এ উপরে আসবে)
                await Contact.updateOne(
                    { userId, senderId: contact.senderId, channelId: channel._id },
                    { $set: { lastMessageAt: new Date(), lastMessageText: `📢 ${broadcast.message.slice(0, 50)}` } }
                );
            } catch (recErr) { /* record fail হলেও broadcast চলবে */ }

        } catch (err) {
            broadcast.failedCount += 1;
            broadcast.errors.push({
                senderId: contact.senderId,
                error: err.message?.slice(0, 200) || 'unknown',
            });
        }

        if ((broadcast.sentCount + broadcast.failedCount) % 5 === 0) {
            await broadcast.save();
            emitToUser(userId, 'broadcast:progress', {
                broadcastId: broadcast._id,
                sent: broadcast.sentCount,
                failed: broadcast.failedCount,
                total: broadcast.totalRecipients,
            });
        }

        await sleep(DELAY_MS);
    }

    broadcast.status = 'completed';
    broadcast.completedAt = new Date();
    await broadcast.save();

    emitToUser(userId, 'broadcast:done', {
        broadcastId: broadcast._id,
        sent: broadcast.sentCount,
        failed: broadcast.failedCount,
        total: broadcast.totalRecipients,
    });
}

module.exports = exports;