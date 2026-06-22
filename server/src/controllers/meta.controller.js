// const MetaChannel = require('../models/MetaChannel.model');
// const MetaMessage = require('../models/MetaMessage.model');
// const { sendReply, verifyWebhook, extractMessage, getSenderProfile } = require('../services/metaApi.service');
// const { sendMessage: ragSend } = require('../services/langchain.service');
// const { searchSimilar } = require('../services/vectorStore.service');
// const { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl } = require('../services/vision.service');
// const { handleOrderFlow } = require('../services/orderFlow.service');
// const { emitToUser } = require('../config/socket');

// // ── GET /api/meta/channels ────────────────────────────────────
// exports.getChannels = async (req, res) => {
//     try {
//         const channels = await MetaChannel.find({ userId: req.user._id }).sort({ createdAt: -1 });
//         const safe = channels.map(c => ({
//             _id: c._id, platform: c.platform, name: c.name,
//             pageId: c.pageId, phoneNumberId: c.phoneNumberId,
//             autoReplyEnabled: c.autoReplyEnabled, model: c.model,
//             ragEnabled: c.ragEnabled, webhookVerifyToken: c.webhookVerifyToken,
//             stats: c.stats, isActive: c.isActive, createdAt: c.createdAt,
//         }));
//         res.json({ success: true, channels: safe });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/meta/channels ───────────────────────────────────
// exports.addChannel = async (req, res) => {
//     try {
//         const { platform, name, appId, appSecret, accessToken, pageId, phoneNumberId, wabaId, model, ragEnabled } = req.body;
//         if (!platform || !name || !appId || !appSecret || !accessToken) {
//             return res.status(400).json({ message: 'platform, name, appId, appSecret, accessToken required' });
//         }
//         const existing = await MetaChannel.countDocuments({ userId: req.user._id, isActive: true });
//         const limit = req.user.planLimits.metaChannels;
//         if (limit !== Infinity && existing >= limit) {
//             return res.status(403).json({ message: `Plan limit: সর্বোচ্চ ${limit}টি channel`, upgrade: true });
//         }
//         const channel = await MetaChannel.create({
//             userId: req.user._id, platform, name, appId, appSecret, accessToken,
//             pageId, phoneNumberId, wabaId, model: model || 'gpt-4o', ragEnabled: ragEnabled ?? true,
//         });
//         const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
//         res.status(201).json({
//             success: true,
//             channel: {
//                 _id: channel._id, platform: channel.platform, name: channel.name,
//                 webhookVerifyToken: channel.webhookVerifyToken,
//                 webhookUrl: `${baseUrl}/webhook/meta/${channel._id}`,
//             },
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/meta/channels/:channelId ──────────────────────
// exports.updateChannel = async (req, res) => {
//     try {
//         const { autoReplyEnabled, model, ragEnabled, name } = req.body;
//         const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });
//         if (name !== undefined) channel.name = name;
//         if (autoReplyEnabled !== undefined) channel.autoReplyEnabled = autoReplyEnabled;
//         if (model !== undefined) channel.model = model;
//         if (ragEnabled !== undefined) channel.ragEnabled = ragEnabled;
//         await channel.save();
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/meta/channels/:channelId ─────────────────────
// exports.deleteChannel = async (req, res) => {
//     try {
//         await MetaChannel.deleteOne({ _id: req.params.channelId, userId: req.user._id });
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/meta/messages ────────────────────────────────────
// exports.getMessages = async (req, res) => {
//     try {
//         const { status, platform, page = 1 } = req.query;
//         const filter = { userId: req.user._id };
//         if (status) filter.status = status;
//         if (platform) filter.platform = platform;
//         const messages = await MetaMessage.find(filter)
//             .sort({ createdAt: -1 }).limit(50).skip((Number(page) - 1) * 50)
//             .populate('channelId', 'name platform');
//         const total = await MetaMessage.countDocuments(filter);
//         res.json({ success: true, messages, total });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/meta/messages/:msgId/reply ────────────────────
// exports.humanReply = async (req, res) => {
//     try {
//         const { reply } = req.body;
//         if (!reply?.trim()) return res.status(400).json({ message: 'reply text required' });
//         const msg = await MetaMessage.findOne({ _id: req.params.msgId, userId: req.user._id }).populate('channelId');
//         if (!msg) return res.status(404).json({ message: 'Message not found' });
//         await sendReply({ platform: msg.platform, channel: msg.channelId, recipientId: msg.senderId, text: reply });
//         msg.humanReply = reply;
//         msg.finalReply = reply;
//         msg.status = 'human_replied';
//         msg.replySent = true;
//         msg.repliedAt = new Date();
//         msg.humanRepliedBy = {
//             userId: req.user._id,
//             name: req.user.name,
//             email: req.user.email,
//             photo: req.user.photo || '',
//             repliedAt: new Date(),
//         };
//         await msg.save();
//         msg.channelId.stats.humanReplied += 1;
//         await msg.channelId.save();

