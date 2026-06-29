// const MetaMessage = require('../models/MetaMessage.model');
// const MetaChannel = require('../models/MetaChannel.model');
// const { sendReply } = require('../services/metaApi.service');
// const { uploadBase64 } = require('../services/imageUpload.service');
// const { emitToUser } = require('../config/socket');

// // ── GET /api/conversations ───────────────────────────────────
// // প্রতি customer (senderId) এর সর্বশেষ message + unread count
// // platform filter: ?platform=messenger|whatsapp|instagram
// exports.getConversations = async (req, res) => {
//     try {
//         const { platform, search } = req.query;

//         const match = { userId: req.user._id };
//         if (platform && platform !== 'all') match.platform = platform;

//         // প্রতি senderId+channel এর সর্বশেষ message নাও (aggregate)
//         const pipeline = [
//             { $match: match },
//             { $sort: { createdAt: -1 } },
//             {
//                 $group: {
//                     _id: { senderId: '$senderId', channelId: '$channelId' },
//                     lastMessage: { $first: '$$ROOT' },
//                     messageCount: { $sum: 1 },
//                     unreadCount: { $sum: { $cond: [{ $eq: ['$status', 'review_needed'] }, 1, 0] } },
//                 },
//             },
//             { $sort: { 'lastMessage.createdAt': -1 } },
//             { $limit: 100 },
//         ];

//         let conversations = await MetaMessage.aggregate(pipeline);

//         // Format করো
//         conversations = conversations.map(c => ({
//             senderId: c._id.senderId,
//             channelId: c._id.channelId,
//             platform: c.lastMessage.platform,
//             senderName: c.lastMessage.senderName,
//             senderProfilePic: c.lastMessage.senderProfilePic,
//             lastMessage: {
//                 text: c.lastMessage.finalReply || c.lastMessage.customerMessage,
//                 fromAI: !!c.lastMessage.finalReply,
//                 createdAt: c.lastMessage.createdAt,
//                 status: c.lastMessage.status,
//             },
//             messageCount: c.messageCount,
//             unreadCount: c.unreadCount,
//         }));

//         // Search filter (নাম বা phone দিয়ে)
//         if (search) {
//             const s = search.toLowerCase();
//             conversations = conversations.filter(c =>
//                 c.senderName?.toLowerCase().includes(s) || c.senderId?.includes(s)
//             );
//         }

//         res.json({ success: true, conversations });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/conversations/:senderId/:channelId ──────────────
// // একটা customer এর full conversation (সব message ক্রমানুসারে)
// exports.getConversation = async (req, res) => {
//     try {
//         const { senderId, channelId } = req.params;

//         const messages = await MetaMessage.find({
//             userId: req.user._id,
//             senderId,
//             channelId,
//         }).sort({ createdAt: 1 });   // পুরোনো → নতুন (chat order)

//         // প্রতিটা message কে chat bubble format এ পরিণত করো
//         // একটা customer message + তার AI/human reply = ২টা bubble
//         const bubbles = [];
//         for (const m of messages) {
//             // Customer এর message (বাম দিকে)
//             bubbles.push({
//                 _id: m._id + '_in',
//                 from: 'customer',
//                 text: m.customerMessage,
//                 type: m.messageType,
//                 createdAt: m.createdAt,
//             });
//             // AI/Human reply (ডান দিকে)
//             if (m.finalReply) {
//                 bubbles.push({
//                     _id: m._id + '_out',
//                     from: m.status === 'human_replied' ? 'human' : 'ai',
//                     text: m.finalReply,
//                     repliedBy: m.humanRepliedBy?.name || (m.status === 'human_replied' ? 'Agent' : 'AI'),
//                     createdAt: m.repliedAt || m.createdAt,
//                     status: m.status,
//                 });
//             }
//         }

//         // Customer info
//         const first = messages[0];
//         const contact = first ? {
//             senderId,
//             channelId,
//             platform: first.platform,
//             name: first.senderName,
//             profilePic: first.senderProfilePic,
//             // WhatsApp হলে senderId ই phone number
//             phone: first.platform === 'whatsapp' ? senderId : '',
//         } : null;

//         res.json({ success: true, contact, messages: bubbles });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/conversations/:senderId/:channelId/reply ───────
// // Manual reply পাঠাও (text + optional image)
// exports.sendMessage = async (req, res) => {
//     try {
//         const { senderId, channelId } = req.params;
//         const { text, imageBase64, imageMimeType } = req.body;

