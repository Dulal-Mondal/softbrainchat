const axios = require('axios');

const GRAPH = 'https://graph.facebook.com/v19.0';

// ── WhatsApp — text ─────────────────────────────────────────
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
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── WhatsApp — image ────────────────────────────────────────
const sendWhatsAppImage = async ({ phoneNumberId, accessToken, to, imageUrl, caption }) => {
    const res = await axios.post(
        `${GRAPH}/${phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'image',
            image: { link: imageUrl, ...(caption ? { caption } : {}) },
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── WhatsApp — audio (voice message) ────────────────────────
const sendWhatsAppAudio = async ({ phoneNumberId, accessToken, to, audioUrl }) => {
    const res = await axios.post(
        `${GRAPH}/${phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'audio',
            audio: { link: audioUrl },
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── Messenger — text ────────────────────────────────────────
const sendMessenger = async ({ accessToken, recipientId, text, messageTag }) => {
    const payload = {
        recipient: { id: recipientId },
        message: { text },
        messaging_type: messageTag ? 'MESSAGE_TAG' : 'RESPONSE',
    };
    if (messageTag) payload.tag = messageTag;

    const res = await axios.post(`${GRAPH}/me/messages`, payload, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
};

// ── Messenger — image ───────────────────────────────────────
const sendMessengerImage = async ({ accessToken, recipientId, imageUrl }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'image',
                    payload: { url: imageUrl, is_reusable: true },
                },
            },
        },
        { params: { access_token: accessToken }, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── Messenger — audio ───────────────────────────────────────
const sendMessengerAudio = async ({ accessToken, recipientId, audioUrl }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: 'audio',
                    payload: { url: audioUrl, is_reusable: true },
                },
            },
        },
        { params: { access_token: accessToken }, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── Instagram — text ────────────────────────────────────────
const sendInstagram = async ({ accessToken, recipientId, text }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        { recipient: { id: recipientId }, message: { text } },
        { params: { access_token: accessToken }, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── Instagram — image ───────────────────────────────────────
const sendInstagramImage = async ({ accessToken, recipientId, imageUrl }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        {
            recipient: { id: recipientId },
            message: { attachment: { type: 'image', payload: { url: imageUrl } } },
        },
        { params: { access_token: accessToken }, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── Instagram — audio ───────────────────────────────────────
const sendInstagramAudio = async ({ accessToken, recipientId, audioUrl }) => {
    const res = await axios.post(
        `${GRAPH}/me/messages`,
        {
            recipient: { id: recipientId },
            message: { attachment: { type: 'audio', payload: { url: audioUrl } } },
        },
        { params: { access_token: accessToken }, headers: { 'Content-Type': 'application/json' } }
    );
    return res.data;
};

// ── Unified send ──────────────────────────────────────────────
// text পাঠাতে: { text }
// image পাঠাতে: { imageUrl }  (caption ঐচ্ছিক)
// voice পাঠাতে: { audioUrl }
const sendReply = async ({ platform, channel, recipientId, text, imageUrl, audioUrl, caption, messageTag }) => {
    try {
        // ── Audio (voice message) পাঠানো ──
        if (audioUrl) {
            if (platform === 'whatsapp') {
                return await sendWhatsAppAudio({
                    phoneNumberId: channel.phoneNumberId,
                    accessToken: channel.accessToken,
                    to: recipientId, audioUrl,
                });
            }
            if (platform === 'messenger') {
                return await sendMessengerAudio({ accessToken: channel.accessToken, recipientId, audioUrl });
            }
            if (platform === 'instagram') {
                return await sendInstagramAudio({ accessToken: channel.accessToken, recipientId, audioUrl });
            }
        }

        // ── Image পাঠানো ──
        if (imageUrl) {
            if (platform === 'whatsapp') {
                return await sendWhatsAppImage({
                    phoneNumberId: channel.phoneNumberId,
                    accessToken: channel.accessToken,
                    to: recipientId, imageUrl, caption,
                });
            }
            if (platform === 'messenger') {
                return await sendMessengerImage({ accessToken: channel.accessToken, recipientId, imageUrl });
            }
            if (platform === 'instagram') {
                return await sendInstagramImage({ accessToken: channel.accessToken, recipientId, imageUrl });
            }
        }

        // ── Text পাঠানো ──
        if (platform === 'whatsapp') {
            return await sendWhatsApp({
                phoneNumberId: channel.phoneNumberId,
                accessToken: channel.accessToken,
                to: recipientId, text,
            });
        }
        if (platform === 'messenger') {
            return await sendMessenger({ accessToken: channel.accessToken, recipientId, text, messageTag });
        }
        if (platform === 'instagram') {
            return await sendInstagram({ accessToken: channel.accessToken, recipientId, text });
        }
        throw new Error(`Unknown platform: ${platform}`);
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        const code = err.response?.data?.error?.code;
        if (code === 10) {
            throw new Error(`Meta API error (${platform}): Customer ২৪ ঘণ্টার বেশি আগে message দিয়েছে। শুধু active customer দের reply করা যায়।`);
        }
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

// ── Extract message ───────────────────────────────────────────
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
            if (msg.type === 'text') return { ...base, type: 'text', text: msg.text?.body };
            if (msg.type === 'image') {
                return { ...base, type: 'image', text: msg.image?.caption || '', mediaId: msg.image?.id, mimeType: msg.image?.mime_type || 'image/jpeg' };
            }
            // ── audio / voice message ──
            if (msg.type === 'audio' || msg.type === 'voice') {
                const audio = msg.audio || msg.voice;
                return { ...base, type: 'audio', text: '', mediaId: audio?.id, mimeType: audio?.mime_type || 'audio/ogg' };
            }
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
            if (messaging.message?.text) return { ...base, type: 'text', text: messaging.message.text };
            const attachment = messaging.message?.attachments?.[0];
            if (attachment?.type === 'image') {
                return { ...base, type: 'image', text: '', imageUrl: attachment.payload?.url, mimeType: 'image/jpeg' };
            }
            // ── audio attachment ──
            if (attachment?.type === 'audio') {
                return { ...base, type: 'audio', text: '', audioUrl: attachment.payload?.url, mimeType: 'audio/mpeg' };
            }
            return null;
        }
        return null;
    } catch {
        return null;
    }
};

// ── WhatsApp media URL (audio/image download এর জন্য) ────────
const getWhatsAppMediaUrl = async (mediaId, accessToken) => {
    const res = await axios.get(`${GRAPH}/${mediaId}`, {
        params: { access_token: accessToken },
    });
    return res.data.url;   // temporary URL (auth token দিয়ে download করতে হয়)
};

// ── Media download (customer এর voice শোনার জন্য) ────────────
// returns { base64, mimeType }
const downloadWhatsAppMedia = async (mediaUrl, accessToken) => {
    const res = await axios.get(mediaUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'arraybuffer',
    });
    const base64 = Buffer.from(res.data).toString('base64');
    const mimeType = res.headers['content-type'] || 'audio/ogg';
    return { base64, mimeType };
};

// ── Sender profile ────────────────────────────────────────────
const getSenderProfile = async ({ platform, senderId, accessToken }) => {
    try {
        if (platform === 'messenger' || platform === 'instagram') {
            const res = await axios.get(`${GRAPH}/${senderId}`, {
                params: { fields: 'name,profile_pic', access_token: accessToken },
            });
            return { name: res.data.name || 'Customer', profilePic: res.data.profile_pic || '' };
        }
        if (platform === 'whatsapp') {
            return { name: 'WhatsApp Customer', profilePic: '' };
        }
        return { name: 'Customer', profilePic: '' };
    } catch (err) {
        console.warn('Profile fetch failed:', err.message);
        return { name: 'Customer', profilePic: '' };
    }
};

module.exports = { sendReply, verifyWebhook, extractMessage, getSenderProfile, getWhatsAppMediaUrl, downloadWhatsAppMedia };