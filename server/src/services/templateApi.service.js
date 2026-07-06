const axios = require('axios');

const GRAPH = 'https://graph.facebook.com/v19.0';

// ── WABA এর সব template + status আনো ─────────────────────────
async function getTemplates({ wabaId, accessToken }) {
    const url = `${GRAPH}/${wabaId}/message_templates`;
    const res = await axios.get(url, {
        params: { access_token: accessToken, limit: 100 },
    });

    const data = res.data?.data || [];
    return data.map(t => {
        const bodyComp = (t.components || []).find(c => c.type === 'BODY');
        const bodyText = bodyComp?.text || '';
        // {{1}}, {{2}} গুনে variable সংখ্যা
        const varMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
        const variableCount = new Set(varMatches).size;

        return {
            name: t.name,
            language: t.language,
            status: t.status,           // APPROVED / PENDING / REJECTED
            category: t.category,
            bodyText,
            variableCount,
            components: t.components,
            id: t.id,
            rejectedReason: t.rejected_reason || '',
        };
    });
}

// ── শুধু APPROVED template (broadcast এর জন্য) ───────────────
async function getApprovedTemplates({ wabaId, accessToken }) {
    const all = await getTemplates({ wabaId, accessToken });
    return all.filter(t => t.status === 'APPROVED');
}

// ── নতুন template Meta তে submit করো ─────────────────────────
// components: [{type:'HEADER',...}, {type:'BODY', text}, {type:'FOOTER', text}, {type:'BUTTONS', buttons}]
async function createTemplate({ wabaId, accessToken, name, category, language, components }) {
    const url = `${GRAPH}/${wabaId}/message_templates`;
    const res = await axios.post(url, {
        name,
        category,          // MARKETING / UTILITY / AUTHENTICATION
        language,          // en / bn ইত্যাদি
        components,
    }, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' },
    });

    return res.data;   // { id, status, category }
}

// ── template delete করো ─────────────────────────────────────
async function deleteTemplate({ wabaId, accessToken, name }) {
    const url = `${GRAPH}/${wabaId}/message_templates`;
    const res = await axios.delete(url, {
        params: { access_token: accessToken, name },
    });
    return res.data;
}

// ── APPROVED template পাঠাও (broadcast) ──────────────────────
async function sendTemplate({ phoneNumberId, accessToken, to, templateName, language, variables }) {
    const url = `${GRAPH}/${phoneNumberId}/messages`;

    const components = [];
    if (variables && variables.length > 0) {
        components.push({
            type: 'body',
            parameters: variables.map(v => ({ type: 'text', text: String(v) })),
        });
    }

    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
            name: templateName,
            language: { code: language || 'en' },
            ...(components.length ? { components } : {}),
        },
    };

    const res = await axios.post(url, payload, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
}

module.exports = { getTemplates, getApprovedTemplates, createTemplate, deleteTemplate, sendTemplate };