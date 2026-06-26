// const Order = require('../models/Order.model');
// const ApiKey = require('../models/ApiKey.model');

// // ── GET /api/orders ───────────────────────────────────────────
// exports.getOrders = async (req, res) => {
//     try {
//         const { status, platform, page = 1, limit = 20, search } = req.query;

//         const filter = { userId: req.user._id };
//         if (status) filter.status = status;
//         if (platform) filter.platform = platform;
//         if (search) {
//             filter.$or = [
//                 { 'customer.name': { $regex: search, $options: 'i' } },
//                 { 'customer.phone': { $regex: search, $options: 'i' } },
//                 { 'product.name': { $regex: search, $options: 'i' } },
//                 { orderId: { $regex: search, $options: 'i' } },
//             ];
//         }

//         const [orders, total] = await Promise.all([
//             Order.find(filter)
//                 .sort({ createdAt: -1 })
//                 .skip((Number(page) - 1) * Number(limit))
//                 .limit(Number(limit)),
//             Order.countDocuments(filter),
//         ]);

//         // Stats
//         const stats = await Order.aggregate([
//             { $match: { userId: req.user._id } },
//             {
//                 $group: {
//                     _id: '$status',
//                     count: { $sum: 1 },
//                 },
//             },
//         ]);

//         const statusCounts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
//         stats.forEach(s => { statusCounts[s._id] = s.count; });

//         res.json({ success: true, orders, total, page: Number(page), stats: statusCounts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/orders/:orderId ──────────────────────────────────
// exports.getOrder = async (req, res) => {
//     try {
//         const order = await Order.findOne({
//             $or: [
//                 { _id: req.params.orderId.match(/^[0-9a-fA-F]{24}$/) ? req.params.orderId : null },
//                 { orderId: req.params.orderId },
//             ],
//             userId: req.user._id,
//         });

//         if (!order) return res.status(404).json({ message: 'Order not found' });
//         res.json({ success: true, order });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/orders/:orderId/status ────────────────────────
// exports.updateStatus = async (req, res) => {
//     try {
//         const { status, notes } = req.body;
//         const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({ message: `Invalid status. Must be: ${validStatuses.join(', ')}` });
//         }

//         const order = await Order.findOneAndUpdate(
//             { orderId: req.params.orderId, userId: req.user._id },
//             { status, ...(notes && { notes }), updatedAt: new Date() },
//             { new: true }
//         );

//         if (!order) return res.status(404).json({ message: 'Order not found' });
//         res.json({ success: true, order });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/orders/:orderId ───────────────────────────────
// exports.deleteOrder = async (req, res) => {
//     try {
//         await Order.deleteOne({ orderId: req.params.orderId, userId: req.user._id });
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ══ API KEY MANAGEMENT ════════════════════════════════════════

// // ── GET /api/orders/api-keys ──────────────────────────────────
// exports.getApiKeys = async (req, res) => {
//     try {
//         const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
//         // key টা mask করে পাঠাও (শুধু first 12 char দেখাও)
//         const masked = keys.map(k => ({
//             _id: k._id,
//             name: k.name,
//             key: k.key.substring(0, 12) + '••••••••••••••••',
//             isActive: k.isActive,
//             requestCount: k.requestCount,
//             lastUsedAt: k.lastUsedAt,
//             createdAt: k.createdAt,
//         }));
//         res.json({ success: true, keys: masked });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/orders/api-keys ─────────────────────────────────
// exports.createApiKey = async (req, res) => {
//     try {
//         const { name } = req.body;
//         if (!name?.trim()) return res.status(400).json({ message: 'API key name required' });

//         const existing = await ApiKey.countDocuments({ userId: req.user._id, isActive: true });
//         if (existing >= 5) return res.status(400).json({ message: 'Maximum 5 API keys allowed' });

//         const apiKey = await ApiKey.create({ userId: req.user._id, name: name.trim() });

//         // একবারই full key দেখাও
//         res.status(201).json({
//             success: true,
//             apiKey: {
//                 _id: apiKey._id,
//                 name: apiKey.name,
//                 key: apiKey.key,  // full key — এরপর আর দেখাবো না
//                 isActive: apiKey.isActive,
//                 createdAt: apiKey.createdAt,
//             },
//             message: '⚠️ এই API key একবারই দেখা যাবে। এখনই copy করুন।',
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/orders/api-keys/:keyId ───────────────────────
// exports.revokeApiKey = async (req, res) => {
//     try {
//         await ApiKey.findOneAndUpdate(
//             { _id: req.params.keyId, userId: req.user._id },
//             { isActive: false }
//         );
//         res.json({ success: true, message: 'API key revoked' });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };




// const Order = require('../models/Order.model');
// const ApiKey = require('../models/ApiKey.model');
// const MetaChannel = require('../models/MetaChannel.model');
// const { sendReply } = require('../services/metaApi.service');

// // ── Status অনুযায়ী customer কে message ─────────────────────
// const STATUS_MESSAGES = {
//     confirmed: (o) => `✅ আপনার order *${o.orderId}* confirm হয়েছে!\n📦 ${o.product.name}\n\nআমরা শীঘ্রই এটি প্রস্তুত করছি।`,
//     processing: (o) => `⚙️ আপনার order *${o.orderId}* এখন প্রস্তুত করা হচ্ছে।\n📦 ${o.product.name}`,
//     shipped: (o) => `🚚 সুখবর! আপনার order *${o.orderId}* পাঠানো হয়েছে।\n📦 ${o.product.name}\n📞 ${o.customer.phone}\n\nশীঘ্রই আপনার কাছে পৌঁছে যাবে!`,
//     delivered: (o) => `🎉 আপনার order *${o.orderId}* ডেলিভারি সম্পন্ন হয়েছে!\n\nআমাদের সাথে কেনাকাটার জন্য ধন্যবাদ! 🙏 আবার আসবেন।`,
//     cancelled: (o) => `❌ দুঃখিত, আপনার order *${o.orderId}* বাতিল করা হয়েছে।\n\nকোনো প্রশ্ন থাকলে আমাদের জানান।`,
// };

// // ── Customer কে status update পাঠাও ─────────────────────────
// async function notifyCustomer(order) {
//     try {
//         if (!order.channelId || !order.customer?.senderId) return;
//         const messageFn = STATUS_MESSAGES[order.status];
//         if (!messageFn) return;

//         const channel = await MetaChannel.findById(order.channelId);
//         if (!channel || !channel.isActive) return;

//         await sendReply({
//             platform: order.platform,
//             channel,
//             recipientId: order.customer.senderId,
//             text: messageFn(order),
//         });
//         console.log(`📤 Status notification → customer: ${order.orderId} (${order.status})`);
//     } catch (err) {
//         console.warn('Customer notification failed:', err.message);
//     }
// }

// // ── GET /api/orders ───────────────────────────────────────────
// exports.getOrders = async (req, res) => {
//     try {
//         const { status, platform, page = 1, limit = 20, search } = req.query;
//         const filter = { userId: req.user._id };
//         if (status) filter.status = status;
//         if (platform) filter.platform = platform;
//         if (search) {
//             filter.$or = [
//                 { 'customer.name': { $regex: search, $options: 'i' } },
//                 { 'customer.phone': { $regex: search, $options: 'i' } },
//                 { 'product.name': { $regex: search, $options: 'i' } },
//                 { orderId: { $regex: search, $options: 'i' } },
//             ];
//         }

//         const [orders, total] = await Promise.all([
//             Order.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
//             Order.countDocuments(filter),
//         ]);

//         const stats = await Order.aggregate([
//             { $match: { userId: req.user._id } },
//             { $group: { _id: '$status', count: { $sum: 1 } } },
//         ]);
//         const statusCounts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
//         stats.forEach(s => { statusCounts[s._id] = s.count; });

//         res.json({ success: true, orders, total, page: Number(page), stats: statusCounts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/orders/:orderId ──────────────────────────────────
// exports.getOrder = async (req, res) => {
//     try {
//         const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user._id });
//         if (!order) return res.status(404).json({ message: 'Order not found' });
//         res.json({ success: true, order });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/orders/:orderId/status — status + notify ─────
// exports.updateStatus = async (req, res) => {
//     try {
//         const { status, notes } = req.body;
//         const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
//         if (!valid.includes(status)) {
//             return res.status(400).json({ message: `Invalid status. Must be: ${valid.join(', ')}` });
//         }

//         const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user._id });
//         if (!order) return res.status(404).json({ message: 'Order not found' });

//         const statusChanged = order.status !== status;
//         order.status = status;
//         if (notes) order.notes = notes;
//         await order.save();

//         // Status পরিবর্তন হলে customer কে auto message পাঠাও
//         if (statusChanged && order.lastNotifiedStatus !== status) {
//             await notifyCustomer(order);
//             order.lastNotifiedStatus = status;
//             await order.save();
//         }

