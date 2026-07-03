const mongoose = require('mongoose');

// Client এর plan request + super admin approval (payment ছাড়া)
const SubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // কোন plan চাইছে
    plan: { type: String, enum: ['pro', 'pro-max'], required: true },

    // Client এর message/note (ঐচ্ছিক — কেন চাইছে ইত্যাদি)
    note: { type: String, default: '' },

    // Status — super admin approve করবে
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    // Super admin এর action
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    rejectReason: { type: String, default: '' },

    // plan এর মেয়াদ (approve করার সময় সেট হবে)
    startsAt: { type: Date },
    expiresAt: { type: Date },

    createdAt: { type: Date, default: Date.now },
});

SubscriptionSchema.index({ userId: 1, createdAt: -1 });
SubscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);