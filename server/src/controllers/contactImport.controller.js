const Contact = require('../models/Contact.model');
const MetaChannel = require('../models/MetaChannel.model');

// ── Phone number normalize করো (WhatsApp format) ─────────────
// বাংলাদেশ: 01XXXXXXXXX → 8801XXXXXXXXX
function normalizePhone(raw) {
    if (!raw) return null;
    let p = String(raw).replace(/\D/g, '');   // শুধু digit

    if (!p) return null;

    // 01XXXXXXXXX (11 digit BD) → 880 যোগ করো
    if (p.length === 11 && p.startsWith('01')) {
        p = '88' + p;
    }
    // 1XXXXXXXXX (10 digit, 0 ছাড়া) → 880 যোগ করো
    else if (p.length === 10 && p.startsWith('1')) {
        p = '880' + p;
    }
    // already 8801XXXXXXXXX (13 digit) → ঠিক আছে
    // অন্য দেশের number হলে যেমন আছে রাখো

    // valid length check (8-15 digit international)
    if (p.length < 8 || p.length > 15) return null;
    return p;
}

// ── POST /api/contacts/import ────────────────────────────────
// body: { channelId, contacts: [{ name, phone, tags }] }
// (frontend CSV/Excel parse করে এই array পাঠাবে)
exports.importContacts = async (req, res) => {
    try {
        const { channelId, contacts } = req.body;

        if (!channelId) return res.status(400).json({ message: 'Channel select করুন' });
        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ message: 'কোনো contact পাওয়া যায়নি' });
        }

        const channel = await MetaChannel.findOne({ _id: channelId, userId: req.user._id });
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
                // senderId = phone (WhatsApp এ waId হিসেবে কাজ করবে)
                const existing = await Contact.findOne({ userId: req.user._id, senderId: phone, channelId });

                if (existing) {
                    // আগে থেকে আছে — নাম/tag update করো
                    let changed = false;
                    if (name && name !== 'Customer' && existing.name !== name) { existing.name = name; changed = true; }
                    if (tags.length) {
                        const newTags = [...new Set([...existing.tags, ...tags])];
                        if (newTags.length !== existing.tags.length) { existing.tags = newTags; changed = true; }
                    }
                    if (changed) await existing.save();
                    updated += 1;
                } else {
                    // নতুন contact তৈরি করো
                    await Contact.create({
                        userId: req.user._id,
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
            errors: errors.slice(0, 20),   // প্রথম ২০টা error
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = exports;