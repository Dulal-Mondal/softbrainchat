const MetaChannel = require('../models/MetaChannel.model');
const MetaMessage = require('../models/MetaMessage.model');
const { sendReply, verifyWebhook, extractMessage } = require('../services/metaApi.service');
const { sendMessage: ragSend } = require('../services/langchain.service');

// ── GET /api/meta/channels ────────────────────────────────────
exports.getChannels = async (req, res) => {
    try {
        const channels = await MetaChannel.find({ userId: req.user._id }).sort({ createdAt: -1 });

        // Sensitive fields client এ পাঠাবো না
        const safe = channels.map(c => ({
            _id: c._id,
            platform: c.platform,
            name: c.name,
            pageId: c.pageId,
            phoneNumberId: c.phoneNumberId,
            autoReplyEnabled: c.autoReplyEnabled,
            model: c.model,
            ragEnabled: c.ragEnabled,
            webhookVerifyToken: c.webhookVerifyToken,
            stats: c.stats,
            isActive: c.isActive,
            createdAt: c.createdAt,
        }));

        res.json({ success: true, channels: safe });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/meta/channels ───────────────────────────────────
exports.addChannel = async (req, res) => {
    try {
        const {
            platform, name,
            appId, appSecret, accessToken,
            pageId, phoneNumberId, wabaId,
            model, ragEnabled,
        } = req.body;

        if (!platform || !name || !appId || !appSecret || !accessToken) {
            return res.status(400).json({
                message: 'platform, name, appId, appSecret, accessToken required',
            });
        }

        // Plan limit check
        const existing = await MetaChannel.countDocuments({ userId: req.user._id, isActive: true });
        const limit = req.user.planLimits.metaChannels;

        if (limit !== Infinity && existing >= limit) {
            return res.status(403).json({
                message: `Plan limit: সর্বোচ্চ ${limit}টি Meta channel add করা যাবে`,
                upgrade: true,
            });
        }

        const channel = await MetaChannel.create({
            userId: req.user._id,
            platform, name,
            appId, appSecret, accessToken,
            pageId, phoneNumberId, wabaId,
            model: model || 'gpt-4o',
            ragEnabled: ragEnabled ?? true,
        });

        // Webhook URL generate করো
        const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

        res.status(201).json({
            success: true,
            channel: {
                _id: channel._id,
                platform: channel.platform,
                name: channel.name,
                webhookVerifyToken: channel.webhookVerifyToken,
                webhookUrl: `${baseUrl}/webhook/meta/${channel._id}`,
            },
            message: 'Channel added! Meta console এ webhook URL set করুন।',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/meta/channels/:channelId ──────────────────────
exports.updateChannel = async (req, res) => {
    try {
        const { autoReplyEnabled, model, ragEnabled, name } = req.body;
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: req.user._id });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        if (name !== undefined) channel.name = name;
        if (autoReplyEnabled !== undefined) channel.autoReplyEnabled = autoReplyEnabled;
        if (model !== undefined) channel.model = model;
        if (ragEnabled !== undefined) channel.ragEnabled = ragEnabled;

        await channel.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/meta/channels/:channelId ─────────────────────
exports.deleteChannel = async (req, res) => {
    try {
        await MetaChannel.deleteOne({ _id: req.params.channelId, userId: req.user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/meta/messages ────────────────────────────────────
exports.getMessages = async (req, res) => {
    try {
        const { status, platform, page = 1 } = req.query;
        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (platform) filter.platform = platform;

        const messages = await MetaMessage.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .skip((Number(page) - 1) * 50)
            .populate('channelId', 'name platform');

        const total = await MetaMessage.countDocuments(filter);

        res.json({ success: true, messages, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/meta/messages/:msgId/reply ────────────────────
// Human review করে manual reply পাঠাবে
exports.humanReply = async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply?.trim()) return res.status(400).json({ message: 'reply text required' });

        const msg = await MetaMessage.findOne({ _id: req.params.msgId, userId: req.user._id })
            .populate('channelId');
        if (!msg) return res.status(404).json({ message: 'Message not found' });

        const channel = msg.channelId;

        // Meta API দিয়ে reply পাঠাও
        await sendReply({
            platform: msg.platform,
            channel,
            recipientId: msg.senderId,
            text: reply,
        });

        msg.humanReply = reply;
        msg.finalReply = reply;
        msg.status = 'human_replied';
        msg.replySent = true;
        msg.repliedAt = new Date();
        await msg.save();

        channel.stats.humanReplied += 1;
        await channel.save();

        res.json({ success: true, message: 'Reply sent successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ══ WEBHOOK HANDLERS ══════════════════════════════════════════

// ── GET /webhook/meta/:channelId ─────────────────────────────
// Meta webhook verification
exports.webhookVerify = async (req, res) => {
    try {
        const channel = await MetaChannel.findById(req.params.channelId);
        if (!channel) return res.sendStatus(404);

        const result = verifyWebhook(req.query, channel.webhookVerifyToken);
        if (result.success) {
            return res.status(200).send(result.challenge);
        }
        res.sendStatus(403);
    } catch {
        res.sendStatus(500);
    }
};

// ── POST /webhook/meta/:channelId ────────────────────────────
// Incoming message receive + AI reply trigger
exports.webhookReceive = async (req, res) => {
    // Meta কে তুরন্ত 200 পাঠাও — timeout হলে retry করে
    res.sendStatus(200);

    try {
        const channel = await MetaChannel.findById(req.params.channelId).populate('userId');
        if (!channel || !channel.isActive) return;

        const msgData = extractMessage(req.body, channel.platform);
        if (!msgData?.text) return;

        // Duplicate message check
        const exists = await MetaMessage.findOne({ metaMessageId: msgData.messageId });
        if (exists) return;

        // Message DB তে save করো
        const metaMsg = await MetaMessage.create({
            userId: channel.userId._id,
            channelId: channel._id,
            platform: channel.platform,
            senderId: msgData.senderId,
            senderName: msgData.senderName,
            customerMessage: msgData.text,
            metaMessageId: msgData.messageId,
            status: 'pending',
        });

        channel.stats.totalMessages += 1;
        await channel.save();

        // Auto-reply off থাকলে human review queue এ পাঠাও
        if (!channel.autoReplyEnabled) {
            metaMsg.status = 'review_needed';
            await metaMsg.save();
            return;
        }

        // ── AI reply generate করো ──────────────────────────────
        const user = channel.userId;

        const { answer, sources, cantAnswer } = await ragSend({
            userMessage: msgData.text,
            chatHistory: [],
            userId: user._id.toString(),
            model: channel.model,
            ragEnabled: channel.ragEnabled,
        });

        metaMsg.aiReply = answer;
        metaMsg.sources = sources;
        metaMsg.aiConfident = !cantAnswer;

        // AI উত্তর দিতে পারেনি — human review দরকার
        if (cantAnswer) {
            metaMsg.status = 'review_needed';
            await metaMsg.save();
            console.log(`⚠️  AI can't answer — review needed: ${msgData.messageId}`);
            return;
        }

        // ── Meta API দিয়ে reply পাঠাও ─────────────────────────
        await sendReply({
            platform: channel.platform,
            channel,
            recipientId: msgData.senderId,
            text: answer,
        });

        metaMsg.finalReply = answer;
        metaMsg.status = 'ai_replied';
        metaMsg.replySent = true;
        metaMsg.repliedAt = new Date();
        await metaMsg.save();

        channel.stats.aiReplied += 1;
        await channel.save();

        console.log(`✅ AI replied (${channel.platform}) → ${msgData.senderId}`);
    } catch (err) {
        console.error('Webhook receive error:', err.message);
    }
};