// const MetaChannel = require('../models/MetaChannel.model');
// const Contact = require('../models/Contact.model');
// const Broadcast = require('../models/Broadcast.model');
// const { getTemplates, sendTemplate } = require('../services/templateApi.service');
// const { emitToUser } = require('../config/socket');

// const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// // ── GET /api/templates/:channelId ────────────────────────────
// // একটা WhatsApp channel এর approved template গুলো
// exports.getChannelTemplates = async (req, res) => {
//     try {
//         const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         if (channel.platform !== 'whatsapp') {
//             return res.status(400).json({ message: 'Template শুধু WhatsApp এ কাজ করে' });
//         }
//         if (!channel.wabaId) {
//             return res.status(400).json({ message: 'এই channel এ WABA ID সেট করা নেই। Channel edit করে WABA ID যোগ করুন।' });
//         }

//         const templates = await getTemplates({ wabaId: channel.wabaId, accessToken: channel.accessToken });
//         res.json({ success: true, templates });
//     } catch (err) {
//         const detail = err.response?.data?.error?.message || err.message;
//         res.status(500).json({ message: detail });
//     }
// };

// // ── POST /api/templates/broadcast ────────────────────────────
// // Template দিয়ে broadcast (imported/নতুন number এও যাবে)
// exports.sendTemplateBroadcast = async (req, res) => {
//     try {
//         const { name, channelId, targetTag, templateName, language, variableMapping } = req.body;
//         // variableMapping: কোন variable এ কী বসবে
//         //   { "1": "name" } মানে {{1}} এ contact এর name বসবে
//         //   { "1": "50% off" } মানে {{1}} এ fixed text বসবে

//         if (!templateName) return res.status(400).json({ message: 'Template select করুন' });

//         const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
//         if (!channel) return res.status(404).json({ message: 'Channel not found' });

//         // Recipient খুঁজো
//         const filter = { userId: req.user._id, channelId };
//         if (targetTag) filter.tags = targetTag;
//         const contacts = await Contact.find(filter).select('senderId name phone');

//         if (contacts.length === 0) {
//             return res.status(400).json({ message: 'কোনো recipient নেই' });
//         }

//         const broadcast = await Broadcast.create({
//             userId: req.user._id,
//             name: name || `Template Broadcast ${new Date().toLocaleDateString()}`,
//             message: `[Template: ${templateName}]`,
//             channelId,
//             platform: 'whatsapp',
//             targetTag: targetTag || '',
//             status: 'sending',
//             totalRecipients: contacts.length,
//             startedAt: new Date(),
//         });

//         res.json({ success: true, broadcast });

//         // Background এ পাঠাও
//         processTemplateBroadcast(broadcast, contacts, channel, {
//             templateName, language, variableMapping: variableMapping || {},
//         }, req.user._id);

//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── Background template sender ───────────────────────────────
// async function processTemplateBroadcast(broadcast, contacts, channel, opts, userId) {
//     const { templateName, language, variableMapping } = opts;
//     const DELAY_MS = 150;   // template এ একটু বেশি delay (নিরাপদ)

//     // variable গুলো sort করো (1, 2, 3...)
//     const varKeys = Object.keys(variableMapping).sort((a, b) => Number(a) - Number(b));

//     for (const contact of contacts) {
//         try {
//             // প্রতি contact এর জন্য variable values বানাও
//             const variables = varKeys.map(key => {
//                 const mapped = variableMapping[key];
//                 // mapped যদি 'name'/'phone' হয় → contact থেকে নাও, নাহলে fixed text
//                 if (mapped === 'name') return contact.name || 'Customer';
//                 if (mapped === 'phone') return contact.phone || '';
//                 return mapped;   // fixed text
//             });

//             await sendTemplate({
//                 phoneNumberId: channel.phoneNumberId,
//                 accessToken: channel.accessToken,
//                 to: contact.senderId,
//                 templateName,
//                 language,
//                 variables,
//             });
//             broadcast.sentCount += 1;
//         } catch (err) {
//             broadcast.failedCount += 1;
//             broadcast.errors.push({
//                 senderId: contact.senderId,
//                 error: (err.response?.data?.error?.message || err.message)?.slice(0, 200),
//             });
//         }

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










const MetaChannel = require('../models/MetaChannel.model');
const Contact = require('../models/Contact.model');
const Broadcast = require('../models/Broadcast.model');
const { getTemplates, sendTemplate } = require('../services/templateApi.service');
const { emitToUser } = require('../config/socket');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── GET /api/templates/:channelId ────────────────────────────
// একটা WhatsApp channel এর approved template গুলো
exports.getChannelTemplates = async (req, res) => {
    try {
        const channel = await MetaChannel.findOne({ _id: req.params.channelId, userId: req.user._id });
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
// Template দিয়ে broadcast (imported/নতুন number এও যাবে)
exports.sendTemplateBroadcast = async (req, res) => {
    try {
        const { name, channelId, targetTag, targetTags, templateName, language, variableMapping } = req.body;
        // variableMapping: কোন variable এ কী বসবে

        if (!templateName) return res.status(400).json({ message: 'Template select করুন' });

        const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        // Recipient খুঁজো — multiple group/tag support
        const filter = { userId: req.user._id, channelId };
        const tags = targetTags?.length ? targetTags : (targetTag ? [targetTag] : []);
        if (tags.length) filter.tags = { $in: tags };
        const contacts = await Contact.find(filter).select('senderId name phone');

        if (contacts.length === 0) {
            return res.status(400).json({ message: 'কোনো recipient নেই' });
        }

        const broadcast = await Broadcast.create({
            userId: req.user._id,
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

        // Background এ পাঠাও
        processTemplateBroadcast(broadcast, contacts, channel, {
            templateName, language, variableMapping: variableMapping || {},
        }, req.user._id);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Background template sender ───────────────────────────────
async function processTemplateBroadcast(broadcast, contacts, channel, opts, userId) {
    const { templateName, language, variableMapping } = opts;
    const DELAY_MS = 150;   // template এ একটু বেশি delay (নিরাপদ)

    // variable গুলো sort করো (1, 2, 3...)
    const varKeys = Object.keys(variableMapping).sort((a, b) => Number(a) - Number(b));

    for (const contact of contacts) {
        try {
            // প্রতি contact এর জন্য variable values বানাও
            const variables = varKeys.map(key => {
                const mapped = variableMapping[key];
                // mapped যদি 'name'/'phone' হয় → contact থেকে নাও, নাহলে fixed text
                if (mapped === 'name') return contact.name || 'Customer';
                if (mapped === 'phone') return contact.phone || '';
                return mapped;   // fixed text
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