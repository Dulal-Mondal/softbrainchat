// const axios = require('axios');
// const OmsConfig = require('../models/OmsConfig.model');

// // ── Payload format অনুযায়ী data convert করো ─────────────────
// const buildPayload = (order, format, fieldMapping = {}) => {

//     if (format === 'softbrainchat' || !format) {
//         return {
//             order_id: order.orderId,
//             source: `SoftBrainChat (${order.platform})`,
//             status: 'pending',
//             customer: {
//                 name: order.customer.name,
//                 phone: order.customer.phone,
//                 address: order.customer.address,
//             },
//             product: {
//                 name: order.product.name,
//                 price: order.product.price,
//                 quantity: order.product.quantity,
//             },
//             notes: order.notes || '',
//             ordered_at: order.createdAt,
//         };
//     }

//     if (format === 'woocommerce') {
//         const price = parseFloat(order.product.price?.replace(/[^0-9.]/g, '') || '0');
//         return {
//             status: 'pending',
//             meta_data: [
//                 { key: 'softbrainchat_order_id', value: order.orderId },
//                 { key: 'source_platform', value: order.platform },
//             ],
//             billing: {
//                 first_name: order.customer.name.split(' ')[0] || order.customer.name,
//                 last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
//                 phone: order.customer.phone,
//                 address_1: order.customer.address,
//                 country: 'BD',
//             },
//             shipping: {
//                 first_name: order.customer.name.split(' ')[0] || order.customer.name,
//                 last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
//                 address_1: order.customer.address,
//                 country: 'BD',
//             },
//             line_items: [{
//                 name: order.product.name,
//                 quantity: order.product.quantity || 1,
//                 price: price.toString(),
//                 total: (price * (order.product.quantity || 1)).toString(),
//             }],
//             customer_note: order.notes || `Order via SoftBrainChat (${order.platform})`,
//         };
//     }

//     if (format === 'shopify') {
//         const price = parseFloat(order.product.price?.replace(/[^0-9.]/g, '') || '0');
//         return {
//             order: {
//                 phone: order.customer.phone,
//                 financial_status: 'pending',
//                 note: `SoftBrainChat Order ID: ${order.orderId}`,
//                 note_attributes: [
//                     { name: 'source_platform', value: order.platform },
//                     { name: 'sc_order_id', value: order.orderId },
//                 ],
//                 billing_address: {
//                     name: order.customer.name,
//                     phone: order.customer.phone,
//                     address1: order.customer.address,
//                     country: 'Bangladesh',
//                 },
//                 shipping_address: {
//                     name: order.customer.name,
//                     phone: order.customer.phone,
//                     address1: order.customer.address,
//                     country: 'Bangladesh',
//                 },
//                 line_items: [{
//                     title: order.product.name,
//                     quantity: order.product.quantity || 1,
//                     price: price.toFixed(2),
//                 }],
//             },
//         };
//     }

//     // Custom format — fieldMapping দিয়ে map করো
//     if (format === 'custom') {
//         const base = buildPayload(order, 'softbrainchat');
//         const result = { ...base };

//         const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
//         const set = (obj, path, val) => {
//             const keys = path.split('.');
//             let cur = obj;
//             keys.slice(0, -1).forEach(k => { if (!cur[k]) cur[k] = {}; cur = cur[k]; });
//             cur[keys[keys.length - 1]] = val;
//         };

//         Object.entries(fieldMapping).forEach(([src, tgt]) => {
//             const val = get(base, src);
//             if (val !== undefined) set(result, tgt, val);
//         });

//         return result;
//     }

//     return buildPayload(order, 'softbrainchat');
// };

// // ── Auth headers তৈরি করো ────────────────────────────────────
// const buildHeaders = (config) => {
//     const headers = { 'Content-Type': 'application/json' };

//     if (config.authType === 'api_key_header' && config.apiKey) {
//         const h = config.apiKeyHeader || 'X-API-Key';
//         headers[h] = config.apiKey;
//     }

//     if (config.authType === 'bearer_token' && config.bearerToken) {
//         headers['Authorization'] = `Bearer ${config.bearerToken}`;
//     }

//     if (config.authType === 'basic_auth' && config.basicUsername) {
//         const cred = Buffer.from(`${config.basicUsername}:${config.basicPassword}`).toString('base64');
//         headers['Authorization'] = `Basic ${cred}`;
//     }

//     // WooCommerce: consumer_key:consumer_secret format
//     if (config.payloadFormat === 'woocommerce' && config.apiKey?.includes(':')) {
//         const cred = Buffer.from(config.apiKey).toString('base64');
//         headers['Authorization'] = `Basic ${cred}`;
//         delete headers['X-API-Key'];
//     }

//     return headers;
// };

