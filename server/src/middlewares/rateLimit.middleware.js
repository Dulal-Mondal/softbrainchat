const rateLimit = require('express-rate-limit');

// ── Global API rate limit ─────────────────────────────────────
// সব request এর জন্য — brute force prevent করতে
const globalLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,             // 15 মিনিটে সর্বোচ্চ 300 request
    message: { message: 'অনেক বেশি request। কিছুক্ষণ পরে আবার try করুন।' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Auth route rate limit ─────────────────────────────────────
// Login/Register brute force prevent করতে
const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,              // 15 মিনিটে সর্বোচ্চ 20 attempt
    message: { message: 'অনেক বেশি login attempt। 15 মিনিট পরে try করুন।' },
    standardHeaders: true,
    legacyHeaders: false,
    // IP based
    keyGenerator: (req) => req.ip,
});

// ── Chat message rate limit ───────────────────────────────────
// Spam prevent করতে — plan limit এর উপরে extra layer
const chatLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,         // প্রতি মিনিটে সর্বোচ্চ 30 message
    message: { message: 'অনেক দ্রুত message পাঠাচ্ছেন। একটু ধীরে পাঠান।' },
    standardHeaders: true,
    legacyHeaders: false,
    // User ID based (authenticated users)
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    skip: (req) => {
        // Pro Max user দের জন্য skip করো
        return req.user?.effectivePlan === 'pro-max';
    },
});

// ── File upload rate limit ────────────────────────────────────
const uploadLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,              // ঘণ্টায় সর্বোচ্চ 20 upload
    message: { message: 'File upload limit reached। 1 ঘণ্টা পরে আবার try করুন।' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// ── Webhook rate limit ────────────────────────────────────────
// Meta webhook spam prevent
const webhookLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,        // প্রতি মিনিটে সর্বোচ্চ 100 webhook
    message: 'Too many webhook requests',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimit,
    authLimit,
    chatLimit,
    uploadLimit,
    webhookLimit,
};