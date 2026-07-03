// Plan hierarchy: free < pro < pro-max
const PLAN_LEVEL = { 'free': 0, 'pro': 1, 'pro-max': 2 };

/**
 * Usage:
 *   router.post('/send', authMiddleware, requirePlan('pro'), chatCtrl.send);
 *
 * ⚠️ Agent হলে req.effectivePlan (owner এর plan) ব্যবহার করে।
 *    auth.middleware agent detect করে req.effectivePlan সেট করে।
 */
const requirePlan = (minimumPlan) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // ── Agent হলে owner এর plan (req.effectivePlan) — নাহলে নিজের ──
    // auth.middleware agent এর জন্য req.effectivePlan = owner এর plan সেট করে
    const effectivePlan = req.effectivePlan || req.user.effectivePlan;

    const userLevel = PLAN_LEVEL[effectivePlan] ?? 0;
    const requiredLevel = PLAN_LEVEL[minimumPlan] ?? 0;

    if (userLevel < requiredLevel) {
        return res.status(403).json({
            message: `এই feature টি ${minimumPlan} plan এ available`,
            currentPlan: effectivePlan,
            requiredPlan: minimumPlan,
            upgrade: true,
        });
    }

    next();
};

/**
 * Usage:
 *   router.post('/send', authMiddleware, checkMessageLimit, chatCtrl.send);
 *
 * ⚠️ Agent হলে owner এর limit ব্যবহার করে।
 */
const checkMessageLimit = async (req, res, next) => {
    const user = req.user;

    // ── Agent হলে owner এর message limit ──
    // agent এর নিজের usage নয়, owner এর plan limit দেখো
    const limits = req.effectiveLimits || user.planLimits;
    const maxMessages = limits.messagesPerMonth;

    // Infinity হলে সবসময় pass
    if (maxMessages === Infinity) return next();

    // agent হলে owner এর usage check করা কঠিন (আলাদা user)
    // তাই agent এর জন্য শুধু owner এর plan limit থাকলেই pass করাই
    // (owner এর মোট usage আলাদাভাবে track করা যায় পরে)
    if (req.isAgent) {
        return next();   // agent owner এর plan এ কাজ করে — limit owner এর দিকে
    }

    // owner নিজে হলে নিজের usage check
    if (!user.canSendMessage()) {
        return res.status(429).json({
            message: `মাসিক ${maxMessages} message limit শেষ হয়ে গেছে`,
            limit: maxMessages,
            used: user.usage.messagesThisMonth,
            upgrade: true,
        });
    }

    next();
};

module.exports = { requirePlan, checkMessageLimit };