//         // Real-time update
//         emitToUser(req.user._id, 'meta:message_updated', { message: msg });

//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /webhook/meta/:channelId ─────────────────────────────
// exports.webhookVerify = async (req, res) => {
//     try {
//         const channel = await MetaChannel.findById(req.params.channelId);
//         if (!channel) return res.sendStatus(404);
//         const result = verifyWebhook(req.query, channel.webhookVerifyToken);
//         if (result.success) return res.status(200).send(result.challenge);
//         res.sendStatus(403);
//     } catch { res.sendStatus(500); }
// };

// // ── POST /webhook/meta/:channelId ────────────────────────────
// exports.webhookReceive = async (req, res) => {
//     res.sendStatus(200);

//     try {
//         const channel = await MetaChannel.findById(req.params.channelId).populate('userId');
//         if (!channel || !channel.isActive) return;

//         const msgData = extractMessage(req.body, channel.platform);
//         if (!msgData) return;

//         // Duplicate check
//         const exists = await MetaMessage.findOne({ metaMessageId: msgData.messageId });
//         if (exists) return;

//         // Customer profile নিয়ে আসো
//         const profile = await getSenderProfile({
//             platform: channel.platform,
//             senderId: msgData.senderId,
//             accessToken: channel.accessToken,
//             fallbackName: msgData.senderName,
//         });

//         // Message save করো
//         const metaMsg = await MetaMessage.create({
//             userId: channel.userId._id,
//             channelId: channel._id,
//             platform: channel.platform,
//             senderId: msgData.senderId,
//             senderName: profile.name,
//             senderProfilePic: profile.profilePic,
//             customerMessage: msgData.text || '[Image sent]',
//             messageType: msgData.type || 'text',
//             metaMessageId: msgData.messageId,
//             status: 'pending',
//         });

//         channel.stats.totalMessages += 1;
//         await channel.save();

//         // ── Real-time: নতুন message এসেছে ──────────────────────
//         emitToUser(channel.userId._id, 'meta:new_message', { message: metaMsg });

//         if (!channel.autoReplyEnabled) {
//             metaMsg.status = 'review_needed';
//             await metaMsg.save();
//             emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });
//             return;
//         }

//         const user = channel.userId;
//         let answer = '';
//         let sources = [];
//         let cantAnswer = false;

//         // ════════════════════════════════════════════════════════
//         // IMAGE MESSAGE — Vision + Order Flow
//         // ════════════════════════════════════════════════════════
//         if (msgData.type === 'image') {
//             try {
//                 let base64 = null, mimeType = 'image/jpeg';

//                 if (channel.platform === 'whatsapp' && msgData.mediaId) {
//                     const imageUrl = await getWhatsAppImageUrl(msgData.mediaId, channel.accessToken);
//                     const img = await downloadMetaImage(imageUrl, channel.accessToken);
//                     base64 = img.base64; mimeType = img.mimeType;
//                 }
//                 if ((channel.platform === 'messenger' || channel.platform === 'instagram') && msgData.imageUrl) {
//                     const img = await downloadMetaImage(msgData.imageUrl, channel.accessToken);
//                     base64 = img.base64; mimeType = img.mimeType;
//                 }

//                 if (!base64) throw new Error('Image download failed');

