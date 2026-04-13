// const mongoose = require('mongoose');

// const MetaMessageSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel', required: true },

//     platform: {
//         type: String,
//         enum: ['whatsapp', 'messenger', 'instagram'],
//         required: true,
//     },

//     // Customer info
//     senderId: { type: String, required: true },
//     senderName: { type: String, default: 'Customer' },

//     // Message content
//     customerMessage: { type: String, required: true },
//     aiReply: { type: String },
//     humanReply: { type: String },

//     // Customer কে actually যেটা পাঠানো হয়েছে
//     finalReply: { type: String },

//     // Status flow:
//     // pending → ai_replied
//     // pending → review_needed → human_replied
//     status: {
//         type: String,
//         enum: ['pending', 'ai_replied', 'review_needed', 'human_replied', 'failed'],
//         default: 'pending',
//     },

//     // AI উত্তর দিতে পেরেছে কিনা
//     aiConfident: { type: Boolean, default: true },

//     // RAG sources
//     sources: [{
//         file: { type: String },
//         url: { type: String },
//         excerpt: { type: String },
//     }],

//     // Meta message ID — duplicate prevent করতে
//     metaMessageId: { type: String, unique: true, sparse: true },

//     replySent: { type: Boolean, default: false },
//     createdAt: { type: Date, default: Date.now },
//     repliedAt: { type: Date },
// });

// MetaMessageSchema.index({ userId: 1, createdAt: -1 });
// MetaMessageSchema.index({ channelId: 1 });
// MetaMessageSchema.index({ status: 1 });
// MetaMessageSchema.index({ metaMessageId: 1 });

// module.exports = mongoose.model('MetaMessage', MetaMessageSchema);



const mongoose = require('mongoose');

const MetaMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel', required: true },
    platform: {
        type: String,
        enum: ['whatsapp', 'messenger', 'instagram'],
        required: true,
    },
    senderId: { type: String, required: true },
    senderName: { type: String, default: 'Customer' },
    customerMessage: { type: String, required: true },
    aiReply: { type: String },
    humanReply: { type: String },
    finalReply: { type: String },
    status: {
        type: String,
        enum: ['pending', 'ai_replied', 'review_needed', 'human_replied', 'failed'],
        default: 'pending',
    },
    aiConfident: { type: Boolean, default: true },
    sources: [{
        file: { type: String },
        url: { type: String },
        excerpt: { type: String },
    }],
    // ✅ unique: true থাকলে index automatic — নিচে আর দিতে হবে না
    metaMessageId: { type: String, unique: true, sparse: true },
    replySent: { type: Boolean, default: false },
    repliedAt: { type: Date },
}, {
    timestamps: true,
});

MetaMessageSchema.index({ userId: 1, createdAt: -1 });
MetaMessageSchema.index({ channelId: 1 });
MetaMessageSchema.index({ status: 1 });
// ✅ metaMessageId index সরানো — unique: true এ automatic

module.exports = mongoose.model('MetaMessage', MetaMessageSchema);