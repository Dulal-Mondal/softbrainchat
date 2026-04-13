// const mongoose = require('mongoose');

// // Standalone Message schema
// // Chat.model.js এ embedded হিসেবে ব্যবহার হয়।
// // আলাদা collection হিসেবেও ব্যবহার করা যাবে যদি
// // ভবিষ্যতে message-level analytics দরকার হয়।

// const MessageSchema = new mongoose.Schema({
//     chatId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Chat',
//     },
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//     },

//     role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
//     content: { type: String, required: true },

//     // Model যেটা use হয়েছে
//     model: { type: String },

//     // RAG sources
//     sources: [{
//         file: { type: String },
//         url: { type: String },
//         excerpt: { type: String },
//         score: { type: Number },
//     }],

//     // Human correction
//     corrected: { type: Boolean, default: false },
//     correction: { type: String },

//     // Token usage (billing/analytics এর জন্য)
//     tokens: {
//         prompt: { type: Number },
//         completion: { type: Number },
//         total: { type: Number },
//     },

//     // RAG ব্যবহার হয়েছে কিনা
//     ragUsed: { type: Boolean, default: false },

//     // AI উত্তর দিতে পারেনি কিনা
//     cantAnswer: { type: Boolean, default: false },

//     createdAt: { type: Date, default: Date.now },
// });

// MessageSchema.index({ chatId: 1, createdAt: 1 });
// MessageSchema.index({ userId: 1, createdAt: -1 });

// module.exports = mongoose.model('Message', MessageSchema);


const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },

    model: { type: String },

    sources: [{
        file: { type: String },
        url: { type: String },
        excerpt: { type: String },
        score: { type: Number },
    }],

    corrected: { type: Boolean, default: false },
    correction: { type: String },

    tokens: {
        prompt: { type: Number },
        completion: { type: Number },
        total: { type: Number },
    },

    ragUsed: { type: Boolean, default: false },
    cantAnswer: { type: Boolean, default: false },

}, {
    timestamps: true, // ✅ createdAt auto — manual field সরালাম
});

// ✅ duplicate নেই — এগুলো আলাদা আলাদা field এ index
MessageSchema.index({ chatId: 1, createdAt: 1 });
MessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);