//                 // Knowledge base থেকে product catalog নিয়ে আসো
//                 let knowledgeContext = '';
//                 if (channel.ragEnabled) {
//                     const results = await searchSimilar('product catalog price list', user._id.toString(), 5);
//                     if (results.length > 0) {
//                         knowledgeContext = results.map(r => r.content).join('\n\n');
//                     }
//                 }

//                 // GPT-4o Vision দিয়ে product identify করো
//                 const visionAnswer = await analyzeProductImage({ base64, mimeType, knowledgeContext });

//                 // Vision answer থেকে product info extract করো
//                 const productInfo = extractProductFromVisionAnswer(visionAnswer);

//                 // Customer এর পাঠানো image URL (WhatsApp/Messenger/Instagram)
//                 const customerImageUrl = msgData.imageUrl
//                     || (msgData.mediaId ? `whatsapp-media:${msgData.mediaId}` : '');

//                 // Order flow শুরু করো
//                 if (productInfo) {
//                     answer = await handleOrderFlow({
//                         senderId: msgData.senderId,
//                         channelId: channel._id,
//                         userId: user._id,
//                         platform: channel.platform,
//                         text: null,
//                         senderName: profile.name,
//                         senderProfilePic: profile.profilePic,
//                         productInfo,
//                         productImage: customerImageUrl,
//                     });
//                     // Vision answer + order prompt combine করো
//                     answer = visionAnswer + '\n\n' + answer;
//                 } else {
//                     answer = visionAnswer;
//                 }

//             } catch (visionErr) {
//                 console.error('Vision error:', visionErr.message);
//                 answer = 'আপনার পাঠানো image টি দেখেছি। Product এর নাম লিখে পাঠান অথবা আমাদের সাথে যোগাযোগ করুন।';
//                 cantAnswer = true;
//             }
//         }

//         // ════════════════════════════════════════════════════════
//         // TEXT MESSAGE — Order flow check করো আগে, তারপর RAG
//         // ════════════════════════════════════════════════════════
//         else {
//             // এই customer কে দেওয়া AI এর শেষ reply খুঁজো (product নাম extract করতে)
//             const lastBotMsg = await MetaMessage.findOne({
//                 channelId: channel._id,
//                 senderId: msgData.senderId,
//                 finalReply: { $exists: true, $ne: '' },
//             }).sort({ createdAt: -1 });

//             // Order flow চলছে কিনা check করো
//             const orderFlowAnswer = await handleOrderFlow({
//                 senderId: msgData.senderId,
//                 channelId: channel._id,
//                 userId: user._id,
//                 platform: channel.platform,
//                 text: msgData.text,
//                 senderName: profile.name,
//                 senderProfilePic: profile.profilePic,
//                 productInfo: null,
//                 lastAiMessage: lastBotMsg?.finalReply || '',
//             });

//             if (orderFlowAnswer) {
//                 // Order flow active — order flow এর answer ব্যবহার করো
//                 answer = orderFlowAnswer;
//             } else {
//                 // Normal RAG flow
//                 const result = await ragSend({
//                     userMessage: msgData.text,
//                     chatHistory: [],
//                     userId: user._id.toString(),
//                     model: channel.model,
//                     ragEnabled: channel.ragEnabled,
//                 });
//                 answer = result.answer;
//                 sources = result.sources;
//                 cantAnswer = result.cantAnswer;
//             }
//         }

//         metaMsg.aiReply = answer;
//         metaMsg.sources = sources;
//         metaMsg.aiConfident = !cantAnswer;

//         if (cantAnswer) {
//             // AI উত্তর দিতে পারেনি — review queue তে পাঠাও
//             metaMsg.status = 'review_needed';
//             await metaMsg.save();

//             // Real-time update
//             emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });

//             // Customer কে polite holding message পাঠাও ("ক্যাটালগে নেই" নয়)
//             try {
//                 const holdingMsg = 'আপনার message টি পেয়েছি। 🙏 একটু পরে আমাদের একজন প্রতিনিধি আপনাকে বিস্তারিত জানাবেন।';
//                 await sendReply({ platform: channel.platform, channel, recipientId: msgData.senderId, text: holdingMsg });
//             } catch (e) {
//                 console.warn('Holding message failed:', e.message);
//             }
//             return;
//         }

