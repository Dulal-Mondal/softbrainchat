const mongoose = require('mongoose');

// ── Custom order field (client নিজে বানাবে) ─────────────────
const OrderFieldSchema = new mongoose.Schema({
    key: { type: String, required: true },   // e.g. "size", "color", "brand"
    label: { type: String, required: true },   // e.g. "Size", "রং", "Brand"
    prompt: { type: String, default: '' },      // AI যে প্রশ্ন করবে: "আপনার পছন্দের size লিখুন"
    type: { type: String, enum: ['text', 'number', 'phone', 'choice'], default: 'text' },
    options: { type: [String], default: [] },    // type=choice হলে: ['S','M','L','XL']
    required: { type: Boolean, default: true },
    order: { type: Number, default: 0 },        // কোন field আগে জিজ্ঞেস করবে
}, { _id: false });

// ── Per-client business configuration ───────────────────────
const BusinessConfigSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // কোন কোন mode চালু
    serviceMode: { type: Boolean, default: true },   // RAG দিয়ে conversation
    productMode: { type: Boolean, default: false },  // order collection

    businessName: { type: String, default: '' },
    businessType: { type: String, default: '' },     // e.g. "Clothing", "Electronics", "Consultancy"

    // ── Product mode settings ────────────────────────────────
    // Client নিজে এই field গুলো বানায় — AI customer থেকে collect করবে
    orderFields: {
        type: [OrderFieldSchema],
        default: () => ([
            { key: 'size', label: 'Size', prompt: 'আপনার পছন্দের size লিখুন (S/M/L/XL/Free Size):', type: 'text', required: true, order: 1 },
            { key: 'name', label: 'Name', prompt: 'আপনার পুরো নাম লিখুন:', type: 'text', required: true, order: 2 },
            { key: 'address', label: 'Address', prompt: 'আপনার ডেলিভারি ঠিকানা লিখুন:', type: 'text', required: true, order: 3 },
            { key: 'phone', label: 'Phone', prompt: 'আপনার মোবাইল নম্বর লিখুন:', type: 'phone', required: true, order: 4 },
        ]),
    },

    // Product চিনলে AI যেভাবে confirm চাইবে
    orderConfirmPrompt: {
        type: String,
        default: 'আপনি কি এটি order করতে চান?\n👉 Order করতে *হ্যাঁ* লিখুন\n👉 বাদ দিতে *না* লিখুন',
    },

    orderSuccessMessage: {
        type: String,
        default: 'আপনার order টি পেয়েছি! শীঘ্রই আমাদের টিম যোগাযোগ করবে। 🎉 ধন্যবাদ! 🙏',
    },

    // ── Service mode settings ────────────────────────────────
    serviceGreeting: {
        type: String,
        default: '',   // খালি হলে default greeting ব্যবহার হবে
    },

    // AI উত্তর না পেলে customer কে কী বলবে
    fallbackMessage: {
        type: String,
        default: 'এই বিষয়ে আমাদের একজন প্রতিনিধি আপনাকে শীঘ্রই জানাবেন।',
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

BusinessConfigSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('BusinessConfig', BusinessConfigSchema);