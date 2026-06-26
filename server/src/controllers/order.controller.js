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













const Order = require('../models/Order.model');
const ApiKey = require('../models/ApiKey.model');
const MetaChannel = require('../models/MetaChannel.model');
const { sendReply } = require('../services/metaApi.service');
const { emitToUser } = require('../config/socket');

// ── Status অনুযায়ী customer কে message ─────────────────────
const STATUS_MESSAGES = {
    confirmed: (o) => `✅ আপনার order *${o.orderId}* confirm হয়েছে!\n📦 ${o.product.name}\n\nআমরা শীঘ্রই এটি প্রস্তুত করছি।`,
    processing: (o) => `⚙️ আপনার order *${o.orderId}* এখন প্রস্তুত করা হচ্ছে।\n📦 ${o.product.name}`,
    shipped: (o) => `🚚 সুখবর! আপনার order *${o.orderId}* পাঠানো হয়েছে।\n📦 ${o.product.name}\n📞 ${o.customer.phone}\n\nশীঘ্রই আপনার কাছে পৌঁছে যাবে!`,
    delivered: (o) => `🎉 আপনার order *${o.orderId}* ডেলিভারি সম্পন্ন হয়েছে!\n\nআমাদের সাথে কেনাকাটার জন্য ধন্যবাদ! 🙏 আবার আসবেন।`,
    cancelled: (o) => `❌ দুঃখিত, আপনার order *${o.orderId}* বাতিল করা হয়েছে।\n\nকোনো প্রশ্ন থাকলে আমাদের জানান।`,
};

// ── Customer কে status update পাঠাও ─────────────────────────
async function notifyCustomer(order) {
    try {
        if (!order.channelId || !order.customer?.senderId) return;
        const messageFn = STATUS_MESSAGES[order.status];
        if (!messageFn) return;

        const channel = await MetaChannel.findById(order.channelId);
        if (!channel || !channel.isActive) return;

        await sendReply({
            platform: order.platform,
            channel,
            recipientId: order.customer.senderId,
            text: messageFn(order),
        });
        console.log(`📤 Status notification → customer: ${order.orderId} (${order.status})`);
    } catch (err) {
        console.warn('Customer notification failed:', err.message);
    }
}

// ── GET /api/orders ───────────────────────────────────────────
exports.getOrders = async (req, res) => {
    try {
        const { status, platform, page = 1, limit = 20, search } = req.query;
        const filter = { userId: req.user._id };
        if (status) filter.status = status;
        if (platform) filter.platform = platform;
        if (search) {
            filter.$or = [
                { 'customer.name': { $regex: search, $options: 'i' } },
                { 'customer.phone': { $regex: search, $options: 'i' } },
                { 'product.name': { $regex: search, $options: 'i' } },
                { orderId: { $regex: search, $options: 'i' } },
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
            Order.countDocuments(filter),
        ]);

        const stats = await Order.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const statusCounts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
        stats.forEach(s => { statusCounts[s._id] = s.count; });

        res.json({ success: true, orders, total, page: Number(page), stats: statusCounts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/orders/:orderId ──────────────────────────────────
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/orders/:orderId/status — status + notify ─────
exports.updateStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!valid.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be: ${valid.join(', ')}` });
        }

        const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const statusChanged = order.status !== status;
        order.status = status;
        if (notes) order.notes = notes;
        await order.save();

        // Status পরিবর্তন হলে customer কে auto message পাঠাও
        if (statusChanged && order.lastNotifiedStatus !== status) {
            await notifyCustomer(order);
            order.lastNotifiedStatus = status;
            await order.save();
        }

        // Real-time: order update
        emitToUser(req.user._id, 'order:updated', { order });

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/orders/:orderId ───────────────────────────────
exports.deleteOrder = async (req, res) => {
    try {
        await Order.deleteOne({ orderId: req.params.orderId, userId: req.user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ══ API KEY MANAGEMENT ════════════════════════════════════════
exports.getApiKeys = async (req, res) => {
    try {
        const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
        const masked = keys.map(k => ({
            _id: k._id, name: k.name,
            key: k.key.substring(0, 12) + '••••••••••••••••',
            isActive: k.isActive, requestCount: k.requestCount,
            lastUsedAt: k.lastUsedAt, createdAt: k.createdAt,
        }));
        res.json({ success: true, keys: masked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createApiKey = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ message: 'API key name required' });
        const existing = await ApiKey.countDocuments({ userId: req.user._id, isActive: true });
        if (existing >= 5) return res.status(400).json({ message: 'Maximum 5 API keys allowed' });

        const apiKey = await ApiKey.create({ userId: req.user._id, name: name.trim() });
        res.status(201).json({
            success: true,
            apiKey: { _id: apiKey._id, name: apiKey.name, key: apiKey.key, isActive: apiKey.isActive, createdAt: apiKey.createdAt },
            message: '⚠️ এই API key একবারই দেখা যাবে। এখনই copy করুন।',
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.revokeApiKey = async (req, res) => {
    try {
        await ApiKey.findOneAndUpdate({ _id: req.params.keyId, userId: req.user._id }, { isActive: false });
        res.json({ success: true, message: 'API key revoked' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.notifyCustomer = notifyCustomer;