//         res.json({ success: true, order });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/orders/:orderId ───────────────────────────────
// exports.deleteOrder = async (req, res) => {
//     try {
//         await Order.deleteOne({ orderId: req.params.orderId, userId: req.user._id });
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ══ API KEY MANAGEMENT ════════════════════════════════════════
// exports.getApiKeys = async (req, res) => {
//     try {
//         const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
//         const masked = keys.map(k => ({
//             _id: k._id, name: k.name,
//             key: k.key.substring(0, 12) + '••••••••••••••••',
//             isActive: k.isActive, requestCount: k.requestCount,
//             lastUsedAt: k.lastUsedAt, createdAt: k.createdAt,
//         }));
//         res.json({ success: true, keys: masked });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// exports.createApiKey = async (req, res) => {
//     try {
//         const { name } = req.body;
//         if (!name?.trim()) return res.status(400).json({ message: 'API key name required' });
//         const existing = await ApiKey.countDocuments({ userId: req.user._id, isActive: true });
//         if (existing >= 5) return res.status(400).json({ message: 'Maximum 5 API keys allowed' });

//         const apiKey = await ApiKey.create({ userId: req.user._id, name: name.trim() });
//         res.status(201).json({
//             success: true,
//             apiKey: { _id: apiKey._id, name: apiKey.name, key: apiKey.key, isActive: apiKey.isActive, createdAt: apiKey.createdAt },
//             message: '⚠️ এই API key একবারই দেখা যাবে। এখনই copy করুন।',
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// exports.revokeApiKey = async (req, res) => {
//     try {
//         await ApiKey.findOneAndUpdate({ _id: req.params.keyId, userId: req.user._id }, { isActive: false });
//         res.json({ success: true, message: 'API key revoked' });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// exports.notifyCustomer = notifyCustomer;










// const Order = require('../models/Order.model');
// const ApiKey = require('../models/ApiKey.model');
// const MetaChannel = require('../models/MetaChannel.model');
// const { sendReply } = require('../services/metaApi.service');
// const { emitToUser } = require('../config/socket');

// // ── Status অনুযায়ী customer কে message ─────────────────────
// const STATUS_MESSAGES = {
//     confirmed: (o) => `✅ আপনার order *${o.orderId}* confirm হয়েছে!\n📦 ${o.product.name}\n\nআমরা শীঘ্রই এটি প্রস্তুত করছি।`,
//     processing: (o) => `⚙️ আপনার order *${o.orderId}* এখন প্রস্তুত করা হচ্ছে।\n📦 ${o.product.name}`,
//     shipped: (o) => `🚚 সুখবর! আপনার order *${o.orderId}* পাঠানো হয়েছে।\n📦 ${o.product.name}\n📞 ${o.customer.phone}\n\nশীঘ্রই আপনার কাছে পৌঁছে যাবে!`,
//     delivered: (o) => `🎉 আপনার order *${o.orderId}* ডেলিভারি সম্পন্ন হয়েছে!\n\nআমাদের সাথে কেনাকাটার জন্য ধন্যবাদ! 🙏 আবার আসবেন।`,
//     cancelled: (o) => `❌ দুঃখিত, আপনার order *${o.orderId}* বাতিল করা হয়েছে।\n\nকোনো প্রশ্ন থাকলে আমাদের জানান।`,
// };

// // ── Customer কে status update পাঠাও ─────────────────────────
// async function notifyCustomer(order) {
//     try {
//         if (!order.channelId || !order.customer?.senderId) return;
//         const messageFn = STATUS_MESSAGES[order.status];
//         if (!messageFn) return;

//         const channel = await MetaChannel.findById(order.channelId);
//         if (!channel || !channel.isActive) return;

//         await sendReply({
//             platform: order.platform,
//             channel,
//             recipientId: order.customer.senderId,
//             text: messageFn(order),
//         });
//         console.log(`📤 Status notification → customer: ${order.orderId} (${order.status})`);
//     } catch (err) {
//         console.warn('Customer notification failed:', err.message);
//     }
// }

// // ── GET /api/orders ───────────────────────────────────────────
// exports.getOrders = async (req, res) => {
//     try {
//         const { status, platform, page = 1, limit = 20, search } = req.query;
//         const filter = { userId: req.user._id };
//         if (status) filter.status = status;
//         if (platform) filter.platform = platform;
//         if (search) {
//             filter.$or = [
//                 { 'customer.name': { $regex: search, $options: 'i' } },
//                 { 'customer.phone': { $regex: search, $options: 'i' } },
//                 { 'product.name': { $regex: search, $options: 'i' } },
//                 { orderId: { $regex: search, $options: 'i' } },
//             ];
//         }

//         const [orders, total] = await Promise.all([
//             Order.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
//             Order.countDocuments(filter),
//         ]);

//         const stats = await Order.aggregate([
//             { $match: { userId: req.user._id } },
//             { $group: { _id: '$status', count: { $sum: 1 } } },
//         ]);
//         const statusCounts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
//         stats.forEach(s => { statusCounts[s._id] = s.count; });

