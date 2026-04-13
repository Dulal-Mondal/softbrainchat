const User = require('../models/User.model');

// ── GET /api/admin/users ─────────────────────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const { plan, role, search, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (plan) filter.plan = plan;
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(filter)
            .select('-llmProviders.apiKey')   // API key কখনো expose করবো না
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await User.countDocuments(filter);

        // effectivePlan virtual include করো
        const usersWithEffective = users.map(u => ({
            ...u.toObject(),
            effectivePlan: u.effectivePlan,
            planLimits: u.planLimits,
        }));

        res.json({ success: true, users: usersWithEffective, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/admin/stats ─────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const [total, byPlan] = await Promise.all([
            User.countDocuments(),
            User.aggregate([
                { $group: { _id: '$plan', count: { $sum: 1 } } },
            ]),
        ]);

        const planCounts = { free: 0, pro: 0, 'pro-max': 0 };
        byPlan.forEach(p => { planCounts[p._id] = p.count; });

        // MRR calculation (rough)
        const mrr = (planCounts['pro'] * 29) + (planCounts['pro-max'] * 79);

        res.json({
            success: true,
            stats: { total, ...planCounts, mrr },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/admin/users/:userId ─────────────────────────────
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-llmProviders.apiKey');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                effectivePlan: user.effectivePlan,
                planLimits: user.planLimits,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/admin/users/:userId/plan-override ─────────────
// Admin payment bypass করে user কে plan দিতে পারবে
exports.setPlanOverride = async (req, res) => {
    try {
        const { plan, reason, expiresAt } = req.body;

        if (!['free', 'pro', 'pro-max'].includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan. Must be: free, pro, pro-max' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.planOverride = {
            active: true,
            plan,
            reason: reason || 'Granted by admin',
            grantedBy: req.user.uid,
            grantedAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        };

        await user.save();

        res.json({
            success: true,
            message: `${user.email} কে ${plan} access দেওয়া হয়েছে`,
            effectivePlan: user.effectivePlan,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/admin/users/:userId/plan-override/remove ──────
exports.removePlanOverride = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.planOverride = { active: false };
        await user.save();

        res.json({
            success: true,
            message: `Override removed. Current plan: ${user.plan}`,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/admin/users/:userId/role ──────────────────────
exports.updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // নিজেকে demotion করতে পারবে না
        if (user._id.equals(req.user._id) && role !== 'admin') {
            return res.status(400).json({ message: 'নিজের admin role সরানো যাবে না' });
        }

        user.role = role;
        await user.save();

        res.json({ success: true, message: `Role updated to ${role}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/admin/users/:userId ──────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.equals(req.user._id)) {
            return res.status(400).json({ message: 'নিজেকে delete করা যাবে না' });
        }

        await user.deleteOne();
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};  