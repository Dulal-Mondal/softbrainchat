const Agent = require('../models/Agent.model');

// ── এই user কি কারো agent? permission সহ ──
async function resolveContext(user) {
    let agentDoc = await Agent.findOne({ agentUserId: user._id, active: true });

    if (!agentDoc && user.email) {
        agentDoc = await Agent.findOne({ email: user.email.toLowerCase(), active: true });
        if (agentDoc && !agentDoc.agentUserId) {
            agentDoc.agentUserId = user._id;
            await agentDoc.save();
        }
    }

    if (agentDoc) {
        return {
            isAgent: true,
            ownerId: agentDoc.ownerId,
            agentUserId: user._id,
            agentDoc,
            permissions: agentDoc.permissions || ['inbox'],
        };
    }

    return {
        isAgent: false,
        ownerId: user._id,
        agentUserId: null,
        agentDoc: null,
        permissions: null,   // owner — সব access
    };
}

module.exports = { resolveContext };