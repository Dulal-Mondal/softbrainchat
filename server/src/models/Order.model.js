// const mongoose = require('mongoose');

// const OrderSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel' },
//     platform: { type: String, enum: ['whatsapp', 'messenger', 'instagram'] },

//     orderId: {
//         type: String,
//         unique: true,
//         default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
//     },

//     customer: {
//         senderId: { type: String },
//         name: { type: String, required: true },
//         phone: { type: String, required: true },
//         address: { type: String, required: true },
//         profilePic: { type: String, default: '' },
//     },

//     product: {
//         name: { type: String, required: true },
//         price: { type: String, default: '' },
//         quantity: { type: Number, default: 1 },
//         desc: { type: String, default: '' },
//     },

//     status: {
//         type: String,
//         enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
//         default: 'pending',
//     },

//     // OMS sync
//     omsSynced: { type: Boolean, default: false },
//     omsOrderId: { type: String },
//     omsError: { type: String },
//     omsSyncedAt: { type: Date },

//     notes: { type: String, default: '' },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// });

// OrderSchema.pre('save', function (next) {
//     this.updatedAt = new Date();
//     next();
// });

// OrderSchema.index({ userId: 1, createdAt: -1 });
// OrderSchema.index({ orderId: 1 });
// OrderSchema.index({ status: 1 });
// OrderSchema.index({ 'customer.phone': 1 });

// module.exports = mongoose.model('Order', OrderSchema);










const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'MetaChannel' },
    platform: { type: String, enum: ['whatsapp', 'messenger', 'instagram'] },

    orderId: {
        type: String,
        unique: true,
        default: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },

    customer: {
        senderId: { type: String },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        profilePic: { type: String, default: '' },
    },

    product: {
        name: { type: String, required: true },
        code: { type: String, default: '' },   // ← নতুন (product code/SKU)
        price: { type: String, default: '' },
        size: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        desc: { type: String, default: '' },
        image: { type: String, default: '' },   // ← নতুন (customer এর পাঠানো image)
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },

    lastNotifiedStatus: { type: String, default: 'pending' },

    omsSynced: { type: Boolean, default: false },
    omsOrderId: { type: String },
    omsError: { type: String },
    omsSyncedAt: { type: Date },

    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

OrderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'customer.phone': 1 });

module.exports = mongoose.model('Order', OrderSchema);