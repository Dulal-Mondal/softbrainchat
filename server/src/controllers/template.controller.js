const MetaChannel = require('../models/MetaChannel.model');
const Contact = require('../models/Contact.model');
const Broadcast = require('../models/Broadcast.model');
const MetaMessage = require('../models/MetaMessage.model');   // inbox record এর জন্য
const { getTemplates, getApprovedTemplates, createTemplate, deleteTemplate, sendTemplate } = require('../services/templateApi.service');
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

        const templates = await getApprovedTemplates({ wabaId: channel.wabaId, accessToken: channel.accessToken });
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

// ── GET /api/templates/:channelId/all ────────────────────────
// সব template + status (PENDING/APPROVED/REJECTED) — status page এর জন্য
exports.getAllChannelTemplates = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        if (!checkChannelAccess(ctx, req.params.channelId)) {
            return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
        }
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!channel.wabaId) {
            return res.status(400).json({ message: 'এই channel এ WABA ID সেট করা নেই।' });
        }

        const templates = await getTemplates({ wabaId: channel.wabaId, accessToken: channel.accessToken });
        res.json({ success: true, templates });
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        res.status(500).json({ message: detail });
    }
};

// ── POST /api/templates/:channelId/create ────────────────────
// নতুন template Meta তে submit করো
exports.createChannelTemplate = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        if (!checkChannelAccess(ctx, req.params.channelId)) {
            return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
        }
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });
        if (!channel.wabaId) {
            return res.status(400).json({ message: 'এই channel এ WABA ID সেট করা নেই।' });
        }

        const { name, category, language, headerText, bodyText, footerText, buttons } = req.body;

        if (!name?.trim() || !bodyText?.trim()) {
            return res.status(400).json({ message: 'নাম এবং body text দরকার' });
        }

        // Meta এর নিয়ম: name lowercase + underscore
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

        // components তৈরি করো
        const components = [];

        // Header (optional — text)
        if (headerText?.trim()) {
            components.push({ type: 'HEADER', format: 'TEXT', text: headerText.trim() });
        }

        // Body (required)
        const bodyComp = { type: 'BODY', text: bodyText.trim() };
        // body তে variable থাকলে example দিতে হয় (Meta চায়)
        const varCount = new Set((bodyText.match(/\{\{\d+\}\}/g) || [])).size;
        if (varCount > 0) {
            bodyComp.example = {
                body_text: [Array.from({ length: varCount }, (_, i) => `example${i + 1}`)],
            };
        }
        components.push(bodyComp);

        // Footer (optional)
        if (footerText?.trim()) {
            components.push({ type: 'FOOTER', text: footerText.trim() });
        }

        // Buttons (optional) — [{type, text, url/phone}]
        if (Array.isArray(buttons) && buttons.length > 0) {
            const btnComps = buttons.filter(b => b.text?.trim()).map(b => {
                if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url || 'https://example.com' };
                if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phone || '' };
                return { type: 'QUICK_REPLY', text: b.text };
            });
            if (btnComps.length) components.push({ type: 'BUTTONS', buttons: btnComps });
        }

        const result = await createTemplate({
            wabaId: channel.wabaId,
            accessToken: channel.accessToken,
            name: cleanName,
            category: category || 'MARKETING',
            language: language || 'en',
            components,
        });

        res.status(201).json({
            success: true,
            template: result,
            message: 'Template submit করা হয়েছে! Meta review করছে (কয়েক মিনিট - কয়েক ঘণ্টা)।',
        });
    } catch (err) {
        const detail = err.response?.data?.error?.error_user_msg
            || err.response?.data?.error?.message
            || err.message;
        res.status(400).json({ message: detail });
    }
};

// ── DELETE /api/templates/:channelId/:templateName ───────────
exports.deleteChannelTemplate = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        // agent delete করতে পারবে না — শুধু owner
        if (ctx.isAgent) {
            return res.status(403).json({ message: 'শুধু admin template মুছতে পারে' });
        }
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        await deleteTemplate({
            wabaId: channel.wabaId,
            accessToken: channel.accessToken,
            name: req.params.templateName,
        });
        res.json({ success: true, message: 'Template মুছে ফেলা হয়েছে' });
    } catch (err) {
        const metaErr = err.response?.data?.error;
        const detail = metaErr?.error_user_msg || metaErr?.message || err.message;
        console.error('Template delete error:', metaErr || err.message);
        res.status(500).json({ message: `Delete ব্যর্থ: ${detail}` });
    }
};

module.exports = exports;