// Plan hierarchy: free < pro < pro-max
const PLAN_LEVEL = { 'free': 0, 'pro': 1, 'pro-max': 2 };

/**
 * Usage:
 *   router.post('/send', authMiddleware, requirePlan('pro'), chatCtrl.send);
 */
const requirePlan = (minimumPlan) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userLevel = PLAN_LEVEL[req.user.effectivePlan] ?? 0;
    const requiredLevel = PLAN_LEVEL[minimumPlan] ?? 0;

    if (userLevel < requiredLevel) {
        return res.status(403).json({
            message: `এই feature টি ${minimumPlan} plan এ available`,
            currentPlan: req.user.effectivePlan,
            requiredPlan: minimumPlan,
            upgrade: true,           // client এ upgrade prompt দেখাবে
        });
    }

    next();
};

/**
 * Usage:
 *   router.post('/send', authMiddleware, checkMessageLimit, chatCtrl.send);
 */
const checkMessageLimit = async (req, res, next) => {
    const user = req.user;

    if (!user.canSendMessage()) {
        const limit = user.planLimits.messagesPerMonth;
        return res.status(429).json({
            message: `মাসিক ${limit} message limit শেষ হয়ে গেছে`,
            limit,
            used: user.usage.messagesThisMonth,
            upgrade: true,
        });
    }

    next();
};

module.exports = { requirePlan, checkMessageLimit };