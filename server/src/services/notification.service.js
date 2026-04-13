// const User = require('../models/User.model');

// // ── In-memory notification store ──────────────────────────────
// // Production এ Redis বা MongoDB এ store করো
// // এখন simple in-memory approach ব্যবহার করছি
// const notificationStore = new Map();
// // Structure: userId → [{ id, type, message, data, read, createdAt }]

// // ── Notification তৈরি করো ────────────────────────────────────
// const createNotification = (userId, { type, message, data = {} }) => {
//     const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
//     const notif = {
//         id,
//         type,     // 'ai_no_answer' | 'review_needed' | 'system' | 'billing'
//         message,
//         data,
//         read: false,
//         createdAt: new Date(),
//     };

//     const key = userId.toString();
//     const current = notificationStore.get(key) || [];

//     // সর্বোচ্চ ৫০টি notification রাখো
//     const updated = [notif, ...current].slice(0, 50);
//     notificationStore.set(key, updated);

//     return notif;
// };

// // ── AI উত্তর দিতে পারেনি — notification তৈরি করো ────────────
// const notifyAINoAnswer = async (userId, { platform, customerMessage, channelName }) => {
//     return createNotification(userId, {
//         type: 'ai_no_answer',
//         message: `AI "${customerMessage.substring(0, 60)}..." প্রশ্নের উত্তর দিতে পারেনি`,
//         data: {
//             platform,
//             customerMessage,
//             channelName,
//             action: 'review',
//         },
//     });
// };

// // ── Meta channel এ review দরকার ──────────────────────────────
// const notifyReviewNeeded = async (userId, { platform, senderName, messageId }) => {
//     return createNotification(userId, {
//         type: 'review_needed',
//         message: `${senderName} এর message review দরকার (${platform})`,
//         data: { platform, senderName, messageId, action: 'review' },
//     });
// };

// // ── Billing notification ──────────────────────────────────────
// const notifyBilling = async (userId, { event, plan }) => {
//     const messages = {
//         payment_failed: `Payment failed। Billing তথ্য update করুন।`,
//         subscription_canceled: `Subscription cancel হয়েছে। Plan: free তে নেমেছে।`,
//         trial_ending: `Trial শেষ হতে চলেছে। Upgrade করুন।`,
//         upgraded: `${plan} plan এ upgrade সফল হয়েছে!`,
//     };

//     return createNotification(userId, {
//         type: 'billing',
//         message: messages[event] || `Billing event: ${event}`,
//         data: { event, plan },
//     });
// };

// // ── User এর notifications পাও ─────────────────────────────────
// const getNotifications = (userId) => {
//     const key = userId.toString();
//     return notificationStore.get(key) || [];
// };

// // ── Unread count ──────────────────────────────────────────────
// const getUnreadCount = (userId) => {
//     const notifs = getNotifications(userId);
//     return notifs.filter(n => !n.read).length;
// };

// // ── Notification read mark করো ───────────────────────────────
// const markAsRead = (userId, notifId) => {
//     const key = userId.toString();
//     const notifs = notificationStore.get(key) || [];

//     const updated = notifs.map(n =>
//         n.id === notifId ? { ...n, read: true } : n
//     );
//     notificationStore.set(key, updated);
// };

// // ── সব notification read mark করো ───────────────────────────
// const markAllAsRead = (userId) => {
//     const key = userId.toString();
//     const notifs = notificationStore.get(key) || [];
//     const updated = notifs.map(n => ({ ...n, read: true }));
//     notificationStore.set(key, updated);
// };

// // ── Notification clear করো ───────────────────────────────────
// const clearNotifications = (userId) => {
//     notificationStore.delete(userId.toString());
// };

// module.exports = {
//     createNotification,
//     notifyAINoAnswer,
//     notifyReviewNeeded,
//     notifyBilling,
//     getNotifications,
//     getUnreadCount,
//     markAsRead,
//     markAllAsRead,
//     clearNotifications,
// };


const Notification = require('../models/Notification.model');

// ── Notification তৈরি করো ────────────────────────────────────
const createNotification = async (userId, { type, message, data = {} }) => {
    // সর্বোচ্চ ৫০টা রাখার জন্য — পুরনোটা delete করো
    const count = await Notification.countDocuments({ userId });
    if (count >= 50) {
        const oldest = await Notification
            .findOne({ userId })
            .sort({ createdAt: 1 });  // সবচেয়ে পুরনো
        if (oldest) await oldest.deleteOne();
    }

    const notif = await Notification.create({
        userId,
        type,
        message,
        data,
    });

    return notif;
};

// ── AI উত্তর দিতে পারেনি ─────────────────────────────────────
const notifyAINoAnswer = async (userId, { platform, customerMessage, channelName }) => {
    return createNotification(userId, {
        type: 'ai_no_answer',
        message: `AI "${customerMessage.substring(0, 60)}..." প্রশ্নের উত্তর দিতে পারেনি`,
        data: { platform, customerMessage, channelName, action: 'review' },
    });
};

// ── Meta channel এ review দরকার ──────────────────────────────
const notifyReviewNeeded = async (userId, { platform, senderName, messageId }) => {
    return createNotification(userId, {
        type: 'review_needed',
        message: `${senderName} এর message review দরকার (${platform})`,
        data: { platform, senderName, messageId, action: 'review' },
    });
};

// ── Billing notification ──────────────────────────────────────
const notifyBilling = async (userId, { event, plan }) => {
    const messages = {
        payment_failed: `Payment failed। Billing তথ্য update করুন।`,
        subscription_canceled: `Subscription cancel হয়েছে। Plan: free তে নেমেছে।`,
        trial_ending: `Trial শেষ হতে চলেছে। Upgrade করুন।`,
        upgraded: `${plan} plan এ upgrade সফল হয়েছে!`,
    };

    return createNotification(userId, {
        type: 'billing',
        message: messages[event] || `Billing event: ${event}`,
        data: { event, plan },
    });
};

// ── User এর notifications পাও ─────────────────────────────────
const getNotifications = async (userId) => {
    return await Notification
        .find({ userId })
        .sort({ createdAt: -1 })  // নতুনগুলো আগে
        .lean();                   // plain object, faster
};

// ── Unread count ──────────────────────────────────────────────
const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ userId, read: false });
};

// ── একটা notification read mark করো ─────────────────────────
const markAsRead = async (userId, notifId) => {
    await Notification.findOneAndUpdate(
        { _id: notifId, userId },  // userId check — অন্যের notification না
        { read: true }
    );
};

// ── সব notification read mark করো ───────────────────────────
const markAllAsRead = async (userId) => {
    await Notification.updateMany(
        { userId, read: false },
        { read: true }
    );
};

// ── Notification clear করো ───────────────────────────────────
const clearNotifications = async (userId) => {
    await Notification.deleteMany({ userId });
};

module.exports = {
    createNotification,
    notifyAINoAnswer,
    notifyReviewNeeded,
    notifyBilling,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
};