const User = require('../models/User.model');

// GET /api/auth/me — current user এর full profile
exports.getMe = async (req, res) => {
    try {
        const user = req.user; // authMiddleware থেকে আসে
        res.json({
            success: true,
            user: {
                id: user._id,
                uid: user.uid,
                email: user.email,
                name: user.name,
                photo: user.photo,
                role: user.role,
                plan: user.plan,
                effectivePlan: user.effectivePlan,
                planOverride: user.planOverride,
                planLimits: user.planLimits,
                preferences: user.preferences,
                llmProviders: user.llmProviders.map(p => ({
                    id: p._id,
                    name: p.name,
                    model: p.model,
                    // apiKey কখনো client এ পাঠাবো না
                })),
                usage: user.usage,
                subscription: user.subscription,
                createdAt: user.createdAt,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/auth/preferences — theme, defaultModel, language update
exports.updatePreferences = async (req, res) => {
    try {
        const { theme, defaultModel, language } = req.body;
        const user = req.user;

        if (theme) user.preferences.theme = theme;
        if (defaultModel) user.preferences.defaultModel = defaultModel;
        if (language) user.preferences.language = language;

        await user.save();
        res.json({ success: true, preferences: user.preferences });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/auth/llm-provider — custom LLM provider add
exports.addLLMProvider = async (req, res) => {
    try {
        const { name, apiKey, model } = req.body;
        const user = req.user;

        // Pro/Pro-Max only
        if (!user.planLimits.customLLM) {
            return res.status(403).json({
                message: 'Custom LLM providers Pro plan এ available',
                upgrade: true,
            });
        }

        if (!name || !apiKey) {
            return res.status(400).json({ message: 'name এবং apiKey required' });
        }

        user.llmProviders.push({ name, apiKey, model });
        await user.save();

        res.json({
            success: true,
            provider: {
                id: user.llmProviders[user.llmProviders.length - 1]._id,
                name,
                model,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/auth/llm-provider/:providerId — custom provider remove
exports.removeLLMProvider = async (req, res) => {
    try {
        const user = req.user;
        user.llmProviders = user.llmProviders.filter(
            p => p._id.toString() !== req.params.providerId
        );
        await user.save();
        res.json({ success: true, message: 'Provider removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/auth/profile — name, photo update
exports.updateProfile = async (req, res) => {
    try {
        const { name, photo } = req.body;
        const user = req.user;
        if (name) user.name = name;
        if (photo) user.photo = photo;
        await user.save();
        res.json({ success: true, name: user.name, photo: user.photo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};