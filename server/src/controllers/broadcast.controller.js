// const Broadcast = require('../models/Broadcast.model');
// const Contact = require('../models/Contact.model');
// const MetaChannel = require('../models/MetaChannel.model');
// const { sendReply } = require('../services/metaApi.service');
// const { emitToUser } = require('../config/socket');

// // sleep helper (rate limit মেনে চলতে)
// const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// // ── GET /api/broadcasts ──────────────────────────────────────
// exports.getBroadcasts = async (req, res) => {
//     try {
//         const broadcasts = await Broadcast.find({ userId: req.user._id })
//             .populate('channelId', 'name platform')
//             .sort({ createdAt: -1 }).limit(50);
//         res.json({ success: true, broadcasts });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/broadcasts/preview ─────────────────────────────
// // কতজন recipient হবে দেখাও (confirm করার আগে)
// exports.previewBroadcast = async (req, res) => {
//     try {
//         const { channelId, targetTag } = req.body;
//         const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         const filter = { userId: req.user._id, channelId };
//         if (targetTag) filter.tags = targetTag;

//         const count = await Contact.countDocuments(filter);
//         res.json({ success: true, count, platform: channel.platform });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/broadcasts ─────────────────────────────────────
// // Broadcast তৈরি করে পাঠানো শুরু করো
// exports.sendBroadcast = async (req, res) => {
//     try {
//         const { name, message, imageUrl, channelId, targetTag } = req.body;

//         if (!message?.trim() && !imageUrl) {
//             return res.status(400).json({ message: 'message অথবা image দরকার' });
//         }

//         const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         // Recipient খুঁজো
//         const filter = { userId: req.user._id, channelId };
//         if (targetTag) filter.tags = targetTag;
//         const contacts = await Contact.find(filter).select('senderId name');

//         if (contacts.length === 0) {
//             return res.status(400).json({ message: 'কোনো recipient নেই' });
//         }

//         // Broadcast record তৈরি করো
//         const broadcast = await Broadcast.create({
//             userId: req.user._id,
//             name: name || `Broadcast ${new Date().toLocaleDateString()}`,
//             message: message || '',
//             imageUrl: imageUrl || '',
//             channelId,
//             platform: channel.platform,
//             targetTag: targetTag || '',
//             status: 'sending',
//             totalRecipients: contacts.length,
//             startedAt: new Date(),
//         });

//         // সাথে সাথে response দাও — পাঠানো background এ চলবে
//         res.json({ success: true, broadcast });

//         // ── Background এ ধীরে ধীরে পাঠাও (rate limit) ──
//         processBroadcast(broadcast, contacts, channel, req.user._id);

//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── Background sender (rate limit মেনে) ──────────────────────
// async function processBroadcast(broadcast, contacts, channel, userId) {
//     // Meta rate limit: প্রতি সেকেন্ডে নিরাপদে ~10-20টা (80 max, কিন্তু safe থাকি)
//     // প্রতি message এর মাঝে delay
//     const DELAY_MS = 120;   // ~8/সেকেন্ড — নিরাপদ

//     for (const contact of contacts) {
//         try {
//             if (broadcast.imageUrl) {
//                 await sendReply({
//                     platform: channel.platform, channel,
//                     recipientId: contact.senderId,
//                     imageUrl: broadcast.imageUrl,
//                     caption: broadcast.message,
//                 });
//             } else {
//                 await sendReply({
//                     platform: channel.platform, channel,
//                     recipientId: contact.senderId,
//                     text: broadcast.message,
//                 });
//             }
//             broadcast.sentCount += 1;
//         } catch (err) {
//             broadcast.failedCount += 1;
//             broadcast.errors.push({
//                 senderId: contact.senderId,
//                 error: err.message?.slice(0, 200) || 'unknown',
//             });
//         }

//         // প্রতি ৫টা পর progress update (real-time)
//         if ((broadcast.sentCount + broadcast.failedCount) % 5 === 0) {
//             await broadcast.save();
//             emitToUser(userId, 'broadcast:progress', {
//                 broadcastId: broadcast._id,
//                 sent: broadcast.sentCount,
//                 failed: broadcast.failedCount,
//                 total: broadcast.totalRecipients,
//             });
//         }

//         await sleep(DELAY_MS);
//     }

//     // শেষ
//     broadcast.status = 'completed';
//     broadcast.completedAt = new Date();
//     await broadcast.save();

//     emitToUser(userId, 'broadcast:done', {
//         broadcastId: broadcast._id,
//         sent: broadcast.sentCount,
//         failed: broadcast.failedCount,
//         total: broadcast.totalRecipients,
//     });
// }

// module.exports = exports;














const Broadcast = require('../models/Broadcast.model');
const Contact = require('../models/Contact.model');
const MetaChannel = require('../models/MetaChannel.model');
const { sendReply } = require('../services/metaApi.service');
const { emitToUser } = require('../config/socket');

// sleep helper (rate limit মেনে চলতে)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── GET /api/broadcasts ──────────────────────────────────────
exports.getBroadcasts = async (req, res) => {
    try {
        const broadcasts = await Broadcast.find({ userId: req.user._id })
            .populate('channelId', 'name platform')
            .sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, broadcasts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/broadcasts/preview ─────────────────────────────
// কতজন recipient হবে দেখাও (confirm করার আগে)
exports.previewBroadcast = async (req, res) => {
    try {
        const { channelId, targetTag, targetTags } = req.body;
        const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        const filter = { userId: req.user._id, channelId };
        // multiple group/tag support — যেকোনো একটা tag মিললেই
        const tags = targetTags?.length ? targetTags : (targetTag ? [targetTag] : []);
        if (tags.length) filter.tags = { $in: tags };

        const count = await Contact.countDocuments(filter);
        res.json({ success: true, count, platform: channel.platform });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/broadcasts ─────────────────────────────────────
// Broadcast তৈরি করে পাঠানো শুরু করো
exports.sendBroadcast = async (req, res) => {
    try {
        const { name, message, imageUrl, channelId, targetTag, targetTags } = req.body;

        if (!message?.trim() && !imageUrl) {
            return res.status(400).json({ message: 'message অথবা image দরকার' });
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        // Recipient খুঁজো — multiple group/tag support
        const filter = { userId: req.user._id, channelId };
        const tags = targetTags?.length ? targetTags : (targetTag ? [targetTag] : []);
        if (tags.length) filter.tags = { $in: tags };
        const contacts = await Contact.find(filter).select('senderId name');

        if (contacts.length === 0) {
            return res.status(400).json({ message: 'কোনো recipient নেই' });
        }

        // Broadcast record তৈরি করো
        const broadcast = await Broadcast.create({
            userId: req.user._id,
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

        // সাথে সাথে response দাও — পাঠানো background এ চলবে
        res.json({ success: true, broadcast });

        // ── Background এ ধীরে ধীরে পাঠাও (rate limit) ──
        processBroadcast(broadcast, contacts, channel, req.user._id);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Background sender (rate limit মেনে) ──────────────────────
async function processBroadcast(broadcast, contacts, channel, userId) {
    // Meta rate limit: প্রতি সেকেন্ডে নিরাপদে ~10-20টা (80 max, কিন্তু safe থাকি)
    // প্রতি message এর মাঝে delay
    const DELAY_MS = 120;   // ~8/সেকেন্ড — নিরাপদ

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
        } catch (err) {
            broadcast.failedCount += 1;
            broadcast.errors.push({
                senderId: contact.senderId,
                error: err.message?.slice(0, 200) || 'unknown',
            });
        }

        // প্রতি ৫টা পর progress update (real-time)
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

    // শেষ
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