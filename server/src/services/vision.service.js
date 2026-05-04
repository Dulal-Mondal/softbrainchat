const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Meta CDN থেকে image download করো ────────────────────────
// Meta image URL এ access token লাগে
const downloadMetaImage = async (imageUrl, accessToken) => {
    const res = await axios.get(imageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'arraybuffer',
        timeout: 15000,
    });

    const base64 = Buffer.from(res.data).toString('base64');
    const mimeType = res.headers['content-type'] || 'image/jpeg';

    return { base64, mimeType };
};

// ── GPT-4o Vision দিয়ে product চিনো ──────────────────────────
const analyzeProductImage = async ({ base64, mimeType, knowledgeContext = '' }) => {
    const systemPrompt = `তুমি একটি intelligent product recognition AI।
তোমার কাজ হলো customer এর পাঠানো product image দেখে:
1. Product টি identify করা
2. Order confirm করা
3. Price ও details জানানো (যদি knowledge base এ থাকে)

${knowledgeContext ? `=== আমাদের Product Catalog ===\n${knowledgeContext}\n=== End ===` : ''}

Rules:
- Image এ product clearly দেখা গেলে সেটা identify করো
- Product catalog এ match থাকলে price ও details দাও
- Order confirm করতে quantity জিজ্ঞেস করো
- Friendly এবং professional tone রাখো
- বাংলায় reply দাও যদি customer বাংলায় message করে`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${base64}`,
                            detail: 'high',
                        },
                    },
                    {
                        type: 'text',
                        text: 'এই product টি identify করো এবং order নেওয়ার জন্য reply দাও।',
                    },
                ],
            },
        ],
        system: systemPrompt,
    });

    // GPT-4o system message আলাদাভাবে পাঠাতে হয়
    const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${base64}`,
                            detail: 'high',
                        },
                    },
                    {
                        type: 'text',
                        text: 'এই product টি identify করো এবং customer কে order করার সুযোগ দাও।',
                    },
                ],
            },
        ],
    });

    return visionResponse.choices[0].message.content;
};

// ── WhatsApp image URL নাও (separate API call লাগে) ──────────
const getWhatsAppImageUrl = async (mediaId, accessToken) => {
    const res = await axios.get(
        `https://graph.facebook.com/v19.0/${mediaId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data.url;
};

module.exports = { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl };