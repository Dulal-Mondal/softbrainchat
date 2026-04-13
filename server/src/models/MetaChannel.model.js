// const mongoose = require('mongoose');

// const MetaChannelSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//     },

//     platform: {
//         type: String,
//         enum: ['whatsapp', 'messenger', 'instagram'],
//         required: true,
//     },

//     // User দেওয়া display name
//     name: { type: String, required: true },

//     // Meta App credentials
//     appId: { type: String, required: true },
//     appSecret: { type: String, required: true },

//     // WhatsApp এর জন্য
//     phoneNumberId: { type: String },
//     wabaId: { type: String },

//     // Messenger / Instagram এর জন্য
//     pageId: { type: String },

//     // Page-level long-lived access token
//     accessToken: { type: String, required: true },

//     // Meta webhook verify token — প্রতিটি channel এর আলাদা
//     webhookVerifyToken: {
//         type: String,
//         default: () => Math.random().toString(36).substring(2, 18),
//     },

//     // Auto-reply on/off toggle
//     autoReplyEnabled: { type: Boolean, default: true },

//     // AI config for this channel
//     model: { type: String, default: 'gpt-4o' },
//     ragEnabled: { type: Boolean, default: true },

//     // Stats
//     stats: {
//         totalMessages: { type: Number, default: 0 },
//         aiReplied: { type: Number, default: 0 },
//         humanReplied: { type: Number, default: 0 },
//     },

//     isActive: { type: Boolean, default: true },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// });

// MetaChannelSchema.pre('save', function (next) {
//     this.updatedAt = new Date();
//     next();
// });

// MetaChannelSchema.index({ userId: 1 });
// MetaChannelSchema.index({ platform: 1, pageId: 1 });
// MetaChannelSchema.index({ platform: 1, phoneNumberId: 1 });

// module.exports = mongoose.model('MetaChannel', MetaChannelSchema);

const mongoose = require('mongoose');

const MetaChannelSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    platform: {
        type: String,
        enum: ['whatsapp', 'messenger', 'instagram'],
        required: true,
    },
    name: { type: String, required: true },
    appId: { type: String, required: true },
    appSecret: { type: String, required: true },
    phoneNumberId: { type: String },
    wabaId: { type: String },
    pageId: { type: String },
    accessToken: { type: String, required: true },
    webhookVerifyToken: {
        type: String,
        default: () => Math.random().toString(36).substring(2, 18),
    },
    autoReplyEnabled: { type: Boolean, default: true },
    model: { type: String, default: 'gpt-4o' },
    ragEnabled: { type: Boolean, default: true },
    stats: {
        totalMessages: { type: Number, default: 0 },
        aiReplied: { type: Number, default: 0 },
        humanReplied: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

MetaChannelSchema.index({ userId: 1 });
MetaChannelSchema.index({ platform: 1, pageId: 1 });
MetaChannelSchema.index({ platform: 1, phoneNumberId: 1 });

module.exports = mongoose.model('MetaChannel', MetaChannelSchema);