// // ── OMS এ order submit করো ───────────────────────────────────
// const submitToOMS = async (order, userId) => {
//     try {
//         let config = null;

//         // User এর dashboard config খোঁজো
//         if (userId) {
//             config = await OmsConfig.findOne({ userId, enabled: true });
//         }

//         // Dashboard config না থাকলে .env fallback
//         if (!config) {
//             const envUrl = process.env.OMS_API_URL;
//             if (!envUrl) return { success: false, reason: 'OMS not configured' };

//             config = {
//                 apiUrl: envUrl,
//                 authType: 'api_key_header',
//                 apiKey: process.env.OMS_API_KEY || '',
//                 apiKeyHeader: 'X-API-Key',
//                 payloadFormat: 'softbrainchat',
//                 fieldMapping: {},
//             };
//         }

//         if (!config.apiUrl) return { success: false, reason: 'OMS API URL not set' };

//         const payload = buildPayload(order, config.payloadFormat, config.fieldMapping);
//         const headers = buildHeaders(config);

//         console.log(`📤 Submitting order ${order.orderId} → ${config.apiUrl}`);

//         const res = await axios.post(config.apiUrl, payload, { headers, timeout: 20000 });

//         // Success — last sync update করো
//         if (config._id) {
//             await OmsConfig.findByIdAndUpdate(config._id, {
//                 lastSyncAt: new Date(),
//                 lastSyncStatus: 'success',
//                 lastSyncError: '',
//             });
//         }

//         return { success: true, data: res.data };

//     } catch (err) {
//         const errorMsg = err.response?.data?.message || err.message;
//         console.error('OMS submit error:', errorMsg);

//         if (userId) {
//             await OmsConfig.findOneAndUpdate({ userId }, {
//                 lastSyncAt: new Date(),
//                 lastSyncStatus: 'failed',
//                 lastSyncError: errorMsg,
//             });
//         }

//         return { success: false, error: errorMsg };
//     }
// };

// // ── Connection test ───────────────────────────────────────────
// const testOmsConnection = async (config) => {
//     try {
//         const headers = buildHeaders(config);
//         const testUrl = config.apiUrl.replace(/\/orders\/?$/, '') + '/ping';
//         const res = await axios.get(testUrl, { headers, timeout: 10000 });
//         return { success: true, status: res.status };
//     } catch (err) {
//         // 404/405 — server reachable কিন্তু endpoint নেই, that's OK
//         if ([404, 405, 401, 403].includes(err.response?.status)) {
//             return { success: true, status: err.response.status, message: 'Server reachable' };
//         }
//         return { success: false, error: err.message };
//     }
// };

// module.exports = { submitToOMS, testOmsConnection, buildPayload };










const axios = require('axios');
const OmsConfig = require('../models/OmsConfig.model');

// ── Payload format অনুযায়ী data convert করো ─────────────────
const buildPayload = (order, format, fieldMapping = {}) => {

    if (format === 'softbrainchat' || !format) {
        return {
            order_id: order.orderId,
            source: `SoftBrainChat (${order.platform})`,
            status: 'pending',
            customer: {
                name: order.customer.name,
                phone: order.customer.phone,
                address: order.customer.address,
            },
            product: {
                name: order.product.name,
                code: order.product.code,
                price: order.product.price,
                size: order.product.size,
                quantity: order.product.quantity,
                image: order.product.image,
            },
            notes: order.notes || '',
            ordered_at: order.createdAt,
        };
    }

    if (format === 'woocommerce') {
        const price = parseFloat(order.product.price?.replace(/[^0-9.]/g, '') || '0');
        return {
            status: 'pending',
            meta_data: [
                { key: 'softbrainchat_order_id', value: order.orderId },
                { key: 'source_platform', value: order.platform },
            ],
            billing: {
                first_name: order.customer.name.split(' ')[0] || order.customer.name,
                last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
                phone: order.customer.phone,
                address_1: order.customer.address,
                country: 'BD',
            },
            shipping: {
                first_name: order.customer.name.split(' ')[0] || order.customer.name,
                last_name: order.customer.name.split(' ').slice(1).join(' ') || '',
                address_1: order.customer.address,
                country: 'BD',
            },
            line_items: [{
                name: order.product.name,
                quantity: order.product.quantity || 1,
                price: price.toString(),
                total: (price * (order.product.quantity || 1)).toString(),
            }],
            customer_note: order.notes || `Order via SoftBrainChat (${order.platform})`,
        };
    }

    if (format === 'shopify') {
        const price = parseFloat(order.product.price?.replace(/[^0-9.]/g, '') || '0');
        return {
            order: {
                phone: order.customer.phone,
                financial_status: 'pending',
                note: `SoftBrainChat Order ID: ${order.orderId}`,
                note_attributes: [
                    { name: 'source_platform', value: order.platform },
                    { name: 'sc_order_id', value: order.orderId },
                ],
                billing_address: {
                    name: order.customer.name,
                    phone: order.customer.phone,
                    address1: order.customer.address,
                    country: 'Bangladesh',
                },
                shipping_address: {
                    name: order.customer.name,
                    phone: order.customer.phone,
                    address1: order.customer.address,
                    country: 'Bangladesh',
                },
                line_items: [{
                    title: order.product.name,
                    quantity: order.product.quantity || 1,
                    price: price.toFixed(2),
                }],
            },
        };
    }

    // Custom format — fieldMapping দিয়ে map করো
    if (format === 'custom') {
        const base = buildPayload(order, 'softbrainchat');
        const result = { ...base };

        const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);
        const set = (obj, path, val) => {
            const keys = path.split('.');
            let cur = obj;
            keys.slice(0, -1).forEach(k => { if (!cur[k]) cur[k] = {}; cur = cur[k]; });
            cur[keys[keys.length - 1]] = val;
        };

        Object.entries(fieldMapping).forEach(([src, tgt]) => {
            const val = get(base, src);
            if (val !== undefined) set(result, tgt, val);
        });

        return result;
    }

    return buildPayload(order, 'softbrainchat');
};

