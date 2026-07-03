const mongoose = require('mongoose');
const crypto = require('crypto');

// সব available feature (admin এগুলো toggle করবে)
const ALL_FEATURES = ['inbox', 'crm', 'broadcast', 'import', 'orders', 'agents', 'analytics', 'business', 'meta'];

const AgentSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true },
    email: { type: String, required: true },

    // Agent এর Firebase login (invite accept করার পরে link হয়)
    agentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    role: { type: String, enum: ['agent', 'manager'], default: 'agent' },

    // ── Feature permissions — admin যেগুলো দেবে ──
    permissions: {
        type: [String],
        default: ['inbox'],
    },

    // ── Channel access — admin যে channel গুলো দেবে ──
    // খালি হলে admin এর সব channel access পাবে
    allowedChannels: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'MetaChannel',
        default: [],
    },

    // ── Invite system ──
    inviteToken: { type: String, default: null },   // unique token
    inviteStatus: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    inviteSentAt: { type: Date },
    acceptedAt: { type: Date },

    active: { type: Boolean, default: true },

    // Stats
    assignedCount: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
});

AgentSchema.index({ ownerId: 1, email: 1 }, { unique: true });
AgentSchema.index({ inviteToken: 1 });

// invite token তৈরি করো
AgentSchema.methods.generateInviteToken = function () {
    this.inviteToken = crypto.randomBytes(32).toString('hex');
    this.inviteSentAt = new Date();
    this.inviteStatus = 'pending';
    return this.inviteToken;
};

AgentSchema.statics.ALL_FEATURES = ALL_FEATURES;

module.exports = mongoose.model('Agent', AgentSchema);