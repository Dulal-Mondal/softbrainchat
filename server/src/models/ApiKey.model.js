const mongoose = require('mongoose');
const crypto = require('crypto');

const ApiKeySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },   // e.g. "My OMS Software"
    key: { type: String, unique: true },      // generated API key
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
    requestCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

// API key generate করো
ApiKeySchema.pre('save', function (next) {
    if (!this.key) {
        // sbc_ prefix দিয়ে 32 byte random hex key
        this.key = 'sbc_' + crypto.randomBytes(32).toString('hex');
    }
    next();
});

ApiKeySchema.index({ key: 1 });
ApiKeySchema.index({ userId: 1 });

module.exports = mongoose.model('ApiKey', ApiKeySchema);