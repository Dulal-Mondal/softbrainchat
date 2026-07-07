const cloudinary = require('cloudinary').v2;
const axios = require('axios');

// ── Cloudinary config (env থেকে) ────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary configure আছে কিনা check
const isConfigured = () =>
    !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// ── base64 (image বা audio) → Cloudinary তে upload → permanent URL ─
const uploadBase64 = async (base64, mimeType = 'image/jpeg', folder = 'softbrainchat/orders') => {
    if (!isConfigured()) {
        console.warn('⚠️ Cloudinary not configured — upload skipped');
        return '';
    }
    try {
        const dataUri = `data:${mimeType};base64,${base64}`;

        // ── audio/voice হলে আলাদা handle ──
        // Cloudinary audio কে 'video' resource_type হিসেবে নেয়
        const isAudio = mimeType?.startsWith('audio');

        if (isAudio) {
            const result = await cloudinary.uploader.upload(dataUri, {
                folder,
                resource_type: 'video',   // audio = video (Cloudinary নিয়ম)
                // audio এ transformation নেই
            });
            console.log(`🎤 Audio uploaded to Cloudinary: ${result.secure_url}`);
            return result.secure_url;
        }

        // ── image হলে (আগের মতো) ──
        const result = await cloudinary.uploader.upload(dataUri, {
            folder,
            resource_type: 'image',
            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        });
        console.log(`☁️  Image uploaded to Cloudinary: ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.warn('Cloudinary upload failed:', err.message);
        return '';
    }
};

// ── একটা (temporary/auth) URL → download → Cloudinary ───────
const uploadFromUrl = async (mediaUrl, accessToken = '', folder = 'softbrainchat/orders') => {
    if (!isConfigured()) {
        console.warn('⚠️ Cloudinary not configured — keeping original URL');
        return mediaUrl;
    }
    try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Mozilla/5.0' } : {};
        const res = await axios.get(mediaUrl, { headers, responseType: 'arraybuffer', timeout: 20000 });
        const base64 = Buffer.from(res.data).toString('base64');
        const mimeType = res.headers['content-type']?.split(';')[0] || 'image/jpeg';
        return await uploadBase64(base64, mimeType, folder);
    } catch (err) {
        console.warn('Media download+upload failed:', err.message);
        return '';
    }
};

module.exports = { uploadBase64, uploadFromUrl, isConfigured };