//         if (!text?.trim() && !imageBase64) {
//             return res.status(400).json({ message: 'text অথবা image দরকার' });
//         }

//         const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         let imageUrl = '';
//         if (imageBase64) {
//             imageUrl = await uploadBase64(imageBase64, imageMimeType || 'image/jpeg', 'softbrainchat/sent');
//         }

//         // Message পাঠাও (text)
//         const replyText = text?.trim() || '';
//         if (replyText) {
//             await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: replyText });
//         }
//         // Image থাকলে আলাদাভাবে পাঠাও (URL হিসেবে)
//         if (imageUrl) {
//             await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: imageUrl });
//         }

//         // DB তে save করো (একটা নতুন MetaMessage হিসেবে — human reply)
//         const finalText = replyText + (imageUrl ? `\n${imageUrl}` : '');
//         const msg = await MetaMessage.create({
//             userId: req.user._id,
//             channelId,
//             platform: channel.platform,
//             senderId,
//             senderName: 'Customer',
//             customerMessage: '[Agent initiated]',
//             messageType: 'text',
//             metaMessageId: `manual-${Date.now()}`,
//             finalReply: finalText,
//             humanReply: finalText,
//             status: 'human_replied',
//             replySent: true,
//             repliedAt: new Date(),
//             humanRepliedBy: {
//                 userId: req.user._id,
//                 name: req.user.name,
//                 email: req.user.email,
//                 photo: req.user.photo || '',
//                 repliedAt: new Date(),
//             },
//         });

//         emitToUser(req.user._id, 'meta:message_updated', { message: msg });

//         res.json({ success: true, imageUrl });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = exports;




// const MetaMessage = require('../models/MetaMessage.model');
// const MetaChannel = require('../models/MetaChannel.model');
// const { sendReply } = require('../services/metaApi.service');
// const { emitToUser } = require('../config/socket');

// // imageUpload.service optional — না থাকলেও crash করবে না
// let uploadBase64 = async () => '';
// try {
//     ({ uploadBase64 } = require('../services/imageUpload.service'));
// } catch (e) {
//     console.warn('⚠️ imageUpload.service not found — image sending disabled');
// }

// // ── GET /api/conversations ───────────────────────────────────
// // প্রতি customer (senderId) এর সর্বশেষ message + unread count
// // platform filter: ?platform=messenger|whatsapp|instagram
// exports.getConversations = async (req, res) => {
//     try {
//         const { platform, search } = req.query;

//         const match = { userId: req.user._id };
//         if (platform && platform !== 'all') match.platform = platform;

//         // প্রতি senderId+channel এর সর্বশেষ message নাও (aggregate)
//         const pipeline = [
//             { $match: match },
//             { $sort: { createdAt: -1 } },
//             {
//                 $group: {
//                     _id: { senderId: '$senderId', channelId: '$channelId' },
//                     lastMessage: { $first: '$$ROOT' },
//                     messageCount: { $sum: 1 },
//                     unreadCount: { $sum: { $cond: [{ $eq: ['$status', 'review_needed'] }, 1, 0] } },
//                 },
//             },
//             { $sort: { 'lastMessage.createdAt': -1 } },
//             { $limit: 100 },
//         ];

//         let conversations = await MetaMessage.aggregate(pipeline);

//         // Format করো
//         conversations = conversations.map(c => ({
//             senderId: c._id.senderId,
//             channelId: c._id.channelId,
//             platform: c.lastMessage.platform,
//             senderName: c.lastMessage.senderName,
//             senderProfilePic: c.lastMessage.senderProfilePic,
//             lastMessage: {
//                 text: c.lastMessage.finalReply || c.lastMessage.customerMessage,
//                 fromAI: !!c.lastMessage.finalReply,
//                 createdAt: c.lastMessage.createdAt,
//                 status: c.lastMessage.status,
//             },
//             messageCount: c.messageCount,
//             unreadCount: c.unreadCount,
//         }));

//         // Search filter (নাম বা phone দিয়ে)
//         if (search) {
//             const s = search.toLowerCase();
//             conversations = conversations.filter(c =>
//                 c.senderName?.toLowerCase().includes(s) || c.senderId?.includes(s)
//             );
//         }

//         res.json({ success: true, conversations });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/conversations/:senderId/:channelId ──────────────
// // একটা customer এর full conversation (সব message ক্রমানুসারে)
// exports.getConversation = async (req, res) => {
//     try {
//         const { senderId, channelId } = req.params;

//         const messages = await MetaMessage.find({
//             userId: req.user._id,
//             senderId,
//             channelId,
//         }).sort({ createdAt: 1 });   // পুরোনো → নতুন (chat order)

