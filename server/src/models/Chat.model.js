// const mongoose = require('mongoose');

// // ── Message Sub-schema ───────────────────────────────────────
// const MessageSchema = new mongoose.Schema({
//     role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
//     content: { type: String, required: true },

//     // RAG sources
//     sources: [{
//         file: { type: String },
//         url: { type: String },
//         excerpt: { type: String },
//     }],

//     // Human correction
//     corrected: { type: Boolean, default: false },
//     correction: { type: String },

//     createdAt: { type: Date, default: Date.now },
// }, { _id: true });

// // ── Chat Schema ──────────────────────────────────────────────
// const ChatSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     title: { type: String, default: 'New Chat' },
//     model: { type: String, default: 'gpt-4o' },
//     ragEnabled: { type: Boolean, default: true },
//     messages: { type: [MessageSchema], default: [] },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// });

// ChatSchema.pre('save', function (next) {
//     this.updatedAt = new Date();
//     next();
// });

// ChatSchema.index({ userId: 1, updatedAt: -1 });

// module.exports = mongoose.model('Chat', ChatSchema);


const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    sources: [{
        file: { type: String },
        url: { type: String },
        excerpt: { type: String },
    }],
    corrected: { type: Boolean, default: false },
    correction: { type: String },
}, {
    _id: true,
    timestamps: true,
});

const ChatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'New Chat' },
    model: { type: String, default: 'gpt-4o' },
    ragEnabled: { type: Boolean, default: true },
    messages: { type: [MessageSchema], default: [] },
}, {
    timestamps: true,
});

ChatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);