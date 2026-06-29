const mongoose = require('mongoose');

// Client এর custom CRM column definition
const CrmFieldSchema = new mongoose.Schema({
    key: { type: String, required: true },   // e.g. "interested_product"
    label: { type: String, required: true },   // e.g. "আগ্রহী পণ্য"
    // AI কে কী বের করতে বলবে (extraction instruction)
    aiHint: { type: String, default: '' },      // e.g. "customer কোন পণ্যে আগ্রহী"
    type: { type: String, enum: ['text', 'number', 'choice'], default: 'text' },
    options: { type: [String], default: [] },    // type=choice হলে
    showInTable: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
}, { _id: false });

const CrmConfigSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // Client এর custom column গুলো
    fields: {
        type: [CrmFieldSchema],
        default: () => ([
            { key: 'interest', label: 'আগ্রহ', aiHint: 'customer কোন পণ্য/সেবায় আগ্রহী', type: 'text', showInTable: true, order: 1 },
            { key: 'budget', label: 'Budget', aiHint: 'customer এর budget কত', type: 'text', showInTable: true, order: 2 },
        ]),
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

CrmConfigSchema.pre('save', function (next) { this.updatedAt = new Date(); next(); });

module.exports = mongoose.model('CrmConfig', CrmConfigSchema);