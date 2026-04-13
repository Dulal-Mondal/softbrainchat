// const mongoose = require('mongoose');

// // ── Sub-schemas ──────────────────────────────────────────────
// const PlanOverrideSchema = new mongoose.Schema({
//     active: { type: Boolean, default: false },
//     plan: { type: String, enum: ['free', 'pro', 'pro-max'] },
//     reason: { type: String },
//     grantedBy: { type: String },   // admin Firebase UID
//     grantedAt: { type: Date },
//     expiresAt: { type: Date },     // null = চিরস্থায়ী
// }, { _id: false });

// const SubscriptionSchema = new mongoose.Schema({
//     stripeCustomerId: { type: String },
//     stripeSubscriptionId: { type: String },
//     stripePriceId: { type: String },
//     status: { type: String, default: 'inactive' },
//     currentPeriodEnd: { type: Date },
// }, { _id: false });

// const LLMProviderSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     apiKey: { type: String, required: true },
//     model: { type: String },
//     baseUrl: { type: String },
//     addedAt: { type: Date, default: Date.now },
// });

// // ── Main Schema ──────────────────────────────────────────────
// const UserSchema = new mongoose.Schema({
//     // Identity
//     uid: { type: String, required: true, unique: true },  // Firebase UID
//     email: { type: String, required: true, unique: true },
//     name: { type: String, default: '' },
//     photo: { type: String, default: '' },

//     // Role & Plan
//     role: { type: String, enum: ['user', 'admin'], default: 'user' },
//     plan: { type: String, enum: ['free', 'pro', 'pro-max'], default: 'free' },

//     // Admin manual override (payment bypass)
//     planOverride: {
//         type: PlanOverrideSchema,
//         default: () => ({ active: false }),
//     },

//     // Stripe subscription info
//     subscription: {
//         type: SubscriptionSchema,
//         default: () => ({}),
//     },

//     // User preferences
//     preferences: {
//         theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
//         defaultModel: { type: String, default: 'gpt-4o' },
//         language: { type: String, default: 'en' },
//     },

//     // Extra LLM providers user নিজে add করেছে
//     llmProviders: { type: [LLMProviderSchema], default: [] },

//     // Monthly usage tracking
//     usage: {
//         messagesThisMonth: { type: Number, default: 0 },
//         lastResetAt: { type: Date, default: Date.now },
//         totalMessages: { type: Number, default: 0 },
//     },

//     lastLoginAt: { type: Date },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// });

// // ── Pre-save ─────────────────────────────────────────────────
// UserSchema.pre('save', function (next) {
//     this.updatedAt = new Date();
//     next();
// });

// // ── Virtual: effectivePlan ───────────────────────────────────
// // Override active থাকলে সেটা return করে,
// // expired হলে বা override না থাকলে আসল plan
// UserSchema.virtual('effectivePlan').get(function () {
//     const ov = this.planOverride;
//     if (ov?.active) {
//         if (ov.expiresAt && ov.expiresAt < new Date()) {
//             return this.plan; // মেয়াদ শেষ
//         }
//         return ov.plan;
//     }
//     return this.plan;
// });

// // ── Virtual: planLimits ──────────────────────────────────────
// UserSchema.virtual('planLimits').get(function () {
//     const MAP = {
//         'free': {
//             messagesPerMonth: 100,
//             knowledgeFiles: 1,
//             knowledgeUrls: 0,
//             metaChannels: 0,
//             chatFlows: 0,
//             customLLM: false,
//         },
//         'pro': {
//             messagesPerMonth: 5000,
//             knowledgeFiles: 20,
//             knowledgeUrls: 10,
//             metaChannels: 3,
//             chatFlows: 5,
//             customLLM: true,
//         },
//         'pro-max': {
//             messagesPerMonth: Infinity,
//             knowledgeFiles: Infinity,
//             knowledgeUrls: Infinity,
//             metaChannels: Infinity,
//             chatFlows: Infinity,
//             customLLM: true,
//         },
//     };
//     return MAP[this.effectivePlan] ?? MAP['free'];
// });

// // ── Method: মাসিক usage reset ────────────────────────────────
// UserSchema.methods.checkAndResetUsage = async function () {
//     const now = new Date();
//     const last = this.usage.lastResetAt;
//     const isNewMonth =
//         now.getMonth() !== last.getMonth() ||
//         now.getFullYear() !== last.getFullYear();

//     if (isNewMonth) {
//         this.usage.messagesThisMonth = 0;
//         this.usage.lastResetAt = now;
//         await this.save();
//     }
// };

// // ── Method: message পাঠাতে পারবে কিনা ───────────────────────
// UserSchema.methods.canSendMessage = function () {
//     const limit = this.planLimits.messagesPerMonth;
//     if (limit === Infinity) return true;
//     return this.usage.messagesThisMonth < limit;
// };

// // ── Config ───────────────────────────────────────────────────
// UserSchema.set('toJSON', { virtuals: true });
// UserSchema.set('toObject', { virtuals: true });

// UserSchema.index({ uid: 1 });
// UserSchema.index({ email: 1 });
// UserSchema.index({ plan: 1 });
// UserSchema.index({ role: 1 });

// module.exports = mongoose.model('User', UserSchema);


const mongoose = require('mongoose');

// ── Sub-schemas ──────────────────────────────────────────────
const PlanOverrideSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    plan: { type: String, enum: ['free', 'pro', 'pro-max'] },
    reason: { type: String },
    grantedBy: { type: String },
    grantedAt: { type: Date },
    expiresAt: { type: Date },
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema({
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String },
    status: { type: String, default: 'inactive' },
    currentPeriodEnd: { type: Date },
}, { _id: false });

const LLMProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    apiKey: { type: String, required: true },
    model: { type: String },
    baseUrl: { type: String },
    addedAt: { type: Date, default: Date.now },
});

// ── Main Schema ──────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    photo: { type: String, default: '' },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    plan: { type: String, enum: ['free', 'pro', 'pro-max'], default: 'free' },

    planOverride: {
        type: PlanOverrideSchema,
        default: () => ({ active: false }),
    },

    subscription: {
        type: SubscriptionSchema,
        default: () => ({}),
    },

    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        defaultModel: { type: String, default: 'gpt-4o' },
        language: { type: String, default: 'en' },
    },

    llmProviders: { type: [LLMProviderSchema], default: [] },

    usage: {
        messagesThisMonth: { type: Number, default: 0 },
        lastResetAt: { type: Date, default: Date.now },
        totalMessages: { type: Number, default: 0 },
    },

    lastLoginAt: { type: Date },
}, {
    timestamps: true,  // createdAt, updatedAt auto — manual field সরালাম
});

// ── Pre-save ─────────────────────────────────────────────────
UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// ── Virtual: effectivePlan ───────────────────────────────────
UserSchema.virtual('effectivePlan').get(function () {
    const ov = this.planOverride;
    if (ov?.active) {
        if (ov.expiresAt && ov.expiresAt < new Date()) {
            return this.plan;
        }
        return ov.plan;
    }
    return this.plan;
});

// ── Virtual: planLimits ──────────────────────────────────────
UserSchema.virtual('planLimits').get(function () {
    const MAP = {
        'free': {
            messagesPerMonth: 100,
            knowledgeFiles: 1,
            knowledgeUrls: 0,
            metaChannels: 0,
            chatFlows: 0,
            customLLM: false,
        },
        'pro': {
            messagesPerMonth: 5000,
            knowledgeFiles: 20,
            knowledgeUrls: 10,
            metaChannels: 3,
            chatFlows: 5,
            customLLM: true,
        },
        'pro-max': {
            messagesPerMonth: Infinity,
            knowledgeFiles: Infinity,
            knowledgeUrls: Infinity,
            metaChannels: Infinity,
            chatFlows: Infinity,
            customLLM: true,
        },
    };
    return MAP[this.effectivePlan] ?? MAP['free'];
});

// ── Method: মাসিক usage reset ────────────────────────────────
UserSchema.methods.checkAndResetUsage = async function () {
    const now = new Date();
    const last = this.usage.lastResetAt;
    const isNewMonth =
        now.getMonth() !== last.getMonth() ||
        now.getFullYear() !== last.getFullYear();

    if (isNewMonth) {
        this.usage.messagesThisMonth = 0;
        this.usage.lastResetAt = now;
        await this.save();
    }
};

// ── Method: message পাঠাতে পারবে কিনা ───────────────────────
UserSchema.methods.canSendMessage = function () {
    const limit = this.planLimits.messagesPerMonth;
    if (limit === Infinity) return true;
    return this.usage.messagesThisMonth < limit;
};

// ── Config ───────────────────────────────────────────────────
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// ✅ uid আর email সরানো — unique: true থাকলে index automatic
UserSchema.index({ plan: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);