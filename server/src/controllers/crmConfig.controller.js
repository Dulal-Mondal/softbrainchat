const CrmConfig = require('../models/CrmConfig.model');
const Contact = require('../models/Contact.model');

// ── GET /api/crm-config ──────────────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        let config = await CrmConfig.findOne({ userId: req.user._id });
        if (!config) config = await CrmConfig.create({ userId: req.user._id });
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/crm-config ────────────────────────────────────
exports.updateConfig = async (req, res) => {
    try {
        const { fields } = req.body;
        if (!Array.isArray(fields)) {
            return res.status(400).json({ message: 'fields array দরকার' });
        }
        for (const f of fields) {
            if (!f.key || !f.label) {
                return res.status(400).json({ message: 'প্রতিটি field এ key ও label দরকার' });
            }
            f.key = String(f.key).toLowerCase().replace(/[^a-z0-9_]/g, '_');
        }
        fields.sort((a, b) => (a.order || 0) - (b.order || 0));

        const config = await CrmConfig.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { fields } },
            { new: true, upsert: true }
        );
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;