//         // প্রতিটা message কে chat bubble format এ পরিণত করো
//         // একটা customer message + তার AI/human reply = ২টা bubble
//         const bubbles = [];
//         for (const m of messages) {
//             // Customer এর message (বাম দিকে) — placeholder skip করো
//             if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
//                 bubbles.push({
//                     _id: m._id + '_in',
//                     from: 'customer',
//                     text: m.customerMessage,
//                     type: m.messageType,
//                     createdAt: m.createdAt,
//                 });
//             }
//             // AI/Human reply (ডান দিকে)
//             if (m.finalReply) {
//                 bubbles.push({
//                     _id: m._id + '_out',
//                     from: m.status === 'human_replied' ? 'human' : 'ai',
//                     text: m.finalReply,
//                     repliedBy: m.humanRepliedBy?.name || (m.status === 'human_replied' ? 'Agent' : 'AI'),
//                     createdAt: m.repliedAt || m.createdAt,
//                     status: m.status,
//                 });
//             }
//         }

//         // Customer info
//         const first = messages[0];
//         const contact = first ? {
//             senderId,
//             channelId,
//             platform: first.platform,
//             name: first.senderName,
//             profilePic: first.senderProfilePic,
//             // WhatsApp হলে senderId ই phone number
//             phone: first.platform === 'whatsapp' ? senderId : '',
//         } : null;

//         res.json({ success: true, contact, messages: bubbles });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/conversations/:senderId/:channelId/reply ───────
// // Manual reply পাঠাও (text + optional image)
// exports.sendMessage = async (req, res) => {
//     try {
//         const { senderId, channelId } = req.params;
//         const { text, imageBase64, imageMimeType } = req.body;

//         if (!text?.trim() && !imageBase64) {
//             return res.status(400).json({ message: 'text অথবা image দরকার' });
//         }

//         const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         let imageUrl = '';
//         if (imageBase64) {
//             imageUrl = await uploadBase64(imageBase64, imageMimeType || 'image/jpeg', 'softbrainchat/sent');
//         }

//         // Message পাঠাও (text)
//         const replyText = text?.trim() || '';
//         if (replyText) {
//             await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: replyText });
//         }
//         // Image থাকলে আলাদাভাবে পাঠাও (URL হিসেবে)
//         if (imageUrl) {
//             await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: imageUrl });
//         }

//         // DB তে save করো (একটা নতুন MetaMessage হিসেবে — human reply)
//         const finalText = replyText + (imageUrl ? `\n${imageUrl}` : '');
//         const msg = await MetaMessage.create({
//             userId: req.user._id,
//             channelId,
//             platform: channel.platform,
//             senderId,
//             senderName: 'Customer',
//             customerMessage: '[Agent initiated]',
//             messageType: 'text',
//             metaMessageId: `manual-${Date.now()}`,
//             finalReply: finalText,
//             humanReply: finalText,
//             status: 'human_replied',
//             replySent: true,
//             repliedAt: new Date(),
//             humanRepliedBy: {
//                 userId: req.user._id,
//                 name: req.user.name,
//                 email: req.user.email,
//                 photo: req.user.photo || '',
//                 repliedAt: new Date(),
//             },
//         });

//         emitToUser(req.user._id, 'meta:message_updated', { message: msg });

//         res.json({ success: true, imageUrl });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = exports;






















// const MetaMessage = require('../models/MetaMessage.model');
// const MetaChannel = require('../models/MetaChannel.model');
// const { sendReply } = require('../services/metaApi.service');
// const { emitToUser } = require('../config/socket');

// // imageUpload.service optional — না থাকলেও crash করবে না
// let uploadBase64 = async () => '';
// try {
//     ({ uploadBase64 } = require('../services/imageUpload.service'));
// } catch (e) {
//     console.warn('⚠️ imageUpload.service not found — image sending disabled');
// }

// // ── GET /api/conversations ───────────────────────────────────
// // প্রতি customer (senderId) এর সর্বশেষ message + unread count
// // platform filter: ?platform=messenger|whatsapp|instagram
// exports.getConversations = async (req, res) => {
//     try {
//         const { platform, search } = req.query;

//         const match = { userId: req.user._id };
//         if (platform && platform !== 'all') match.platform = platform;