//         // Reply পাঠাও
//         await sendReply({ platform: channel.platform, channel, recipientId: msgData.senderId, text: answer });

//         metaMsg.finalReply = answer;
//         metaMsg.status = 'ai_replied';
//         metaMsg.replySent = true;
//         metaMsg.repliedAt = new Date();
//         await metaMsg.save();

//         channel.stats.aiReplied += 1;
//         await channel.save();

//         // ── Real-time: AI reply হয়েছে ─────────────────────────
//         emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });

//         // নতুন order তৈরি হয়ে থাকলে orders page ও refresh হবে
//         if (answer.includes('Order Confirmed')) {
//             emitToUser(channel.userId._id, 'order:new', {});
//         }

//     } catch (err) {
//         console.error('Webhook receive error:', err.message);
//     }
// };

// // ── Vision answer থেকে product info extract করো ──────────────
// // GPT-4o এর reply থেকে product name/price বের করার চেষ্টা করো
// function extractProductFromVisionAnswer(text) {
//     if (!text) return null;

//     // AI product চিনতে পারেনি — এমন phrase থাকলে order শুরু করবে না
//     const notFoundPhrases = [
//         'দুঃখিত', 'পাওয়া যাচ্ছে না', 'পাওয়া যায়নি', 'ক্যাটালগে নেই', 'খুঁজে পাইনি',
//         'চিনতে পারিনি', 'sorry', 'not found', 'cannot identify', "couldn't find",
//         'do not have', "don't have", 'প্রতিনিধি',
//     ];
//     const lower = text.toLowerCase();
//     if (notFoundPhrases.some(p => lower.includes(p.toLowerCase()))) {
//         return null;   // product চেনা যায়নি — normal flow এ যাও
//     }

//     // Price খোঁজো
//     const priceMatch = text.match(/[৳৲]\s*(\d[\d,]+)/)
//         || text.match(/(\d[\d,]{2,})\s*(টাকা|BDT|Tk|taka)/i)
//         || text.match(/price[:\s]+(\d[\d,]+)/i);

//     // Product code খোঁজো
//     const codeMatch = text.match(/(?:code|কোড|#)[:\s]*([A-Za-z0-9-]+)/i)
//         || text.match(/-\s*(\d{3,})/);

//     // Product name — শুধু bold (*text*) বা "product:" এর পরে
//     // কোনো generic প্রথম লাইন নেবে না
//     const nameMatch = text.match(/\*([^*\n]{3,50})\*/)
//         || text.match(/product[:\s]+([^\n.,]{3,50})/i);

//     // Product name অথবা price/code কিছুই না পেলে — order শুরু করবে না
//     if (!nameMatch && !priceMatch) {
//         return null;
//     }

//     // Product name না পেলে কিন্তু price পেলে — generic নাম
//     const productName = nameMatch ? nameMatch[1].trim() : '';

//     // নাম খুব ছোট বা suspicious হলে reject করো
//     if (!productName || productName.length < 3) {
//         return null;
//     }

//     return {
//         name: productName,
//         code: codeMatch ? codeMatch[1].trim() : '',
//         price: priceMatch ? priceMatch[0].trim() : '',
//         desc: text.substring(0, 200),
//     };
// }




// const MetaChannel = require('../models/MetaChannel.model');
// const MetaMessage = require('../models/MetaMessage.model');
// const { sendReply, verifyWebhook, extractMessage, getSenderProfile } = require('../services/metaApi.service');
// const { sendMessage: ragSend } = require('../services/langchain.service');
// const { searchSimilar } = require('../services/vectorStore.service');
// const { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl } = require('../services/vision.service');
// const { handleOrderFlow } = require('../services/orderFlow.service');

