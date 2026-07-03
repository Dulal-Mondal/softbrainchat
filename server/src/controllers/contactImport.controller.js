const Contact = require('../models/Contact.model');
const MetaChannel = require('../models/MetaChannel.model');

// agent context — না থাকলেও crash করবে না
let resolveContext = async (user) => ({ isAgent: false, ownerId: user._id, agentUserId: null });
try { ({ resolveContext } = require('../utils/agentContext')); } catch (e) { /* helper not installed */ }

// ── Phone number normalize করো (WhatsApp format) ─────────────
function normalizePhone(raw) {
    if (!raw) return null;
    let p = String(raw).replace(/\D/g, '');

    if (!p) return null;

    if (p.length === 11 && p.startsWith('01')) {
        p = '88' + p;
    }
    else if (p.length === 10 && p.startsWith('1')) {
        p = '880' + p;
    }

    if (p.length < 8 || p.length > 15) return null;
    return p;
}

// ── POST /api/contacts/import ────────────────────────────────
exports.importContacts = async (req, res) => {
    try {
        const ctx = await resolveContext(req.user);
        const { channelId, contacts } = req.body;

        if (!channelId) return res.status(400).json({ message: 'Channel select করুন' });
        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ message: 'কোনো contact পাওয়া যায়নি' });
        }

        // agent হলে — এই channel এ access আছে কিনা
        if (ctx.isAgent && ctx.agentDoc?.allowedChannels?.length) {
            const allowed = ctx.agentDoc.allowedChannels.map(String);
            if (!allowed.includes(String(channelId))) {
                return res.status(403).json({ message: 'এই channel এ আপনার access নেই' });
            }
        }

        // channel টা owner এর (agent owner এর channel এ import করবে)
        const channel = await MetaChannel.findOne({ _id: channelId, userId: ctx.ownerId });
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        let imported = 0, skipped = 0, updated = 0;
        const errors = [];

        for (const row of contacts) {
            const phone = normalizePhone(row.phone);
            if (!phone) {
                skipped += 1;
                if (row.phone) errors.push({ phone: row.phone, reason: 'invalid number' });
                continue;
            }

            const name = (row.name || '').trim() || 'Customer';
            const tags = Array.isArray(row.tags)
                ? row.tags
                : (row.tags ? String(row.tags).split(',').map(t => t.trim()).filter(Boolean) : []);

            try {
                // contact owner এর অধীনে save হবে (agent import করলেও)
                const existing = await Contact.findOne({ userId: ctx.ownerId, senderId: phone, channelId });

                if (existing) {
                    let changed = false;
                    if (name && name !== 'Customer' && existing.name !== name) { existing.name = name; changed = true; }
                    if (tags.length) {
                        const newTags = [...new Set([...existing.tags, ...tags])];
                        if (newTags.length !== existing.tags.length) { existing.tags = newTags; changed = true; }
                    }
                    if (changed) await existing.save();
                    updated += 1;
                } else {
                    await Contact.create({
                        userId: ctx.ownerId,   // owner এর অধীনে
                        senderId: phone,
                        channelId,
                        platform: channel.platform,
                        name,
                        phone,
                        tags,
                        lead: { stage: 'new' },
                        lastMessageText: '[Imported]',
                    });
                    imported += 1;
                }
            } catch (e) {
                skipped += 1;
                errors.push({ phone, reason: e.message?.slice(0, 100) });
            }
        }

        res.json({
            success: true,
            imported, updated, skipped,
            total: contacts.length,
            errors: errors.slice(0, 20),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;