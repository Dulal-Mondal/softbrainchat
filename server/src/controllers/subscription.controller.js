const Subscription = require('../models/Subscription.model');
const User = require('../models/User.model');

// plan এর মেয়াদ (দিন)
const PLAN_DURATION_DAYS = 30;

// ══════════ CLIENT (admin) ══════════

// ── POST /api/subscriptions ──────────────────────────────────
// Client plan request করবে (payment ছাড়া — শুধু note)
exports.requestSubscription = async (req, res) => {
    try {
        const { plan, note } = req.body;

        if (!['pro', 'pro-max'].includes(plan)) {
            return res.status(400).json({ message: 'সঠিক plan নির্বাচন করুন' });
        }

        // আগের pending request আছে কিনা
        const pending = await Subscription.findOne({ userId: req.user._id, status: 'pending' });
        if (pending) {
            return res.status(400).json({ message: 'আপনার একটি request ইতোমধ্যে pending আছে। Approve এর অপেক্ষা করুন।' });
        }

        const sub = await Subscription.create({
            userId: req.user._id,
            plan,
            note: note || '',
            status: 'pending',
        });

        res.status(201).json({ success: true, subscription: sub, message: 'Request পাঠানো হয়েছে! Admin approve করলে plan active হবে।' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/subscriptions/my ────────────────────────────────
// Client নিজের request গুলো দেখবে
exports.getMySubscriptions = async (req, res) => {
    try {
        const subs = await Subscription.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, subscriptions: subs, currentPlan: req.user.plan });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ══════════ SUPER ADMIN ══════════

// ── GET /api/subscriptions/all ───────────────────────────────
// Super admin সব request দেখবে (filter: ?status=pending)
exports.getAllSubscriptions = async (req, res) => {
    try {
        // শুধু super admin (role === 'admin')
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'শুধু super admin access করতে পারবে' });
        }

        const { status } = req.query;
        const filter = {};
        if (status) filter.status = status;

        const subs = await Subscription.find(filter)
            .populate('userId', 'name email plan')
            .sort({ createdAt: -1 })
            .limit(200);

        res.json({ success: true, subscriptions: subs });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/subscriptions/:subId/approve ───────────────────
// Super admin approve করবে → client এর plan active হবে
exports.approveSubscription = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'শুধু super admin approve করতে পারবে' });
        }

        const sub = await Subscription.findById(req.params.subId);
        if (!sub) return res.status(404).json({ message: 'Subscription not found' });
        if (sub.status === 'approved') return res.status(400).json({ message: 'ইতোমধ্যে approved' });

        // plan এর মেয়াদ সেট করো
        const now = new Date();
        const expiresAt = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

        sub.status = 'approved';
        sub.reviewedBy = req.user._id;
        sub.reviewedAt = now;
        sub.startsAt = now;
        sub.expiresAt = expiresAt;
        await sub.save();

        // ── Client এর User এ plan active করো (planOverride দিয়ে) ──
        const client = await User.findById(sub.userId);
        if (client) {
            client.plan = sub.plan;   // সরাসরি plan ও সেট করো
            client.planOverride = {
                active: true,
                plan: sub.plan,
                reason: `Super admin approved subscription`,
                grantedBy: req.user.email || 'super-admin',
                grantedAt: now,
                expiresAt: expiresAt,
            };
            await client.save();
        }

        res.json({ success: true, message: `${sub.plan} plan active করা হয়েছে`, subscription: sub });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/subscriptions/:subId/reject ────────────────────
exports.rejectSubscription = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'শুধু super admin reject করতে পারবে' });
        }

        const { reason } = req.body;
        const sub = await Subscription.findById(req.params.subId);
        if (!sub) return res.status(404).json({ message: 'Subscription not found' });

        sub.status = 'rejected';
        sub.reviewedBy = req.user._id;
        sub.reviewedAt = new Date();
        sub.rejectReason = reason || 'তথ্য যাচাই করা যায়নি';
        await sub.save();

        res.json({ success: true, message: 'Request reject করা হয়েছে', subscription: sub });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;