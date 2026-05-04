// const axios = require('axios');

// const GRAPH = 'https://graph.facebook.com/v19.0';

// // ── WhatsApp Business API ─────────────────────────────────────
// const sendWhatsApp = async ({ phoneNumberId, accessToken, to, text }) => {
//     const res = await axios.post(
//         `${GRAPH}/${phoneNumberId}/messages`,
//         {
//             messaging_product: 'whatsapp',
//             recipient_type: 'individual',
//             to,
//             type: 'text',
//             text: { preview_url: false, body: text },
//         },
//         {
//             headers: {
//                 Authorization: `Bearer ${accessToken}`,
//                 'Content-Type': 'application/json',
//             },
//         }
//     );
//     return res.data;
// };

// // ── Facebook Messenger Send API ───────────────────────────────
// const sendMessenger = async ({ accessToken, recipientId, text }) => {
//     const res = await axios.post(
//         `${GRAPH}/me/messages`,
//         {
//             recipient: { id: recipientId },
//             message: { text },
//         },
//         {
//             params: { access_token: accessToken },
//             headers: { 'Content-Type': 'application/json' },
//         }
//     );
//     return res.data;
// };

// // ── Instagram Messaging API ───────────────────────────────────
// // Instagram Messaging API ঠিক Messenger API এর মতোই
// const sendInstagram = async ({ accessToken, recipientId, text }) => {
//     const res = await axios.post(
//         `${GRAPH}/me/messages`,
//         {
//             recipient: { id: recipientId },
//             message: { text },
//         },
//         {
//             params: { access_token: accessToken },
//             headers: { 'Content-Type': 'application/json' },
//         }
//     );
//     return res.data;
// };

// // ── Unified send — platform detect করে সঠিক API call ─────────
// const sendReply = async ({ platform, channel, recipientId, text }) => {
//     try {
//         if (platform === 'whatsapp') {
//             return await sendWhatsApp({
//                 phoneNumberId: channel.phoneNumberId,
//                 accessToken: channel.accessToken,
//                 to: recipientId,
//                 text,
//             });
//         }

//         if (platform === 'messenger') {
//             return await sendMessenger({
//                 accessToken: channel.accessToken,
//                 recipientId,
//                 text,
//             });
//         }

//         if (platform === 'instagram') {
//             return await sendInstagram({
//                 accessToken: channel.accessToken,
//                 recipientId,
//                 text,
//             });
//         }

//         throw new Error(`Unknown platform: ${platform}`);
//     } catch (err) {
//         const detail = err.response?.data?.error?.message || err.message;
//         throw new Error(`Meta API error (${platform}): ${detail}`);
//     }
// };

// // ── Webhook verify ────────────────────────────────────────────
// // Meta GET request এ hub.verify_token check করে
// const verifyWebhook = (query, verifyToken) => {
//     const mode = query['hub.mode'];
//     const token = query['hub.verify_token'];
//     const challenge = query['hub.challenge'];

//     if (mode === 'subscribe' && token === verifyToken) {
//         return { success: true, challenge };
//     }
//     return { success: false };
// };

// // ── Extract message from webhook payload ──────────────────────
// // Platform অনুযায়ী message data বের করো
// const extractMessage = (body, platform) => {
//     try {
//         if (platform === 'whatsapp') {
//             const entry = body.entry?.[0];
//             const changes = entry?.changes?.[0]?.value;
//             const msg = changes?.messages?.[0];

//             if (!msg || msg.type !== 'text') return null;

//             return {
//                 messageId: msg.id,
//                 senderId: msg.from,
//                 senderName: changes.contacts?.[0]?.profile?.name || 'WhatsApp User',
//                 text: msg.text?.body,
//             };
//         }

//         if (platform === 'messenger' || platform === 'instagram') {
//             const entry = body.entry?.[0];
//             const messaging = entry?.messaging?.[0];

//             if (!messaging?.message?.text) return null;

//             return {
//                 messageId: messaging.message.mid,
//                 senderId: messaging.sender.id,
//                 senderName: 'User',
//                 text: messaging.message.text,
//             };
//         }

//         return null;
//     } catch {
//         return null;
//     }
// };

// module.exports = { sendReply, verifyWebhook, extractMessage };



const axios = require('axios');

const GRAPH = 'https://graph.facebook.com/v19.0';

