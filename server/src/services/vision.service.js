// const axios = require('axios');
// const OpenAI = require('openai');

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// // ── Meta CDN থেকে image download করো ────────────────────────
// // Meta image URL এ access token লাগে
// const downloadMetaImage = async (imageUrl, accessToken) => {
//     const res = await axios.get(imageUrl, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//         responseType: 'arraybuffer',
//         timeout: 15000,
//     });

//     const base64 = Buffer.from(res.data).toString('base64');
//     const mimeType = res.headers['content-type'] || 'image/jpeg';

//     return { base64, mimeType };
// };

// // ── GPT-4o Vision দিয়ে product চিনো ──────────────────────────
// const analyzeProductImage = async ({ base64, mimeType, knowledgeContext = '' }) => {
//     const systemPrompt = `তুমি একটি intelligent product recognition AI।
// তোমার কাজ হলো customer এর পাঠানো product image দেখে:
// 1. Product টি identify করা
// 2. Order confirm করা
// 3. Price ও details জানানো (যদি knowledge base এ থাকে)

// ${knowledgeContext ? `=== আমাদের Product Catalog ===\n${knowledgeContext}\n=== End ===` : ''}

// Rules:
// - Image এ product clearly দেখা গেলে সেটা identify করো
// - Product catalog এ match থাকলে price ও details দাও
// - Order confirm করতে quantity জিজ্ঞেস করো
// - Friendly এবং professional tone রাখো
// - বাংলায় reply দাও যদি customer বাংলায় message করে`;

//     const response = await openai.chat.completions.create({
//         model: 'gpt-4o',
//         max_tokens: 500,
//         messages: [
//             {
//                 role: 'user',
//                 content: [
//                     {
//                         type: 'image_url',
//                         image_url: {
//                             url: `data:${mimeType};base64,${base64}`,
//                             detail: 'high',
//                         },
//                     },
//                     {
//                         type: 'text',
//                         text: 'এই product টি identify করো এবং order নেওয়ার জন্য reply দাও।',
//                     },
//                 ],
//             },
//         ],
//         system: systemPrompt,
//     });

//     // GPT-4o system message আলাদাভাবে পাঠাতে হয়
//     const visionResponse = await openai.chat.completions.create({
//         model: 'gpt-4o',
//         max_tokens: 500,
//         messages: [
//             { role: 'system', content: systemPrompt },
//             {
//                 role: 'user',
//                 content: [
//                     {
//                         type: 'image_url',
//                         image_url: {
//                             url: `data:${mimeType};base64,${base64}`,
//                             detail: 'high',
//                         },
//                     },
//                     {
//                         type: 'text',
//                         text: 'এই product টি identify করো এবং customer কে order করার সুযোগ দাও।',
//                     },
//                 ],
//             },
//         ],
//     });

//     return visionResponse.choices[0].message.content;
// };

// // ── WhatsApp image URL নাও (separate API call লাগে) ──────────
// const getWhatsAppImageUrl = async (mediaId, accessToken) => {
//     const res = await axios.get(
//         `https://graph.facebook.com/v19.0/${mediaId}`,
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//     );
//     return res.data.url;
// };

// module.exports = { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl };


const axios = require('axios');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Meta CDN থেকে image download করো ────────────────────────
// Messenger image URL এ access token লাগে
const downloadMetaImage = async (imageUrl, accessToken) => {
    try {
        const res = await axios.get(imageUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'Mozilla/5.0',
            },
            responseType: 'arraybuffer',
            timeout: 20000,
        });

        const base64 = Buffer.from(res.data).toString('base64');
        const mimeType = res.headers['content-type']?.split(';')[0] || 'image/jpeg';

        return { base64, mimeType };
    } catch (err) {
        throw new Error(`Image download failed: ${err.message}`);
    }
};

// ── WhatsApp media ID থেকে image URL নাও ─────────────────────
const getWhatsAppImageUrl = async (mediaId, accessToken) => {
    const res = await axios.get(
        `https://graph.facebook.com/v19.0/${mediaId}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
        }
    );
    return res.data.url;
};

// ── GPT-4o Vision দিয়ে product চিনো ──────────────────────────
const analyzeProductImage = async ({ base64, mimeType, knowledgeContext = '' }) => {

    const systemContent = `তুমি একটি intelligent product recognition AI assistant।
তোমার কাজ:
1. Customer এর পাঠানো product image টি identify করা
2. Product match থাকলে price ও details দেওয়া
3. Order নেওয়ার জন্য friendly reply দেওয়া

${knowledgeContext
            ? `=== আমাদের Product Catalog ===\n${knowledgeContext}\n=== End ===\n\nCatalog এ match পেলে সেই তথ্য দাও।`
            : 'Catalog এ product info নেই। Image দেখে product describe করো এবং order নেওয়ার চেষ্টা করো।'
        }

Rules:
- বাংলায় reply দাও
- Friendly ও professional tone রাখো
- Image clearly দেখা না গেলে জিজ্ঞেস করো
- Order confirm করতে quantity জিজ্ঞেস করো`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 500,
            messages: [
                {
                    role: 'system',
                    content: systemContent,
                },
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
                            text: 'এই product টি identify করো এবং customer কে reply দাও।',
                        },
                    ],
                },
            ],
        });

        const answer = response.choices[0]?.message?.content;
        if (!answer) throw new Error('Empty response from GPT-4o Vision');
        return answer;

    } catch (err) {
        console.error('GPT-4o Vision error:', err.message);
        throw err;
    }
};

module.exports = { downloadMetaImage, analyzeProductImage, getWhatsAppImageUrl };