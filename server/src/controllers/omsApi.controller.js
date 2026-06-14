const Order = require('../models/Order.model');
const ApiKey = require('../models/ApiKey.model');

// ── API Key middleware (OMS authentication) ───────────────────
const apiKeyAuth = async (req, res, next) => {
    const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!key) {
        return res.status(401).json({ success: false, message: 'API key required. Header: X-API-Key' });
    }

    const apiKey = await ApiKey.findOne({ key, isActive: true });
    if (!apiKey) {
        return res.status(401).json({ success: false, message: 'Invalid or revoked API key' });
    }

    // Usage track করো
    apiKey.lastUsedAt = new Date();
    apiKey.requestCount += 1;
    await apiKey.save();

    req.apiKey = apiKey;
    req.ownerId = apiKey.userId;
    next();
};

// ── GET /api/v1/orders ───────────────────────────────────────
// OMS সব pending orders নিয়ে যাবে
exports.listOrders = async (req, res) => {
    try {
        const {
            status = 'pending',
            platform,
            from,
            to,
            page = 1,
            limit = 50,
        } = req.query;

        const filter = { userId: req.ownerId };

        if (status !== 'all') filter.status = status;
        if (platform) filter.platform = platform;

        // Date range filter
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip((Number(page) - 1) * Number(limit))
                .limit(Number(limit))
                .lean(),
            Order.countDocuments(filter),
        ]);

        // OMS friendly format এ দাও
        const formatted = orders.map(o => ({
            order_id: o.orderId,
            status: o.status,
            platform: o.platform,
            customer: {
                name: o.customer.name,
                phone: o.customer.phone,
                address: o.customer.address,
            },
            product: {
                name: o.product.name,
                price: o.product.price,
                quantity: o.product.quantity,
            },
            notes: o.notes,
            ordered_at: o.createdAt,
            updated_at: o.updatedAt,
        }));

        res.json({
            success: true,
            total,
            page: Number(page),
            limit: Number(limit),
            orders: formatted,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/v1/orders/:orderId ──────────────────────────────
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            orderId: req.params.orderId,
            userId: req.ownerId,
        }).lean();

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({
            success: true,
            order: {
                order_id: order.orderId,
                status: order.status,
                platform: order.platform,
                customer: order.customer,
                product: order.product,
                notes: order.notes,
                ordered_at: order.createdAt,
                updated_at: order.updatedAt,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PATCH /api/v1/orders/:orderId ────────────────────────────
// OMS status update করবে (shipped, delivered, cancelled etc.)
exports.updateOrder = async (req, res) => {
    try {
        const { status, notes, oms_order_id } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
        }

        const updateFields = { updatedAt: new Date() };
        if (status) updateFields.status = status;
        if (notes) updateFields.notes = notes;
        if (oms_order_id) {
            updateFields.omsOrderId = oms_order_id;
            updateFields.omsSynced = true;
            updateFields.omsSyncedAt = new Date();
        }

        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId, userId: req.ownerId },
            updateFields,
            { new: true }
        );

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        res.json({
            success: true,
            order_id: order.orderId,
            status: order.status,
            updated_at: order.updatedAt,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET /api/v1/ping ─────────────────────────────────────────
exports.ping = async (req, res) => {
    res.json({
        success: true,
        message: 'SoftBrainChat OMS API is running',
        api_key: req.apiKey.name,
        timestamp: new Date(),
    });
};

module.exports.apiKeyAuth = apiKeyAuth;