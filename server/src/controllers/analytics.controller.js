const MetaMessage = require('../models/MetaMessage.model');
const MetaChannel = require('../models/MetaChannel.model');

// optional models
let Contact = null, Order = null, Broadcast = null;
try { Contact = require('../models/Contact.model'); } catch (e) { }
try { Order = require('../models/Order.model'); } catch (e) { }
try { Broadcast = require('../models/Broadcast.model'); } catch (e) { }

// ── GET /api/analytics/dashboard ─────────────────────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ── Message stats ──
        const [totalMsgs, aiReplied, humanReplied, reviewNeeded] = await Promise.all([
            MetaMessage.countDocuments({ userId }),
            MetaMessage.countDocuments({ userId, status: 'ai_replied' }),
            MetaMessage.countDocuments({ userId, status: 'human_replied' }),
            MetaMessage.countDocuments({ userId, status: 'review_needed' }),
        ]);

        // ── Platform breakdown ──
        const platformAgg = await MetaMessage.aggregate([
            { $match: { userId } },
            { $group: { _id: '$platform', count: { $sum: 1 } } },
        ]);
        const byPlatform = { whatsapp: 0, messenger: 0, instagram: 0 };
        platformAgg.forEach(p => { if (p._id) byPlatform[p._id] = p.count; });

        // ── Last 7 days daily message count (line chart) ──
        const dailyAgg = await MetaMessage.aggregate([
            { $match: { userId, createdAt: { $gte: last7Start } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    ai: { $sum: { $cond: [{ $eq: ['$status', 'ai_replied'] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // গত ৭ দিনের প্রতিটা দিন (খালি দিন ০ সহ)
        const daily = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            const found = dailyAgg.find(x => x._id === key);
            daily.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                total: found?.count || 0,
                ai: found?.ai || 0,
            });
        }

        // ── Channels ──
        const channels = await MetaChannel.countDocuments({ userId, isActive: true });

        // ── Contacts (CRM) ──
        let totalContacts = 0, leadStages = {};
        if (Contact) {
            totalContacts = await Contact.countDocuments({ userId });
            const stageAgg = await Contact.aggregate([
                { $match: { userId } },
                { $group: { _id: '$lead.stage', count: { $sum: 1 } } },
            ]);
            stageAgg.forEach(s => { leadStages[s._id || 'new'] = s.count; });
        }

        // ── Orders ──
        let totalOrders = 0, ordersByStatus = {};
        if (Order) {
            totalOrders = await Order.countDocuments({ userId });
            const orderAgg = await Order.aggregate([
                { $match: { userId } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]);
            orderAgg.forEach(o => { ordersByStatus[o._id || 'pending'] = o.count; });
        }

        // ── Broadcasts ──
        let totalBroadcasts = 0, broadcastSent = 0;
        if (Broadcast) {
            totalBroadcasts = await Broadcast.countDocuments({ userId });
            const bcAgg = await Broadcast.aggregate([
                { $match: { userId } },
                { $group: { _id: null, sent: { $sum: '$sentCount' } } },
            ]);
            broadcastSent = bcAgg[0]?.sent || 0;
        }

        const aiRate = totalMsgs ? Math.round((aiReplied / totalMsgs) * 100) : 0;

        res.json({
            success: true,
            stats: {
                messages: { total: totalMsgs, aiReplied, humanReplied, reviewNeeded, aiRate },
                byPlatform,
                daily,
                channels,
                contacts: { total: totalContacts, leadStages },
                orders: { total: totalOrders, byStatus: ordersByStatus },
                broadcasts: { total: totalBroadcasts, sent: broadcastSent },
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;