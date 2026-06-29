const mongoose = require('mongoose');

// Business owner এর team এর agent/staff
const AgentSchema = new mongoose.Schema({
    // কোন business owner এর agent
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true },
    email: { type: String, required: true },

    // Agent এর নিজের Firebase login থাকলে (পরে invite system)
    agentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    role: { type: String, enum: ['agent', 'manager'], default: 'agent' },

    active: { type: Boolean, default: true },

    // Stats
    assignedCount: { type: Number, default: 0 },
    resolvedCount: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
});

AgentSchema.index({ ownerId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Agent', AgentSchema);