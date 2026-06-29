const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    // কোন business এর contact (owner)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Customer identity
    senderId: { type: String, required: true },   // platform sender id / waId
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel' },
    platform: { type: String, enum: ['whatsapp', 'messenger', 'instagram'] },

    // Profile (auto + manual)
    name: { type: String, default: '' },
    phone: { type: String, default: '' },     // WhatsApp হলে senderId
    email: { type: String, default: '' },     // agent manually যোগ করবে
    profilePic: { type: String, default: '' },
    notes: { type: String, default: '' },     // agent এর note

    // Tags / segments (ধাপ ৩ এ পুরো ব্যবহার হবে)
    tags: { type: [String], default: [] },         // e.g. ['VIP', 'new-lead']

    // Assigned agent (ধাপ ২)
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Lead qualification data (ধাপ ৪ এ AI ভরবে)
    lead: {
        stage: { type: String, enum: ['new', 'contacted', 'qualified', 'won', 'lost'], default: 'new' },
        problem: { type: String, default: '' },
        urgency: { type: String, default: '' },
        budget: { type: String, default: '' },
        score: { type: Number, default: 0 },
    },

    // Stats
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageText: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

ContactSchema.pre('save', function (next) { this.updatedAt = new Date(); next(); });

// প্রতি (user + senderId + channel) একটাই contact
ContactSchema.index({ userId: 1, senderId: 1, channelId: 1 }, { unique: true });
ContactSchema.index({ userId: 1, assignedTo: 1 });
ContactSchema.index({ userId: 1, tags: 1 });

// ── Helper: contact খুঁজো বা তৈরি করো (webhook এ ব্যবহার হবে) ──
ContactSchema.statics.findOrCreate = async function (data) {
    const { userId, senderId, channelId, platform, name, phone, profilePic } = data;
    let contact = await this.findOne({ userId, senderId, channelId });
    if (!contact) {
        contact = await this.create({
            userId, senderId, channelId, platform,
            name: name || '', phone: phone || '', profilePic: profilePic || '',
        });
    } else {
        // profile তথ্য update করো (নতুন থাকলে)
        let changed = false;
        if (name && !contact.name) { contact.name = name; changed = true; }
        if (profilePic && !contact.profilePic) { contact.profilePic = profilePic; changed = true; }
        if (changed) await contact.save();
    }
    return contact;
};

module.exports = mongoose.model('Contact', ContactSchema);