// ── Auth headers তৈরি করো ────────────────────────────────────
const buildHeaders = (config) => {
    const headers = { 'Content-Type': 'application/json' };

    if (config.authType === 'api_key_header' && config.apiKey) {
        const h = config.apiKeyHeader || 'X-API-Key';
        headers[h] = config.apiKey;
    }

    if (config.authType === 'bearer_token' && config.bearerToken) {
        headers['Authorization'] = `Bearer ${config.bearerToken}`;
    }

    if (config.authType === 'basic_auth' && config.basicUsername) {
        const cred = Buffer.from(`${config.basicUsername}:${config.basicPassword}`).toString('base64');
        headers['Authorization'] = `Basic ${cred}`;
    }

    // WooCommerce: consumer_key:consumer_secret format
    if (config.payloadFormat === 'woocommerce' && config.apiKey?.includes(':')) {
        const cred = Buffer.from(config.apiKey).toString('base64');
        headers['Authorization'] = `Basic ${cred}`;
        delete headers['X-API-Key'];
    }

    return headers;
};

// ── OMS এ order submit করো ───────────────────────────────────
const submitToOMS = async (order, userId) => {
    try {
        let config = null;

        // User এর dashboard config খোঁজো
        if (userId) {
            config = await OmsConfig.findOne({ userId, enabled: true });
        }

        // Dashboard config না থাকলে .env fallback
        if (!config) {
            const envUrl = process.env.OMS_API_URL;
            if (!envUrl) return { success: false, reason: 'OMS not configured' };

            config = {
                apiUrl: envUrl,
                authType: 'api_key_header',
                apiKey: process.env.OMS_API_KEY || '',
                apiKeyHeader: 'X-API-Key',
                payloadFormat: 'softbrainchat',
                fieldMapping: {},
            };
        }

        if (!config.apiUrl) return { success: false, reason: 'OMS API URL not set' };

        const payload = buildPayload(order, config.payloadFormat, config.fieldMapping);
        const headers = buildHeaders(config);

        console.log(`📤 Submitting order ${order.orderId} → ${config.apiUrl}`);

        const res = await axios.post(config.apiUrl, payload, { headers, timeout: 20000 });

        // Success — last sync update করো
        if (config._id) {
            await OmsConfig.findByIdAndUpdate(config._id, {
                lastSyncAt: new Date(),
                lastSyncStatus: 'success',
                lastSyncError: '',
            });
        }

        return { success: true, data: res.data };

    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        console.error('OMS submit error:', errorMsg);

        if (userId) {
            await OmsConfig.findOneAndUpdate({ userId }, {
                lastSyncAt: new Date(),
                lastSyncStatus: 'failed',
                lastSyncError: errorMsg,
            });
        }

        return { success: false, error: errorMsg };
    }
};

// ── Connection test ───────────────────────────────────────────
const testOmsConnection = async (config) => {
    try {
        const headers = buildHeaders(config);
        const testUrl = config.apiUrl.replace(/\/orders\/?$/, '') + '/ping';
        const res = await axios.get(testUrl, { headers, timeout: 10000 });
        return { success: true, status: res.status };
    } catch (err) {
        // 404/405 — server reachable কিন্তু endpoint নেই, that's OK
        if ([404, 405, 401, 403].includes(err.response?.status)) {
            return { success: true, status: err.response.status, message: 'Server reachable' };
        }
        return { success: false, error: err.message };
    }
};

module.exports = { submitToOMS, testOmsConnection, buildPayload };