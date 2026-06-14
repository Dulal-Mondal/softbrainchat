const mongoose = require('mongoose');

const OmsConfigSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,  // প্রতি user এর একটাই config
    },

    // OMS connection enabled কিনা
    enabled: { type: Boolean, default: false },

    // OMS API endpoint
    apiUrl: { type: String, default: '' },

    // Authentication type
    authType: {
        type: String,
        enum: ['none', 'api_key_header', 'bearer_token', 'basic_auth'],
        default: 'api_key_header',
    },

    // Auth credentials
    apiKey: { type: String, default: '' },   // api_key_header এর জন্য
    bearerToken: { type: String, default: '' },   // bearer_token এর জন্য
    basicUsername: { type: String, default: '' },   // basic_auth এর জন্য
    basicPassword: { type: String, default: '' },   // basic_auth এর জন্য

    // Custom header name (default: X-API-Key)
    apiKeyHeader: { type: String, default: 'X-API-Key' },

    // Payload format — কোন OMS কোন format চায়
    payloadFormat: {
        type: String,
        enum: ['softbrainchat', 'woocommerce', 'shopify', 'custom'],
        default: 'softbrainchat',
    },

    // Custom field mapping (custom format এর জন্য)
    // e.g. { "order_id": "id", "customer.name": "billing.name" }
    fieldMapping: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

    // Last sync info
    lastSyncAt: { type: Date },
    lastSyncStatus: { type: String, enum: ['success', 'failed', ''], default: '' },
    lastSyncError: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

OmsConfigSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('OmsConfig', OmsConfigSchema);