//         // প্রতি senderId+channel এর সর্বশেষ message নাও (aggregate)
//         const pipeline = [
//             { $match: match },
//             { $sort: { createdAt: -1 } },
//             {
//                 $group: {
//                     _id: { senderId: '$senderId', channelId: '$channelId' },
//                     lastMessage: { $first: '$$ROOT' },
//                     messageCount: { $sum: 1 },
//                     unreadCount: { $sum: { $cond: [{ $eq: ['$status', 'review_needed'] }, 1, 0] } },
//                 },
//             },
//             { $sort: { 'lastMessage.createdAt': -1 } },
//             { $limit: 100 },
//         ];

//         let conversations = await MetaMessage.aggregate(pipeline);

//         // Format করো
//         conversations = conversations.map(c => ({
//             senderId: c._id.senderId,
//             channelId: c._id.channelId,
//             platform: c.lastMessage.platform,
//             senderName: c.lastMessage.senderName,
//             senderProfilePic: c.lastMessage.senderProfilePic,
//             lastMessage: {
//                 text: c.lastMessage.finalReply || c.lastMessage.customerMessage,
//                 fromAI: !!c.lastMessage.finalReply,
//                 createdAt: c.lastMessage.createdAt,
//                 status: c.lastMessage.status,
//             },
//             messageCount: c.messageCount,
//             unreadCount: c.unreadCount,
//         }));

//         // Search filter (নাম বা phone দিয়ে)
//         if (search) {
//             const s = search.toLowerCase();
//             conversations = conversations.filter(c =>
//                 c.senderName?.toLowerCase().includes(s) || c.senderId?.includes(s)
//             );
//         }

//         res.json({ success: true, conversations });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/conversations/:senderId/:channelId ──────────────
// // একটা customer এর full conversation (সব message ক্রমানুসারে)
// exports.getConversation = async (req, res) => {
//     try {
//         const { senderId, channelId } = req.params;

//         const messages = await MetaMessage.find({
//             userId: req.user._id,
//             senderId,
//             channelId,
//         }).sort({ createdAt: 1 });   // পুরোনো → নতুন (chat order)

//         // প্রতিটা message কে chat bubble format এ পরিণত করো
//         // একটা customer message + তার AI/human reply = ২টা bubble
//         const bubbles = [];
//         for (const m of messages) {
//             // Customer এর message (বাম দিকে) — placeholder skip করো
//             if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
//                 bubbles.push({
//                     _id: m._id + '_in',
//                     from: 'customer',
//                     text: m.customerMessage,
//                     type: m.messageType,
//                     createdAt: m.createdAt,
//                 });
//             }
//             // AI/Human reply (ডান দিকে)
//             if (m.finalReply) {
//                 bubbles.push({
//                     _id: m._id + '_out',
//                     from: m.status === 'human_replied' ? 'human' : 'ai',
//                     text: m.finalReply,
//                     repliedBy: m.humanRepliedBy?.name || (m.status === 'human_replied' ? 'Agent' : 'AI'),
//                     createdAt: m.repliedAt || m.createdAt,
//                     status: m.status,
//                 });
//             }
//         }

//         // Customer info
//         const first = messages[0];
//         const contact = first ? {
//             senderId,
//             channelId,
//             platform: first.platform,
//             name: first.senderName,
//             profilePic: first.senderProfilePic,
//             // WhatsApp হলে senderId ই phone number
//             phone: first.platform === 'whatsapp' ? senderId : '',
//         } : null;

//         res.json({ success: true, contact, messages: bubbles });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/conversations/:senderId/:channelId/reply ───────
// // Manual reply পাঠাও (text + optional image)
// exports.sendMessage = async (req, res) => {
//     try {
//         const { senderId, channelId } = req.params;
//         const { text, imageBase64, imageMimeType } = req.body;

//         if (!text?.trim() && !imageBase64) {
//             return res.status(400).json({ message: 'text অথবা image দরকার' });
//         }

//         const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         let imageUrl = '';
//         if (imageBase64) {
//             imageUrl = await uploadBase64(imageBase64, imageMimeType || 'image/jpeg', 'softbrainchat/sent');
//         }

//         // Message পাঠাও (text)
//         const replyText = text?.trim() || '';
//         if (replyText) {
//             await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: replyText });
//         }
//         // Image থাকলে আসল image হিসেবে পাঠাও (URL text নয়)
//         if (imageUrl) {
//             await sendReply({ platform: channel.platform, channel, recipientId: senderId, imageUrl });
//         }

