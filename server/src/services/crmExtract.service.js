const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Client এর custom field অনুযায়ী conversation থেকে data বের করো ──
// fields: [{ key, label, aiHint, type, options }]
// messages: [{ from, text }]
async function extractCustomData(fields, messages) {
    if (!fields?.length) return {};

    const transcript = messages
        .filter(m => m.text && !m.text.startsWith('http'))
        .map(m => `${m.from === 'customer' ? 'Customer' : 'Business'}: ${m.text}`)
        .join('\n');

    if (!transcript || transcript.length < 15) return {};

    // প্রতি field এর জন্য AI কে কী বের করতে হবে বলো
    const fieldDescriptions = fields.map(f => {
        let desc = `"${f.key}": ${f.aiHint || f.label}`;
        if (f.type === 'choice' && f.options?.length) {
            desc += ` (এর মধ্যে একটা: ${f.options.join(', ')})`;
        }
        return desc;
    }).join('\n');

    const systemPrompt = `তুমি একজন CRM data extractor। নিচের customer conversation থেকে এই তথ্যগুলো বের করো।

বের করতে হবে (JSON key এবং কী বের করবে):
${fieldDescriptions}

শুধু একটা JSON object দাও — উপরের key গুলো দিয়ে। কোনো তথ্য না পেলে সেই key এর value খালি string "" দাও। অন্য কিছু লিখবে না।`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcript },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        });

        const data = JSON.parse(completion.choices[0].message.content);

        // শুধু defined field গুলোর value রাখো
        const result = {};
        for (const f of fields) {
            result[f.key] = data[f.key] || '';
        }
        return result;
    } catch (err) {
        console.warn('CRM extract failed:', err.message);
        return {};
    }
}

module.exports = { extractCustomData };