// // ── GET /api/meta/channels ────────────────────────────────────
// exports.getChannels = async (req, res) => {
//     try {
//         const channels = await MetaChannel.find({ userId: req.user._id }).sort({ createdAt: -1 });
//         const safe = channels.map(c => ({
//             _id: c._id, platform: c.platform, name: c.name,
//             pageId: c.pageId, phoneNumberId: c.phoneNumberId,
//             autoReplyEnabled: c.autoReplyEnabled, model: c.model,
//             ragEnabled: c.ragEnabled, webhookVerifyToken: c.webhookVerifyToken,
//             stats: c.stats, isActive: c.isActive, createdAt: c.createdAt,
//         }));
//         res.json({ success: true, channels: safe });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/meta/channels ───────────────────────────────────
// exports.addChannel = async (req, res) => {
//     try {
//         const { platform, name, appId, appSecret, accessToken, pageId, phoneNumberId, wabaId, model, ragEnabled } = req.body;
//         if (!platform || !name || !appId || !appSecret || !accessToken) {
//             return res.status(400).json({ message: 'platform, name, appId, appSecret, accessToken required' });
//         }
//         const existing = await MetaChannel.countDocuments({ userId: req.user._id, isActive: true });
//         const limit = req.user.planLimits.metaChannels;
//         if (limit !== Infinity && existing >= limit) {
//             return res.status(403).json({ message: `Plan limit: সর্বোচ্চ ${limit}টি channel`, upgrade: true });
//         }
//         const channel = await MetaChannel.create({
//             userId: req.user._id, platform, name, appId, appSecret, accessToken,
//             pageId, phoneNumberId, wabaId, model: model || 'gpt-4o', ragEnabled: ragEnabled ?? true,
//         });
//         const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
//         res.status(201).json({
//             success: true,
//             channel: {
//                 _id: channel._id, platform: channel.platform, name: channel.name,
//                 webhookVerifyToken: channel.webhookVerifyToken,
//                 webhookUrl: `${baseUrl}/webhook/meta/${channel._id}`,
//             },
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/meta/channels/:channelId ──────────────────────
// exports.updateChannel = async (req, res) => {
//     try {
//         const { autoReplyEnabled, model, ragEnabled, name } = req.body;
//         const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });
//         if (name !== undefined) channel.name = name;
//         if (autoReplyEnabled !== undefined) channel.autoReplyEnabled = autoReplyEnabled;
//         if (model !== undefined) channel.model = model;
//         if (ragEnabled !== undefined) channel.ragEnabled = ragEnabled;
//         await channel.save();
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/meta/channels/:channelId ─────────────────────
// exports.deleteChannel = async (req, res) => {
//     try {
//         await MetaChannel.deleteOne({ _id: req.params.channelId, userId: req.user._id });
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/meta/messages ────────────────────────────────────
// exports.getMessages = async (req, res) => {
//     try {
//         const { status, platform, page = 1 } = req.query;
//         const filter = { userId: req.user._id };
//         if (status) filter.status = status;
//         if (platform) filter.platform = platform;
//         const messages = await MetaMessage.find(filter)
//             .sort({ createdAt: -1 }).limit(50).skip((Number(page) - 1) * 50)
//             .populate('channelId', 'name platform');
//         const total = await MetaMessage.countDocuments(filter);
//         res.json({ success: true, messages, total });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/meta/messages/:msgId/reply ────────────────────
// exports.humanReply = async (req, res) => {
//     try {
//         const { reply } = req.body;
//         if (!reply?.trim()) return res.status(400).json({ message: 'reply text required' });
//         const msg = await MetaMessage.findOne({ _id: req.params.msgId, userId: req.user._id }).populate('channelId');
//         if (!msg) return res.status(404).json({ message: 'Message not found' });
//         await sendReply({ platform: msg.platform, channel: msg.channelId, recipientId: msg.senderId, text: reply });
//         msg.humanReply = reply;
//         msg.finalReply = reply;
//         msg.status = 'human_replied';
//         msg.replySent = true;
//         msg.repliedAt = new Date();
//         msg.humanRepliedBy = {
//             userId: req.user._id,
//             name: req.user.name,
//             email: req.user.email,
//             photo: req.user.photo || '',
//             repliedAt: new Date(),
//         };
//         await msg.save();
//         msg.channelId.stats.humanReplied += 1;
//         await msg.channelId.save();
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /webhook/meta/:channelId ─────────────────────────────
// exports.webhookVerify = async (req, res) => {
//     try {
//         const channel = await MetaChannel.findById(req.params.channelId);
//         if (!channel) return res.sendStatus(404);
//         const result = verifyWebhook(req.query, channel.webhookVerifyToken);
//         if (result.success) return res.status(200).send(result.challenge);
//         res.sendStatus(403);
//     } catch { res.sendStatus(500); }
// };

