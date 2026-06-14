const OmsConfig = require('../models/OmsConfig.model');
const { testOmsConnection } = require('../services/oms.service');

// ── GET /api/orders/oms-config ───────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        let config = await OmsConfig.findOne({ userId: req.user._id });
        if (!config) {
            // Default config তৈরি করো
            config = await OmsConfig.create({ userId: req.user._id });
        }

        // Sensitive fields mask করো
        const safe = {
            _id: config._id,
            enabled: config.enabled,
            apiUrl: config.apiUrl,
            authType: config.authType,
            apiKey: config.apiKey ? '••••' + config.apiKey.slice(-6) : '',
            bearerToken: config.bearerToken ? '••••' + config.bearerToken.slice(-6) : '',
            basicUsername: config.basicUsername,
            basicPassword: config.basicPassword ? '••••' : '',
            apiKeyHeader: config.apiKeyHeader,
            payloadFormat: config.payloadFormat,
            fieldMapping: config.fieldMapping,
            lastSyncAt: config.lastSyncAt,
            lastSyncStatus: config.lastSyncStatus,
            lastSyncError: config.lastSyncError,
        };

        res.json({ success: true, config: safe });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/orders/oms-config ─────────────────────────────
exports.updateConfig = async (req, res) => {
    try {
        const {
            enabled, apiUrl, authType,
            apiKey, bearerToken, basicUsername, basicPassword,
            apiKeyHeader, payloadFormat, fieldMapping,
        } = req.body;

        const update = {};
        if (enabled !== undefined) update.enabled = enabled;
        if (apiUrl !== undefined) update.apiUrl = apiUrl;
        if (authType !== undefined) update.authType = authType;
        if (apiKeyHeader !== undefined) update.apiKeyHeader = apiKeyHeader;
        if (payloadFormat !== undefined) update.payloadFormat = payloadFormat;
        if (fieldMapping !== undefined) update.fieldMapping = fieldMapping;

        // Sensitive fields — শুধু আসলে নতুন value দিলে update করো
        if (apiKey && !apiKey.includes('••••')) update.apiKey = apiKey;
        if (bearerToken && !bearerToken.includes('••••')) update.bearerToken = bearerToken;
        if (basicUsername !== undefined) update.basicUsername = basicUsername;
        if (basicPassword && !basicPassword.includes('••••')) update.basicPassword = basicPassword;

        const config = await OmsConfig.findOneAndUpdate(
            { userId: req.user._id },
            update,
            { new: true, upsert: true }
        );

        res.json({ success: true, message: 'OMS config saved' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/orders/oms-config/test ─────────────────────────
// OMS connection test করো
exports.testConfig = async (req, res) => {
    try {
        const config = await OmsConfig.findOne({ userId: req.user._id });
        if (!config || !config.apiUrl) {
            return res.status(400).json({ message: 'OMS URL set করুন আগে' });
        }

        const result = await testOmsConnection(config);

        if (result.success) {
            res.json({ success: true, message: '✅ OMS server connected successfully!', status: result.status });
        } else {
            res.json({ success: false, message: `❌ Connection failed: ${result.error}` });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};