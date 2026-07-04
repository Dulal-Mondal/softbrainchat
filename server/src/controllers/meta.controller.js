const MetaChannel = require('../models/MetaChannel.model');
const MetaMessage = require('../models/MetaMessage.model');
const { sendReply, verifyWebhook, extractMessage, getSenderProfile } = require('../services/metaApi.service');
const { sendMessage: ragSend } = require('../services/langchain.service');
const { searchSimilar } = require('../services/vectorStore.service');
const { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl } = require('../services/vision.service');
const { handleOrderFlow } = require('../services/orderFlow.service');
const { emitToUser } = require('../config/socket');

// Contact model optional — না থাকলেও crash করবে না
let Contact = null;
try { Contact = require('../models/Contact.model'); } catch (e) { /* CRM not installed yet */ }

// imageUpload.service optional — না থাকলেও crash করবে না
let uploadBase64 = async () => '';
try {
    ({ uploadBase64 } = require('../services/imageUpload.service'));
} catch (e) {
    console.warn('⚠️ imageUpload.service not found — Cloudinary disabled');
}

// ── GET /api/meta/channels ────────────────────────────────────
// owner হলে: নিজের সব channel
// agent হলে: owner এর channel (allowedChannels filter সহ)
exports.getChannels = async (req, res) => {
    try {
        // agent হলে owner এর channel দেখবে (req.ownerId auth.middleware সেট করে)
        const ownerId = req.ownerId || req.user._id;
        const filter = { userId: ownerId };

        // agent হলে শুধু admin এর দেওয়া channel (allowedChannels)
        // খালি হলে owner এর সব channel পাবে
        if (req.isAgent && req.allowedChannels?.length) {
            filter._id = { $in: req.allowedChannels };
        }

        const channels = await MetaChannel.find(filter).sort({ createdAt: -1 });
        const safe = channels.map(c => ({
            _id: c._id, platform: c.platform, name: c.name,
            pageId: c.pageId, phoneNumberId: c.phoneNumberId,
            autoReplyEnabled: c.autoReplyEnabled, model: c.model,
            ragEnabled: c.ragEnabled, webhookVerifyToken: c.webhookVerifyToken,
            stats: c.stats, isActive: c.isActive, createdAt: c.createdAt,
        }));
        res.json({ success: true, channels: safe });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/meta/channels ───────────────────────────────────
// ⚠️ agent channel তৈরি করতে পারবে না — শুধু owner
exports.addChannel = async (req, res) => {
    try {
        // Agent block — channel create করতে পারবে না
        if (req.isAgent) {
            return res.status(403).json({ message: 'Agent নতুন channel তৈরি করতে পারে না। Admin কে বলুন।' });
        }

        const { platform, name, appId, appSecret, accessToken, pageId, phoneNumberId, wabaId, model, ragEnabled } = req.body;
        if (!platform || !name || !appId || !appSecret || !accessToken) {
            return res.status(400).json({ message: 'platform, name, appId, appSecret, accessToken required' });
        }
        const existing = await MetaChannel.countDocuments({ userId: req.user._id, isActive: true });
        const limit = req.user.planLimits.metaChannels;
        if (limit !== Infinity && existing >= limit) {
            return res.status(403).json({ message: `Plan limit: সর্বোচ্চ ${limit}টি channel`, upgrade: true });
        }
        const channel = await MetaChannel.create({
            userId: req.user._id, platform, name, appId, appSecret, accessToken,
            pageId, phoneNumberId, wabaId, model: model || 'gpt-4o', ragEnabled: ragEnabled ?? true,
        });
        const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
        res.status(201).json({
            success: true,
            channel: {
                _id: channel._id, platform: channel.platform, name: channel.name,
                webhookVerifyToken: channel.webhookVerifyToken,
                webhookUrl: `${baseUrl}/webhook/meta/${channel._id}`,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/meta/channels/:channelId ──────────────────────
// agent হলে owner এর channel edit করতে পারবে (settings)
exports.updateChannel = async (req, res) => {
    try {
        const ownerId = req.ownerId || req.user._id;
        const { autoReplyEnabled, model, ragEnabled, name } = req.body;
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: ownerId });
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
// ⚠️ agent channel delete করতে পারবে না
exports.deleteChannel = async (req, res) => {
    try {
        if (req.isAgent) {
            return res.status(403).json({ message: 'Agent channel মুছতে পারে না।' });
        }
        await MetaChannel.deleteOne({ _id: req.params.channelId, userId: req.user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/meta/messages ────────────────────────────────────
exports.getMessages = async (req, res) => {
    try {
        const ownerId = req.ownerId || req.user._id;
        const { status, platform, page = 1 } = req.query;
        const filter = { userId: ownerId };
        if (status) filter.status = status;
        if (platform) filter.platform = platform;

        // agent হলে শুধু allowedChannels এর message
        if (req.isAgent && req.allowedChannels?.length) {
            filter.channelId = { $in: req.allowedChannels };
        }

        const messages = await MetaMessage.find(filter)
            .sort({ createdAt: -1 }).limit(50).skip((Number(page) - 1) * 50)
            .populate('channelId', 'name platform');
        const total = await MetaMessage.countDocuments(filter);
        res.json({ success: true, messages, total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/meta/messages/:msgId/reply ────────────────────
exports.humanReply = async (req, res) => {
    try {
        const ownerId = req.ownerId || req.user._id;
        const { reply } = req.body;
        if (!reply?.trim()) return res.status(400).json({ message: 'reply text required' });
        const msg = await MetaMessage.findOne({ _id: req.params.msgId, userId: ownerId }).populate('channelId');
        if (!msg) return res.status(404).json({ message: 'Message not found' });
        await sendReply({ platform: msg.platform, channel: msg.channelId, recipientId: msg.senderId, text: reply });
        msg.humanReply = reply;
        msg.finalReply = reply;
        msg.status = 'human_replied';
        msg.replySent = true;
        msg.repliedAt = new Date();
        msg.humanRepliedBy = {
            userId: req.user._id,   // যে আসলে reply করল (agent বা owner)
            name: req.user.name,
            email: req.user.email,
            photo: req.user.photo || '',
            repliedAt: new Date(),
        };
        await msg.save();
        msg.channelId.stats.humanReplied += 1;
        await msg.channelId.save();

        emitToUser(ownerId, 'meta:message_updated', { message: msg });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /webhook/meta/:channelId ─────────────────────────────
exports.webhookVerify = async (req, res) => {
    try {
        const channel = await MetaChannel.findById(req.params.channelId);
        if (!channel) return res.sendStatus(404);
        const result = verifyWebhook(req.query, channel.webhookVerifyToken);
        if (result.success) return res.status(200).send(result.challenge);
        res.sendStatus(403);
    } catch { res.sendStatus(500); }
};

// ── POST /webhook/meta/:channelId ────────────────────────────
// ⚠️ webhook এ auth নেই — channel.userId ব্যবহার হয় (owner), অপরিবর্তিত
exports.webhookReceive = async (req, res) => {
    res.sendStatus(200);

    try {
        const channel = await MetaChannel.findById(req.params.channelId).populate('userId');
        if (!channel || !channel.isActive) return;

        const msgData = extractMessage(req.body, channel.platform);
        if (!msgData) return;

        const exists = await MetaMessage.findOne({ metaMessageId: msgData.messageId });
        if (exists) return;

        const profile = await getSenderProfile({
            platform: channel.platform,
            senderId: msgData.senderId,
            accessToken: channel.accessToken,
            fallbackName: msgData.senderName,
        });

        const metaMsg = await MetaMessage.create({
            userId: channel.userId._id,
            channelId: channel._id,
            platform: channel.platform,
            senderId: msgData.senderId,
            senderName: profile.name,
            senderProfilePic: profile.profilePic,
            customerMessage: msgData.text || '[Image sent]',
            messageType: msgData.type || 'text',
            metaMessageId: msgData.messageId,
            status: 'pending',
        });

        channel.stats.totalMessages += 1;
        await channel.save();

        // ── Contact auto-create/update (CRM) ───────────────────
        if (Contact) {
            try {
                const contact = await Contact.findOrCreate({
                    userId: channel.userId._id,
                    senderId: msgData.senderId,
                    channelId: channel._id,
                    platform: channel.platform,
                    name: profile.name,
                    phone: channel.platform === 'whatsapp' ? msgData.senderId : '',
                    profilePic: profile.profilePic,
                });
                contact.messageCount += 1;
                contact.lastMessageAt = new Date();
                contact.lastMessageText = msgData.text || '[Image]';
                await contact.save();
            } catch (e) {
                console.warn('Contact update failed:', e.message);
            }
        }

        emitToUser(channel.userId._id, 'meta:new_message', { message: metaMsg });

        // ── Channel-mode agent দের real-time notify ──
        // এই channel এ যেসব agent এর accessMode='channel', তাদের নতুন message পাঠাও
        try {
            const Agent = require('../models/Agent.model');
            const channelAgents = await Agent.find({
                ownerId: channel.userId._id,
                active: true,
                accessMode: 'channel',
                $or: [
                    { allowedChannels: channel._id },
                    { allowedChannels: { $size: 0 } },   // খালি = সব channel
                ],
            }).select('agentUserId');
            for (const ag of channelAgents) {
                if (ag.agentUserId) {
                    emitToUser(ag.agentUserId, 'meta:new_message', { message: metaMsg });
                }
            }
        } catch (e) { /* agent notify skip */ }

        if (!channel.autoReplyEnabled) {
            metaMsg.status = 'review_needed';
            await metaMsg.save();
            emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });
            return;
        }

        const user = channel.userId;
        let answer = '';
        let sources = [];
        let cantAnswer = false;

        // ════════════════════════════════════════════════════════
        // IMAGE MESSAGE — Vision + Order Flow
        // ════════════════════════════════════════════════════════
        if (msgData.type === 'image') {
            try {
                let base64 = null, mimeType = 'image/jpeg';

                if (channel.platform === 'whatsapp' && msgData.mediaId) {
                    const imageUrl = await getWhatsAppImageUrl(msgData.mediaId, channel.accessToken);
                    const img = await downloadMetaImage(imageUrl, channel.accessToken);
                    base64 = img.base64; mimeType = img.mimeType;
                }
                if ((channel.platform === 'messenger' || channel.platform === 'instagram') && msgData.imageUrl) {
                    const img = await downloadMetaImage(msgData.imageUrl, channel.accessToken);
                    base64 = img.base64; mimeType = img.mimeType;
                }

                if (!base64) throw new Error('Image download failed');

                let knowledgeContext = '';
                if (channel.ragEnabled) {
                    const results = await searchSimilar('product catalog price list color size', user._id.toString(), 5);
                    if (results.length > 0) {
                        knowledgeContext = results.map(r => r.content).join('\n\n');
                    }
                }

                const visionAnswer = await analyzeProductImage({ base64, mimeType, knowledgeContext });
                const productInfo = extractProductFromVisionAnswer(visionAnswer);

                let customerImageUrl = '';
                try {
                    customerImageUrl = await uploadBase64(base64, mimeType);
                } catch (e) {
                    console.warn('Cloudinary upload skipped:', e.message);
                }
                if (!customerImageUrl) {
                    customerImageUrl = msgData.imageUrl || '';
                }

                if (customerImageUrl) {
                    metaMsg.customerMessage = customerImageUrl;
                    metaMsg.messageType = 'image';
                    await metaMsg.save();
                    emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });
                }

                if (productInfo) {
                    const orderPrompt = await handleOrderFlow({
                        senderId: msgData.senderId,
                        channelId: channel._id,
                        userId: user._id,
                        platform: channel.platform,
                        text: null,
                        senderName: profile.name,
                        senderProfilePic: profile.profilePic,
                        productInfo,
                        productImage: customerImageUrl,
                    });

                    answer = orderPrompt
                        ? visionAnswer + '\n\n' + orderPrompt
                        : visionAnswer;
                } else {
                    answer = visionAnswer;
                }

            } catch (visionErr) {
                console.error('Vision error:', visionErr.message);
                answer = 'আপনার পাঠানো image টি দেখেছি। Product এর নাম লিখে পাঠান অথবা আমাদের সাথে যোগাযোগ করুন।';
                cantAnswer = true;
            }
        }

        // ════════════════════════════════════════════════════════
        // TEXT MESSAGE
        // ════════════════════════════════════════════════════════
        else {
            const lastBotMsg = await MetaMessage.findOne({
                channelId: channel._id,
                senderId: msgData.senderId,
                finalReply: { $exists: true, $ne: '' },
            }).sort({ createdAt: -1 });

            const orderFlowAnswer = await handleOrderFlow({
                senderId: msgData.senderId,
                channelId: channel._id,
                userId: user._id,
                platform: channel.platform,
                text: msgData.text,
                senderName: profile.name,
                senderProfilePic: profile.profilePic,
                productInfo: null,
                lastAiMessage: lastBotMsg?.finalReply || '',
            });

            if (orderFlowAnswer) {
                answer = orderFlowAnswer;
            } else {
                const result = await ragSend({
                    userMessage: msgData.text,
                    chatHistory: [],
                    userId: user._id.toString(),
                    model: channel.model,
                    ragEnabled: channel.ragEnabled,
                });
                answer = result.answer;
                sources = result.sources;
                cantAnswer = result.cantAnswer;
            }
        }

        metaMsg.aiReply = answer;
        metaMsg.sources = sources;
        metaMsg.aiConfident = !cantAnswer;

        if (cantAnswer) {
            metaMsg.status = 'review_needed';
            await metaMsg.save();

            emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });

            try {
                const holdingMsg = 'আপনার message টি পেয়েছি। 🙏 একটু পরে আমাদের একজন প্রতিনিধি আপনাকে বিস্তারিত জানাবেন।';
                await sendReply({ platform: channel.platform, channel, recipientId: msgData.senderId, text: holdingMsg });
            } catch (e) {
                console.warn('Holding message failed:', e.message);
            }
            return;
        }

        await sendReply({ platform: channel.platform, channel, recipientId: msgData.senderId, text: answer });

        metaMsg.finalReply = answer;
        metaMsg.status = 'ai_replied';
        metaMsg.replySent = true;
        metaMsg.repliedAt = new Date();
        await metaMsg.save();

        channel.stats.aiReplied += 1;
        await channel.save();

        emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });

        // ── Background AI lead collection ──
        // কিছু message জমলে auto lead analyze করো (প্রতি ৩ message এ একবার)
        try {
            await maybeCollectLead(channel.userId._id, msgData.senderId, channel._id);
        } catch (e) { /* lead collect skip */ }

        if (answer.includes('Order Confirmed')) {
            emitToUser(channel.userId._id, 'order:new', {});
        }

    } catch (err) {
        console.error('Webhook receive error:', err.message);
    }
};

// ── Background AI lead collection ────────────────────────────
// যথেষ্ট conversation জমলে auto lead analyze করে Contact.lead এ save করে
async function maybeCollectLead(ownerId, senderId, channelId) {
    let Contact = null, MetaMessage = null, analyzeLeadFromConversation = null;
    try {
        Contact = require('../models/Contact.model');
        MetaMessage = require('../models/MetaMessage.model');
        ({ analyzeLeadFromConversation } = require('../services/leadQualification.service'));
    } catch (e) { return; }   // CRM/service না থাকলে skip

    const contact = await Contact.findOne({ userId: ownerId, senderId, channelId });
    if (!contact) return;

    // কত customer message আছে গণনা করো
    const msgs = await MetaMessage.find({ userId: ownerId, senderId, channelId })
        .sort({ createdAt: 1 }).limit(60);

    const customerMsgCount = msgs.filter(m =>
        m.customerMessage && m.customerMessage !== '[Agent initiated]'
    ).length;

    // অন্তত ৩টা customer message লাগবে analyze করতে
    if (customerMsgCount < 3) return;

    // আগে analyze করা থাকলে — শুধু নতুন message এলে আবার (প্রতি ৩ নতুন এ)
    const lastAnalyzed = contact.lead?.analyzedAt;
    if (lastAnalyzed) {
        const newSince = msgs.filter(m =>
            m.customerMessage && m.customerMessage !== '[Agent initiated]' &&
            new Date(m.createdAt) > new Date(lastAnalyzed)
        ).length;
        if (newSince < 3) return;   // যথেষ্ট নতুন message নেই
    }

    // conversation → bubble
    const bubbles = [];
    for (const m of msgs) {
        if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
            bubbles.push({ from: 'customer', text: m.customerMessage });
        }
        if (m.finalReply) bubbles.push({ from: 'ai', text: m.finalReply });
    }

    const result = await analyzeLeadFromConversation(bubbles);
    if (!result) return;

    contact.lead.problem = result.problem;
    contact.lead.urgency = result.urgency;
    contact.lead.budget = result.budget;
    contact.lead.interest = result.interest;
    contact.lead.summary = result.summary;
    contact.lead.score = result.score;
    contact.lead.analyzedAt = new Date();
    // stage auto — score অনুযায়ী (যদি এখনো new থাকে)
    if (!contact.lead.stage || contact.lead.stage === 'new') {
        contact.lead.stage = result.score >= 70 ? 'qualified' : 'contacted';
    }
    await contact.save();
}

// ── Vision answer থেকে product info extract করো ──────────────
function extractProductFromVisionAnswer(text) {
    if (!text) return null;

    const notFoundPhrases = [
        'দুঃখিত', 'পাওয়া যাচ্ছে না', 'পাওয়া যায়নি', 'ক্যাটালগে নেই', 'খুঁজে পাইনি',
        'চিনতে পারিনি', 'sorry', 'not found', 'cannot identify', "couldn't find",
        'do not have', "don't have", 'প্রতিনিধি',
    ];
    const lower = text.toLowerCase();
    if (notFoundPhrases.some(p => lower.includes(p.toLowerCase()))) {
        return null;
    }

    const priceMatch = text.match(/[৳৲]\s*(\d[\d,]+)/)
        || text.match(/(\d[\d,]{2,})\s*(টাকা|BDT|Tk|taka)/i)
        || text.match(/price[:\s]+(\d[\d,]+)/i);

    const codeMatch = text.match(/(?:code|কোড|#)[:\s]*([A-Za-z0-9-]+)/i)
        || text.match(/-\s*(\d{3,})/);

    const nameMatch = text.match(/\*([^*\n]{3,50})\*/)
        || text.match(/product[:\s]+([^\n.,]{3,50})/i);

    if (!nameMatch && !priceMatch) return null;

    const productName = nameMatch ? nameMatch[1].trim() : '';
    if (!productName || productName.length < 3) return null;

    return {
        name: productName,
        code: codeMatch ? codeMatch[1].trim() : '',
        price: priceMatch ? priceMatch[0].trim() : '',
        desc: text.substring(0, 200),
    };
}