// // ── POST /webhook/meta/:channelId ────────────────────────────
// exports.webhookReceive = async (req, res) => {
//     res.sendStatus(200);

//     try {
//         const channel = await MetaChannel.findById(req.params.channelId).populate('userId');
//         if (!channel || !channel.isActive) return;

//         const msgData = extractMessage(req.body, channel.platform);
//         if (!msgData) return;

//         // Duplicate check
//         const exists = await MetaMessage.findOne({ metaMessageId: msgData.messageId });
//         if (exists) return;

//         // Customer profile নিয়ে আসো
//         const profile = await getSenderProfile({
//             platform: channel.platform,
//             senderId: msgData.senderId,
//             accessToken: channel.accessToken,
//             fallbackName: msgData.senderName,
//         });

//         // Message save করো
//         const metaMsg = await MetaMessage.create({
//             userId: channel.userId._id,
//             channelId: channel._id,
//             platform: channel.platform,
//             senderId: msgData.senderId,
//             senderName: profile.name,
//             senderProfilePic: profile.profilePic,
//             customerMessage: msgData.text || '[Image sent]',
//             messageType: msgData.type || 'text',
//             metaMessageId: msgData.messageId,
//             status: 'pending',
//         });

//         channel.stats.totalMessages += 1;
//         await channel.save();

//         if (!channel.autoReplyEnabled) {
//             metaMsg.status = 'review_needed';
//             await metaMsg.save();
//             return;
//         }

//         const user = channel.userId;
//         let answer = '';
//         let sources = [];
//         let cantAnswer = false;

//         // ════════════════════════════════════════════════════════
//         // IMAGE MESSAGE — Vision + Order Flow
//         // ════════════════════════════════════════════════════════
//         if (msgData.type === 'image') {
//             try {
//                 let base64 = null, mimeType = 'image/jpeg';

//                 if (channel.platform === 'whatsapp' && msgData.mediaId) {
//                     const imageUrl = await getWhatsAppImageUrl(msgData.mediaId, channel.accessToken);
//                     const img = await downloadMetaImage(imageUrl, channel.accessToken);
//                     base64 = img.base64; mimeType = img.mimeType;
//                 }
//                 if ((channel.platform === 'messenger' || channel.platform === 'instagram') && msgData.imageUrl) {
//                     const img = await downloadMetaImage(msgData.imageUrl, channel.accessToken);
//                     base64 = img.base64; mimeType = img.mimeType;
//                 }

//                 if (!base64) throw new Error('Image download failed');

//                 // Knowledge base থেকে product catalog নিয়ে আসো
//                 let knowledgeContext = '';
//                 if (channel.ragEnabled) {
//                     const results = await searchSimilar('product catalog price list', user._id.toString(), 5);
//                     if (results.length > 0) {
//                         knowledgeContext = results.map(r => r.content).join('\n\n');
//                     }
//                 }

//                 // GPT-4o Vision দিয়ে product identify করো
//                 const visionAnswer = await analyzeProductImage({ base64, mimeType, knowledgeContext });

//                 // Vision answer থেকে product info extract করো
//                 const productInfo = extractProductFromVisionAnswer(visionAnswer);

//                 // Customer এর পাঠানো image URL (WhatsApp/Messenger/Instagram)
//                 const customerImageUrl = msgData.imageUrl
//                     || (msgData.mediaId ? `whatsapp-media:${msgData.mediaId}` : '');

//                 // Order flow শুরু করো
//                 if (productInfo) {
//                     answer = await handleOrderFlow({
//                         senderId: msgData.senderId,
//                         channelId: channel._id,
//                         userId: user._id,
//                         platform: channel.platform,
//                         text: null,
//                         senderName: profile.name,
//                         senderProfilePic: profile.profilePic,
//                         productInfo,
//                         productImage: customerImageUrl,
//                     });
//                     // Vision answer + order prompt combine করো
//                     answer = visionAnswer + '\n\n' + answer;
//                 } else {
//                     answer = visionAnswer;
//                 }

