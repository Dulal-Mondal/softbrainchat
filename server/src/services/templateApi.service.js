const axios = require('axios');

const GRAPH = 'https://graph.facebook.com/v19.0';

// ── WhatsApp এর approved template গুলো নিয়ে আসো ──────────────
// Meta Console এ যে template গুলো approve হয়েছে
async function getTemplates({ wabaId, accessToken }) {
    if (!wabaId) throw new Error('WABA ID দরকার (channel এ wabaId সেট করুন)');
    const res = await axios.get(
        `${GRAPH}/${wabaId}/message_templates`,
        {
            params: { access_token: accessToken, limit: 100 },
        }
    );
    // শুধু APPROVED template গুলো ফেরত দাও
    return (res.data.data || [])
        .filter(t => t.status === 'APPROVED')
        .map(t => ({
            name: t.name,
            language: t.language,
            category: t.category,
            components: t.components,
            // body text বের করো (preview এর জন্য)
            bodyText: t.components?.find(c => c.type === 'BODY')?.text || '',
            // কয়টা variable ({{1}}, {{2}}...) আছে
            variableCount: (t.components?.find(c => c.type === 'BODY')?.text?.match(/\{\{\d+\}\}/g) || []).length,
        }));
}

// ── Template message পাঠাও ──────────────────────────────────
// variables: ['Rahim', '50% off'] → {{1}}=Rahim, {{2}}=50% off
async function sendTemplate({ phoneNumberId, accessToken, to, templateName, language, variables = [] }) {
    const components = [];

    // variable থাকলে body component যোগ করো
    if (variables.length > 0) {
        components.push({
            type: 'body',
            parameters: variables.map(v => ({ type: 'text', text: String(v) })),
        });
    }

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
            name: templateName,
            language: { code: language || 'en' },
            ...(components.length > 0 ? { components } : {}),
        },
    };

    const res = await axios.post(
        `${GRAPH}/${phoneNumberId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
}

module.exports = { getTemplates, sendTemplate };