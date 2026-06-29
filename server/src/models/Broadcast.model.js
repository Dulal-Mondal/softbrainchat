const mongoose = require('mongoose');

const BroadcastSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, default: '' },
    message: { type: String, required: true },   // text message
    imageUrl: { type: String, default: '' },       // ঐচ্ছিক image

    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel', required: true },
    platform: { type: String, enum: ['whatsapp', 'messenger', 'instagram'] },

    // কাদের পাঠানো হবে — target
    targetTag: { type: String, default: '' },     // নির্দিষ্ট tag, খালি হলে সবাই

    // Status
    status: { type: String, enum: ['draft', 'sending', 'completed', 'failed'], default: 'draft' },

    // Stats
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },

    // ত্রুটির বিবরণ
    errors: [{ senderId: String, error: String }],

    startedAt: { type: Date },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

BroadcastSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Broadcast', BroadcastSchema);