//             } catch (visionErr) {
//                 console.error('Vision error:', visionErr.message);
//                 answer = 'আপনার পাঠানো image টি দেখেছি। Product এর নাম লিখে পাঠান অথবা আমাদের সাথে যোগাযোগ করুন।';
//                 cantAnswer = true;
//             }
//         }

//         // ════════════════════════════════════════════════════════
//         // TEXT MESSAGE — Order flow check করো আগে, তারপর RAG
//         // ════════════════════════════════════════════════════════
//         else {
//             // এই customer কে দেওয়া AI এর শেষ reply খুঁজো (product নাম extract করতে)
//             const lastBotMsg = await MetaMessage.findOne({
//                 channelId: channel._id,
//                 senderId: msgData.senderId,
//                 finalReply: { $exists: true, $ne: '' },
//             }).sort({ createdAt: -1 });

//             // Order flow চলছে কিনা check করো
//             const orderFlowAnswer = await handleOrderFlow({
//                 senderId: msgData.senderId,
//                 channelId: channel._id,
//                 userId: user._id,
//                 platform: channel.platform,
//                 text: msgData.text,
//                 senderName: profile.name,
//                 senderProfilePic: profile.profilePic,
//                 productInfo: null,
//                 lastAiMessage: lastBotMsg?.finalReply || '',
//             });

//             if (orderFlowAnswer) {
//                 // Order flow active — order flow এর answer ব্যবহার করো
//                 answer = orderFlowAnswer;
//             } else {
//                 // Normal RAG flow
//                 const result = await ragSend({
//                     userMessage: msgData.text,
//                     chatHistory: [],
//                     userId: user._id.toString(),
//                     model: channel.model,
//                     ragEnabled: channel.ragEnabled,
//                 });
//                 answer = result.answer;
//                 sources = result.sources;
//                 cantAnswer = result.cantAnswer;
//             }
//         }

//         metaMsg.aiReply = answer;
//         metaMsg.sources = sources;
//         metaMsg.aiConfident = !cantAnswer;

//         if (cantAnswer) {
//             // AI উত্তর দিতে পারেনি — review queue তে পাঠাও
//             metaMsg.status = 'review_needed';
//             await metaMsg.save();

//             // Customer কে polite holding message পাঠাও ("ক্যাটালগে নেই" নয়)
//             try {
//                 const holdingMsg = 'আপনার message টি পেয়েছি। 🙏 একটু পরে আমাদের একজন প্রতিনিধি আপনাকে বিস্তারিত জানাবেন।';
//                 await sendReply({ platform: channel.platform, channel, recipientId: msgData.senderId, text: holdingMsg });
//             } catch (e) {
//                 console.warn('Holding message failed:', e.message);
//             }
//             return;
//         }

//         // Reply পাঠাও
//         await sendReply({ platform: channel.platform, channel, recipientId: msgData.senderId, text: answer });

//         metaMsg.finalReply = answer;
//         metaMsg.status = 'ai_replied';
//         metaMsg.replySent = true;
//         metaMsg.repliedAt = new Date();
//         await metaMsg.save();

//         channel.stats.aiReplied += 1;
//         await channel.save();

//     } catch (err) {
//         console.error('Webhook receive error:', err.message);
//     }
// };

// // ── Vision answer থেকে product info extract করো ──────────────
// // GPT-4o এর reply থেকে product name/price বের করার চেষ্টা করো
// function extractProductFromVisionAnswer(text) {
//     if (!text) return null;

//     // Price pattern খোঁজো (৳, BDT, Tk, টাকা)
//     const priceMatch = text.match(/[৳৲]?\s*(\d[\d,]+)\s*(টাকা|BDT|Tk|taka)?/i)
//         || text.match(/price[:\s]+(\d[\d,]+)/i);

//     // Product name — প্রথম bold word বা significant noun
//     const nameMatch = text.match(/\*([^*]+)\*/)
//         || text.match(/product[:\s]+([^\n.,]+)/i)
//         || text.match(/^([^\n.!?]{5,50})/);

