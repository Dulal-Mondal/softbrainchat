// const mongoose = require('mongoose');

// const OrderSessionSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel', required: true },
//     platform: { type: String, enum: ['whatsapp', 'messenger', 'instagram'], required: true },
//     senderId: { type: String, required: true },

//     step: {
//         type: String,
//         enum: ['idle', 'confirm_pending', 'collecting_name', 'collecting_address', 'collecting_phone', 'completed', 'cancelled'],
//         default: 'idle',
//     },

//     orderData: {
//         productName: { type: String, default: '' },
//         productPrice: { type: String, default: '' },
//         productDesc: { type: String, default: '' },
//         quantity: { type: Number, default: 1 },
//         customerName: { type: String, default: '' },
//         address: { type: String, default: '' },
//         phone: { type: String, default: '' },
//     },

//     lastActivityAt: { type: Date, default: Date.now },
//     createdAt: { type: Date, default: Date.now },
// });

// OrderSessionSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 1800 });
// OrderSessionSchema.index({ senderId: 1, channelId: 1 }, { unique: true });

// module.exports = mongoose.model('OrderSession', OrderSessionSchema);



const mongoose = require('mongoose');

const OrderSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel', required: true },
    platform: { type: String, enum: ['whatsapp', 'messenger', 'instagram'], required: true },
    senderId: { type: String, required: true },

    // step state machine — size যোগ হয়েছে
    step: {
        type: String,
        enum: [
            'idle', 'confirm_pending',
            'collecting_size',          // ← নতুন
            'collecting_name', 'collecting_address', 'collecting_phone',
            'completed', 'cancelled',
        ],
        default: 'idle',
    },

    orderData: {
        productName: { type: String, default: '' },
        productPrice: { type: String, default: '' },
        productDesc: { type: String, default: '' },
        size: { type: String, default: '' },   // ← নতুন
        quantity: { type: Number, default: 1 },
        customerName: { type: String, default: '' },
        address: { type: String, default: '' },
        phone: { type: String, default: '' },
    },

    lastActivityAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

OrderSessionSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 1800 });
OrderSessionSchema.index({ senderId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('OrderSession', OrderSessionSchema);