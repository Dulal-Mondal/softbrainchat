const admin = require('../config/firebase');
const User = require('../models/User.model');
const Agent = require('../models/Agent.model');

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Header থেকে token নাও
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token missing' });
        }

        const token = authHeader.split(' ')[1];

        // 2. Firebase Admin দিয়ে verify করো
        const decoded = await admin.auth().verifyIdToken(token);

        // 3. MongoDB থেকে user নাও
        let user = await User.findOne({ uid: decoded.uid });

        // 4. নতুন user হলে MongoDB তে তৈরি করো (first login)
        if (!user) {
            user = await User.create({
                uid: decoded.uid,
                email: decoded.email,
                name: decoded.name || decoded.email.split('@')[0],
                photo: decoded.picture || '',
            });
            console.log(`✅ New user registered: ${user.email}`);
        }

        // 5. Last login আপডেট করো
        user.lastLoginAt = new Date();
        await user.save();

        // 6. Monthly usage reset check করো
        await user.checkAndResetUsage();

        // 7. req.user এ attach করো
        req.user = user;
        req.firebaseUser = decoded;

        // ══════════ ৮. AGENT detection + owner plan ══════════
        // এই user কি কারো active agent?
        let agent = await Agent.findOne({ agentUserId: user._id, active: true });

        // link না থাকলে email দিয়ে খুঁজে link করো (invite accept করার পরে)
        if (!agent && user.email) {
            agent = await Agent.findOne({ email: user.email.toLowerCase(), active: true });
            if (agent && !agent.agentUserId) {
                agent.agentUserId = user._id;
                await agent.save();
            }
        }

        if (agent) {
            // ── Agent — owner (admin) এর plan সুবিধা পাবে ──
            const owner = await User.findById(agent.ownerId);
            const ownerLimits = owner ? owner.planLimits : user.planLimits;

            req.isAgent = true;
            req.ownerId = agent.ownerId;
            req.agentDoc = agent;
            req.agentPermissions = agent.permissions || ['inbox'];
            req.allowedChannels = agent.allowedChannels || [];   // admin যে channel দিয়েছে

            // owner এর plan limit — কিন্তু agent channel CREATE করতে পারবে না
            req.effectiveLimits = { ...ownerLimits, metaChannels: 0 };
            req.effectivePlan = owner ? owner.effectivePlan : 'free';
            req.canCreateChannel = false;
        } else {
            // ── Owner নিজেই — নিজের plan ──
            req.isAgent = false;
            req.ownerId = user._id;
            req.effectiveLimits = user.planLimits;   // virtual
            req.effectivePlan = user.effectivePlan;
            req.canCreateChannel = true;
        }

        next();
    } catch (err) {
        console.error('❌ Auth middleware error:', err.message);

        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Token expired. Please login again.' });
        }
        if (err.code === 'auth/argument-error') {
            return res.status(401).json({ message: 'Invalid token format.' });
        }

        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authMiddleware;