//     if (!nameMatch) return null;

//     return {
//         name: nameMatch[1]?.trim() || 'Product',
//         price: priceMatch ? priceMatch[0]?.trim() : '',
//         desc: text.substring(0, 200),
//     };
// }












const MetaChannel = require('../models/MetaChannel.model');
const MetaMessage = require('../models/MetaMessage.model');
const { sendReply, verifyWebhook, extractMessage, getSenderProfile } = require('../services/metaApi.service');
const { sendMessage: ragSend } = require('../services/langchain.service');
const { searchSimilar } = require('../services/vectorStore.service');
const { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl } = require('../services/vision.service');
const { handleOrderFlow } = require('../services/orderFlow.service');
const { emitToUser } = require('../config/socket');

// ── GET /api/meta/channels ────────────────────────────────────
exports.getChannels = async (req, res) => {
    try {
        const channels = await MetaChannel.find({ userId: req.user._id }).sort({ createdAt: -1 });
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
exports.addChannel = async (req, res) => {
    try {
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
        const { reply } = req.body;
        if (!reply?.trim()) return res.status(400).json({ message: 'reply text required' });
        const msg = await MetaMessage.findOne({ _id: req.params.msgId, userId: req.user._id }).populate('channelId');
        if (!msg) return res.status(404).json({ message: 'Message not found' });
        await sendReply({ platform: msg.platform, channel: msg.channelId, recipientId: msg.senderId, text: reply });
        msg.humanReply = reply;
        msg.finalReply = reply;
        msg.status = 'human_replied';
        msg.replySent = true;
        msg.repliedAt = new Date();
        msg.humanRepliedBy = {
            userId: req.user._id,
            name: req.user.name,
            email: req.user.email,
            photo: req.user.photo || '',
            repliedAt: new Date(),
        };
        await msg.save();
        msg.channelId.stats.humanReplied += 1;
        await msg.channelId.save();

        emitToUser(req.user._id, 'meta:message_updated', { message: msg });

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

        emitToUser(channel.userId._id, 'meta:new_message', { message: metaMsg });

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

                // Knowledge base (RAG) থেকে product তথ্য নিয়ে আসো
                let knowledgeContext = '';
                if (channel.ragEnabled) {
                    const results = await searchSimilar('product catalog price list color size', user._id.toString(), 5);
                    if (results.length > 0) {
                        knowledgeContext = results.map(r => r.content).join('\n\n');
                    }
                }

                // GPT-4o Vision দিয়ে product identify করো (RAG knowledge সহ)
                const visionAnswer = await analyzeProductImage({ base64, mimeType, knowledgeContext });

                const productInfo = extractProductFromVisionAnswer(visionAnswer);

                const customerImageUrl = msgData.imageUrl
                    || (msgData.mediaId ? `whatsapp-media:${msgData.mediaId}` : '');

                // Order flow শুরু করার চেষ্টা করো (Product Mode চালু থাকলেই কাজ করবে)
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

                    // Product Mode ON → vision answer + order prompt
                    // Service-only (orderPrompt null) → শুধু vision answer (product তথ্য)
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
        // TEXT MESSAGE — Order flow আগে, না হলে RAG knowledge
        // ════════════════════════════════════════════════════════
        else {
            const lastBotMsg = await MetaMessage.findOne({
                channelId: channel._id,
                senderId: msgData.senderId,
                finalReply: { $exists: true, $ne: '' },
            }).sort({ createdAt: -1 });

            // Order flow চলছে কিনা / order intent আছে কিনা check করো
            // (Product Mode বন্ধ থাকলে orderFlow null দেবে → RAG চলবে)
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
                // Order flow active — field collect করছে
                answer = orderFlowAnswer;
            } else {
                // Order flow নেই → RAG knowledge দিয়ে উত্তর
                // (product সম্পর্কে প্রশ্ন, service প্রশ্ন — সব এখানে)
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

        if (answer.includes('Order Confirmed')) {
            emitToUser(channel.userId._id, 'order:new', {});
        }

    } catch (err) {
        console.error('Webhook receive error:', err.message);
    }
};

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