//         // DB তে save করো (একটা নতুন MetaMessage হিসেবে — human reply)
//         const finalText = replyText + (imageUrl ? `\n${imageUrl}` : '');
//         const msg = await MetaMessage.create({
//             userId: req.user._id,
//             channelId,
//             platform: channel.platform,
//             senderId,
//             senderName: 'Customer',
//             customerMessage: '[Agent initiated]',
//             messageType: 'text',
//             metaMessageId: `manual-${Date.now()}`,
//             finalReply: finalText,
//             humanReply: finalText,
//             status: 'human_replied',
//             replySent: true,
//             repliedAt: new Date(),
//             humanRepliedBy: {
//                 userId: req.user._id,
//                 name: req.user.name,
//                 email: req.user.email,
//                 photo: req.user.photo || '',
//                 repliedAt: new Date(),
//             },
//         });

//         emitToUser(req.user._id, 'meta:message_updated', { message: msg });

//         res.json({ success: true, imageUrl });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = exports;













const MetaMessage = require('../models/MetaMessage.model');
const MetaChannel = require('../models/MetaChannel.model');
const { sendReply } = require('../services/metaApi.service');
const { emitToUser } = require('../config/socket');

// imageUpload.service optional — না থাকলেও crash করবে না
let uploadBase64 = async () => '';
try {
    ({ uploadBase64 } = require('../services/imageUpload.service'));
} catch (e) {
    console.warn('⚠️ imageUpload.service not found — image sending disabled');
}

// ── GET /api/conversations ───────────────────────────────────
// প্রতি customer (senderId) এর সর্বশেষ message + unread count
// platform filter: ?platform=messenger|whatsapp|instagram
exports.getConversations = async (req, res) => {
    try {
        const { platform, search } = req.query;

        const match = { userId: req.user._id };
        if (platform && platform !== 'all') match.platform = platform;

        // প্রতি senderId+channel এর সর্বশেষ message নাও (aggregate)
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

        // Format করো
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

        // Search filter (নাম বা phone দিয়ে)
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
// একটা customer এর full conversation (সব message ক্রমানুসারে)
exports.getConversation = async (req, res) => {
    try {
        const { senderId, channelId } = req.params;

        const messages = await MetaMessage.find({
            userId: req.user._id,
            senderId,
            channelId,
        }).sort({ createdAt: 1 });   // পুরোনো → নতুন (chat order)

        // প্রতিটা message কে chat bubble format এ পরিণত করো
        // একটা customer message + তার AI/human reply = ২টা bubble
        const bubbles = [];
        for (const m of messages) {
            // Customer এর message (বাম দিকে) — placeholder skip করো
            if (m.customerMessage && m.customerMessage !== '[Agent initiated]') {
                bubbles.push({
                    _id: m._id + '_in',
                    from: 'customer',
                    text: m.customerMessage,
                    type: m.messageType,
                    createdAt: m.createdAt,
                });
            }
            // AI/Human reply (ডান দিকে)
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

        // Customer info — Contact model থেকে full data নাও (assign, lead, notes সহ)
        const first = messages[0];
        let contact = null;
        if (first) {
            // Contact model optional
            let ContactModel = null;
            try { ContactModel = require('../models/Contact.model'); } catch (e) { /* CRM not installed */ }

            let dbContact = null;
            if (ContactModel) {
                dbContact = await ContactModel.findOne({ userId: req.user._id, senderId, channelId })
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
            };
        }

        res.json({ success: true, contact, messages: bubbles });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/conversations/:senderId/:channelId/reply ───────
// Manual reply পাঠাও (text + optional image)
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, channelId } = req.params;
        const { text, imageBase64, imageMimeType } = req.body;

        if (!text?.trim() && !imageBase64) {
            return res.status(400).json({ message: 'text অথবা image দরকার' });
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        let imageUrl = '';
        if (imageBase64) {
            imageUrl = await uploadBase64(imageBase64, imageMimeType || 'image/jpeg', 'softbrainchat/sent');
        }

        // Message পাঠাও (text)
        const replyText = text?.trim() || '';
        if (replyText) {
            await sendReply({ platform: channel.platform, channel, recipientId: senderId, text: replyText });
        }
        // Image থাকলে আসল image হিসেবে পাঠাও (URL text নয়)
        if (imageUrl) {
            await sendReply({ platform: channel.platform, channel, recipientId: senderId, imageUrl });
        }

        // DB তে save করো (একটা নতুন MetaMessage হিসেবে — human reply)
        const finalText = replyText + (imageUrl ? `\n${imageUrl}` : '');
        const msg = await MetaMessage.create({
            userId: req.user._id,
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

        emitToUser(req.user._id, 'meta:message_updated', { message: msg });

        res.json({ success: true, imageUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;