//         res.json({ success: true, orders, total, page: Number(page), stats: statusCounts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/orders/:orderId ──────────────────────────────────
// exports.getOrder = async (req, res) => {
//     try {
//         const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user._id });
//         if (!order) return res.status(404).json({ message: 'Order not found' });
//         res.json({ success: true, order });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/orders/:orderId/status — status + notify ─────
// exports.updateStatus = async (req, res) => {
//     try {
//         const { status, notes } = req.body;
//         const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
//         if (!valid.includes(status)) {
//             return res.status(400).json({ message: `Invalid status. Must be: ${valid.join(', ')}` });
//         }

//         const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user._id });
//         if (!order) return res.status(404).json({ message: 'Order not found' });

//         const statusChanged = order.status !== status;
//         order.status = status;
//         if (notes) order.notes = notes;
//         await order.save();

//         // Status পরিবর্তন হলে customer কে auto message পাঠাও
//         if (statusChanged && order.lastNotifiedStatus !== status) {
//             await notifyCustomer(order);
//             order.lastNotifiedStatus = status;
//             await order.save();
//         }

//         // Real-time: order update
//         emitToUser(req.user._id, 'order:updated', { order });

//         res.json({ success: true, order });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/orders/:orderId ───────────────────────────────
// exports.deleteOrder = async (req, res) => {
//     try {
//         await Order.deleteOne({ orderId: req.params.orderId, userId: req.user._id });
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ══ API KEY MANAGEMENT ════════════════════════════════════════
// exports.getApiKeys = async (req, res) => {
//     try {
//         const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
//         const masked = keys.map(k => ({
//             _id: k._id, name: k.name,
//             key: k.key.substring(0, 12) + '••••••••••••••••',
//             isActive: k.isActive, requestCount: k.requestCount,
//             lastUsedAt: k.lastUsedAt, createdAt: k.createdAt,
//         }));
//         res.json({ success: true, keys: masked });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// exports.createApiKey = async (req, res) => {
//     try {
//         const { name } = req.body;
//         if (!name?.trim()) return res.status(400).json({ message: 'API key name required' });
//         const existing = await ApiKey.countDocuments({ userId: req.user._id, isActive: true });
//         if (existing >= 5) return res.status(400).json({ message: 'Maximum 5 API keys allowed' });

//         const apiKey = await ApiKey.create({ userId: req.user._id, name: name.trim() });
//         res.status(201).json({
//             success: true,
//             apiKey: { _id: apiKey._id, name: apiKey.name, key: apiKey.key, isActive: apiKey.isActive, createdAt: apiKey.createdAt },
//             message: '⚠️ এই API key একবারই দেখা যাবে। এখনই copy করুন।',
//         });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// exports.revokeApiKey = async (req, res) => {
//     try {
//         await ApiKey.findOneAndUpdate({ _id: req.params.keyId, userId: req.user._id }, { isActive: false });
//         res.json({ success: true, message: 'API key revoked' });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// exports.notifyCustomer = notifyCustomer;













const MetaChannel = require('../models/MetaChannel.model');
const MetaMessage = require('../models/MetaMessage.model');
const { sendReply, verifyWebhook, extractMessage, getSenderProfile } = require('../services/metaApi.service');
const { sendMessage: ragSend } = require('../services/langchain.service');
const { searchSimilar } = require('../services/vectorStore.service');
const { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl } = require('../services/vision.service');
const { handleOrderFlow } = require('../services/orderFlow.service');
const { emitToUser } = require('../config/socket');

// imageUpload.service optional — না থাকলেও crash করবে না
let uploadBase64 = async () => '';
try {
    ({ uploadBase64 } = require('../services/imageUpload.service'));
} catch (e) {
    console.warn('⚠️ imageUpload.service not found — Cloudinary disabled');
}

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

                // Customer এর পাঠানো image টি Cloudinary তে upload করো (permanent URL)
                // WhatsApp/Messenger এর original URL temporary, তাই Cloudinary তে save করি
                let customerImageUrl = '';
                try {
                    customerImageUrl = await uploadBase64(base64, mimeType);
                } catch (e) {
                    console.warn('Cloudinary upload skipped:', e.message);
                }
                // Cloudinary fail করলে fallback (Messenger এর direct URL)
                if (!customerImageUrl) {
                    customerImageUrl = msgData.imageUrl || '';
                }

                // Customer এর পাঠানো image টি message এ save করো (Inbox এ দেখাতে)
                if (customerImageUrl) {
                    metaMsg.customerMessage = customerImageUrl;
                    metaMsg.messageType = 'image';
                    await metaMsg.save();
                    emitToUser(channel.userId._id, 'meta:message_updated', { message: metaMsg });
                }

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