// ── WhatsApp Business API ─────────────────────────────────────
const sendWhatsApp = async ({ phoneNumberId, accessToken, to, text }) => {
    const res = await axios.post(
        `${GRAPH}/${phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: false, body: text },
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }
    );
    return res.data;
};

// ── Facebook Messenger Send API ───────────────────────────────
const sendMessenger = async ({ accessToken, recipientId, text }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        {
            recipient: { id: recipientId },
            message: { text },
        },
        {
            params: { access_token: accessToken },
            headers: { 'Content-Type': 'application/json' },
        }
    );
    return res.data;
};

// ── Instagram Messaging API ───────────────────────────────────
const sendInstagram = async ({ accessToken, recipientId, text }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        {
            recipient: { id: recipientId },
            message: { text },
        },
        {
            params: { access_token: accessToken },
            headers: { 'Content-Type': 'application/json' },
        }
    );
    return res.data;
};

// ── Unified send ──────────────────────────────────────────────
const sendReply = async ({ platform, channel, recipientId, text }) => {
    try {
        if (platform === 'whatsapp') {
            return await sendWhatsApp({
                phoneNumberId: channel.phoneNumberId,
                accessToken: channel.accessToken,
                to: recipientId,
                text,
            });
        }
        if (platform === 'messenger') {
            return await sendMessenger({ accessToken: channel.accessToken, recipientId, text });
        }
        if (platform === 'instagram') {
            return await sendInstagram({ accessToken: channel.accessToken, recipientId, text });
        }
        throw new Error(`Unknown platform: ${platform}`);
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        throw new Error(`Meta API error (${platform}): ${detail}`);
    }
};

// ── Webhook verify ────────────────────────────────────────────
const verifyWebhook = (query, verifyToken) => {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
        return { success: true, challenge };
    }
    return { success: false };
};

// ── Extract message from webhook payload ──────────────────────
// Text এবং Image উভয়ই handle করো
const extractMessage = (body, platform) => {
    try {
        if (platform === 'whatsapp') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0]?.value;
            const msg = changes?.messages?.[0];
            if (!msg) return null;

            const base = {
                messageId: msg.id,
                senderId: msg.from,
                senderName: changes.contacts?.[0]?.profile?.name || 'WhatsApp User',
            };

            // ── Text message ────────────────────────────────────────
            if (msg.type === 'text') {
                return { ...base, type: 'text', text: msg.text?.body };
            }

            // ── Image message ────────────────────────────────────────
            if (msg.type === 'image') {
                return {
                    ...base,
                    type: 'image',
                    text: msg.image?.caption || '',   // image এর সাথে caption থাকতে পারে
                    mediaId: msg.image?.id,              // WhatsApp media ID (আলাদা API call লাগে URL পেতে)
                    mimeType: msg.image?.mime_type || 'image/jpeg',
                };
            }

            // ── Sticker / video / audio — ignore ────────────────────
            return null;
        }

        if (platform === 'messenger' || platform === 'instagram') {
            const entry = body.entry?.[0];
            const messaging = entry?.messaging?.[0];
            if (!messaging) return null;

            const base = {
                messageId: messaging.message.mid,
                senderId: messaging.sender.id,
                senderName: 'User',
            };

            // ── Text message ─────────────────────────────────────────
            if (messaging.message?.text) {
                return { ...base, type: 'text', text: messaging.message.text };
            }

            // ── Image attachment ──────────────────────────────────────
            const attachment = messaging.message?.attachments?.[0];
            if (attachment?.type === 'image') {
                return {
                    ...base,
                    type: 'image',
                    text: '',
                    imageUrl: attachment.payload?.url,   // Messenger/Instagram direct URL দেয়
                    mimeType: 'image/jpeg',
                };
            }

            return null;
        }

        return null;
    } catch {
        return null;
    }
};


// ── Customer এর Facebook profile info নাও ────────────────────
const getSenderProfile = async ({ platform, senderId, accessToken }) => {
    try {
        if (platform === 'messenger' || platform === 'instagram') {
            const res = await axios.get(
                `https://graph.facebook.com/v19.0/${senderId}`,
                {
                    params: {
                        fields: 'name,profile_pic',
                        access_token: accessToken,
                    },
                }
            );
            return {
                name: res.data.name || 'Customer',
                profilePic: res.data.profile_pic || '',
            };
        }

        if (platform === 'whatsapp') {
            // WhatsApp Business API তে profile pic সরাসরি পাওয়া যায় না
            // শুধু contact নাম পাওয়া যায় webhook payload থেকে
            return { name: 'WhatsApp Customer', profilePic: '' };
        }

        return { name: 'Customer', profilePic: '' };
    } catch (err) {
        console.warn('Profile fetch failed:', err.message);
        return { name: 'Customer', profilePic: '' };
    }
};

module.exports = { sendReply, verifyWebhook, extractMessage, getSenderProfile };