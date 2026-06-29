const Agent = require('../models/Agent.model');

// ── এই user কি কারো agent? ───────────────────────────────────
// Returns: { isAgent, ownerId, agentUserId, agentDoc }
async function resolveContext(user) {
    // ১. agentUserId দিয়ে link করা আছে কিনা
    let agentDoc = await Agent.findOne({ agentUserId: user._id, active: true });

    // ২. না থাকলে — email দিয়ে খুঁজো (agent register করেছে কিন্তু link হয়নি)
    if (!agentDoc && user.email) {
        agentDoc = await Agent.findOne({ email: user.email.toLowerCase(), active: true });
        // পাওয়া গেলে — এখন link করে দাও (একবারই হবে)
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
        };
    }

    // owner নিজেই
    return {
        isAgent: false,
        ownerId: user._id,
        agentUserId: null,
        agentDoc: null,
    };
}

module.exports = { resolveContext };