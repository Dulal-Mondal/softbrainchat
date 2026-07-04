const MetaChannel = require('../models/MetaChannel.model');
const Contact = require('../models/Contact.model');
const Broadcast = require('../models/Broadcast.model');
const MetaMessage = require('../models/MetaMessage.model');   // inbox record এর জন্য
const { getTemplates, sendTemplate } = require('../services/templateApi.service');
const { emitToUser } = require('../config/socket');

// agent context — না থাকলেও crash করবে না
let resolveContext = async (user) => ({ isAgent: false, ownerId: user._id, agentUserId: null });
try { ({ resolveContext } = require('../utils/agentContext')); } catch (e) { /* helper not installed */ }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// agent হলে channel access check করার helper
function checkChannelAccess(ctx, channelId) {
    if (ctx.isAgent && ctx.agentDoc?.allowedChannels?.length) {
        const allowed = ctx.agentDoc.allowedChannels.map(String);
        return allowed.includes(String(channelId));
    }
    return true;   // owner বা allowedChannels খালি হলে সব access
}

// ── GET /api/templates/:channelId ────────────────────────────
// একটা WhatsApp channel এর approved template গুলো (admin এর channel থেকে)
exports.getChannelTemplates = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);

        // agent হলে — এই channel এ access আছে কিনা
        if (!checkChannelAccess(ctx, req.params.channelId)) {
            return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
        }

        // channel টা owner এর (agent owner এর channel এর template দেখবে)
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        if (channel.platform !== 'whatsapp') {
            return res.status(400).json({ message: 'Template শুধু WhatsApp এ কাজ করে' });
        }
        if (!channel.wabaId) {
            return res.status(400).json({ message: 'এই channel এ WABA ID সেট করা নেই। Channel edit করে WABA ID যোগ করুন।' });
        }

        const templates = await getTemplates({ wabaId: channel.wabaId, accessToken: channel.accessToken });
        res.json({ success: true, templates });
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        res.status(500).json({ message: detail });
    }
};

// ── POST /api/templates/broadcast ────────────────────────────
exports.sendTemplateBroadcast = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { name, channelId, targetTag, targetTags, templateName, language, variableMapping, templateBody } = req.body;

        if (!templateName) return res.status(400).json({ message: 'Template select করুন' });

        // agent হলে channel access check
        if (!checkChannelAccess(ctx, channelId)) {
            return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        const filter = { userId: ctx.ownerId, channelId };
        const tags = targetTags?.length ? targetTags : (targetTag ? [targetTag] : []);
        if (tags.length) filter.tags = { $in: tags };
        const contacts = await Contact.find(filter).select('senderId name phone');

        if (contacts.length === 0) {
            return res.status(400).json({ message: 'কোনো recipient নেই' });
        }

        const broadcast = await Broadcast.create({
            userId: ctx.ownerId,
            name: name || `Template Broadcast ${new Date().toLocaleDateString()}`,
            message: `[Template: ${templateName}]`,
            channelId,
            platform: 'whatsapp',
            targetTag: tags.join(', ') || '',
            status: 'sending',
            totalRecipients: contacts.length,
            startedAt: new Date(),
        });

        res.json({ success: true, broadcast });

        processTemplateBroadcast(broadcast, contacts, channel, {
            templateName, language, variableMapping: variableMapping || {}, templateBody,
        }, ctx.ownerId);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Background template sender ───────────────────────────────
async function processTemplateBroadcast(broadcast, contacts, channel, opts, userId) {
    const { templateName, language, variableMapping, templateBody } = opts;
    const DELAY_MS = 150;

    const varKeys = Object.keys(variableMapping).sort((a, b) => Number(a) - Number(b));

    for (const contact of contacts) {
        try {
            const variables = varKeys.map(key => {
                const mapped = variableMapping[key];
                if (mapped === 'name') return contact.name || 'Customer';
                if (mapped === 'phone') return contact.phone || '';
                return mapped;
            });

            await sendTemplate({
                phoneNumberId: channel.phoneNumberId,
                accessToken: channel.accessToken,
                to: contact.senderId,
                templateName,
                language,
                variables,
            });
            broadcast.sentCount += 1;

            // ── Inbox এ record — পাঠানো template message দেখাবে ──
            try {
                // template এর আসল text বানাও (variable বসিয়ে)
                let displayText = templateBody || `[Template: ${templateName}]`;
                variables.forEach((v, i) => {
                    displayText = displayText.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), v);
                });

                await MetaMessage.create({
                    userId,
                    channelId: channel._id,
                    platform: 'whatsapp',
                    senderId: contact.senderId,
                    senderName: contact.name || 'Customer',
                    customerMessage: '[Broadcast]',
                    messageType: 'text',
                    metaMessageId: `tpl-${broadcast._id}-${contact.senderId}-${Date.now()}`,
                    finalReply: displayText,
                    status: 'human_replied',
                    replySent: true,
                    repliedAt: new Date(),
                    humanRepliedBy: {
                        name: `📋 Template: ${templateName}`,
                        repliedAt: new Date(),
                    },
                });

                await Contact.updateOne(
                    { userId, senderId: contact.senderId, channelId: channel._id },
                    { $set: { lastMessageAt: new Date(), lastMessageText: `📋 ${displayText.slice(0, 50)}` } }
                );
            } catch (recErr) { /* record fail হলেও চলবে */ }
        } catch (err) {
            broadcast.failedCount += 1;
            broadcast.errors.push({
                senderId: contact.senderId,
                error: (err.response?.data?.error?.message || err.message)?.slice(0, 200),
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