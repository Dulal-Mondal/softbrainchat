const admin = require('../config/firebase');
const User = require('../models/User.model');

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

        // 7. req.user এ attach করো — downstream এ সব controller পাবে
        req.user = user;       // Mongoose document (effectivePlan virtual সহ)
        req.firebaseUser = decoded; // Raw Firebase token data

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