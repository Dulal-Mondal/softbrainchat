// const mongoose = require('mongoose');

// const SubscriptionSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     stripeCustomerId: { type: String, required: true },
//     stripeSubscriptionId: { type: String },
//     stripePriceId: { type: String },
//     plan: { type: String, enum: ['free', 'pro', 'pro-max'], required: true },
//     status: { type: String, default: 'active' },
//     currentPeriodStart: { type: Date },
//     currentPeriodEnd: { type: Date },
//     cancelAtPeriodEnd: { type: Boolean, default: false },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// });

// SubscriptionSchema.pre('save', function (next) { this.updatedAt = new Date(); next(); });
// SubscriptionSchema.index({ userId: 1 });
// SubscriptionSchema.index({ stripeSubscriptionId: 1 });

// module.exports = mongoose.model('Subscription', SubscriptionSchema);


const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String },
    stripePriceId: { type: String },
    plan: { type: String, enum: ['free', 'pro', 'pro-max'], required: true },
    status: { type: String, default: 'active' },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
}, {
    timestamps: true,
});

SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);