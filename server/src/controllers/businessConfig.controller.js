const BusinessConfig = require('../models/BusinessConfig.model');

// ── GET /api/business-config ─────────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        let config = await BusinessConfig.findOne({ userId: req.user._id });

        // না থাকলে default তৈরি করো
        if (!config) {
            config = await BusinessConfig.create({ userId: req.user._id });
        }

        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/business-config ───────────────────────────────
exports.updateConfig = async (req, res) => {
    try {
        const allowed = [
            'serviceMode', 'productMode', 'businessName', 'businessType',
            'orderFields', 'orderConfirmPrompt', 'orderSuccessMessage',
            'serviceGreeting', 'fallbackMessage',
        ];

        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        // orderFields validation — key ও label থাকতে হবে
        if (updates.orderFields) {
            if (!Array.isArray(updates.orderFields)) {
                return res.status(400).json({ message: 'orderFields must be an array' });
            }
            for (const f of updates.orderFields) {
                if (!f.key || !f.label) {
                    return res.status(400).json({ message: 'প্রতিটি field এ key এবং label দরকার' });
                }
                // key normalize — শুধু lowercase letters, numbers, underscore
                f.key = String(f.key).toLowerCase().replace(/[^a-z0-9_]/g, '_');
            }
            // order অনুযায়ী sort করো
            updates.orderFields.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        const config = await BusinessConfig.findOneAndUpdate(
            { userId: req.user._id },
            { $set: updates },
            { new: true, upsert: true }
        );

        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;