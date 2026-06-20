// const OrderSession = require('../models/OrderSession.model');
// const Order = require('../models/Order.model');
// const { submitToOMS } = require('./oms.service');

// // Customer এর message দেখে order confirm করতে চাচ্ছে কিনা check করো
// const isOrderConfirmation = (text) => {
//     if (!text) return false;
//     const t = text.toLowerCase().trim();
//     const confirmWords = [
//         'হ্যাঁ', 'হ্যা', 'হা', 'yes', 'yeah', 'yep', 'ok', 'okay',
//         'order', 'অর্ডার', 'confirm', 'কনফার্ম', 'দিন', 'চাই', 'নিব',
//         '1', 'one', 'sure', 'অবশ্যই',
//     ];
//     return confirmWords.some(w => t.includes(w));
// };

// // Customer cancel করছে কিনা check করো
// const isCancellation = (text) => {
//     if (!text) return false;
//     const t = text.toLowerCase().trim();
//     const cancelWords = ['না', 'no', 'cancel', 'বাদ', 'থাক', 'নাহ', 'not'];
//     return cancelWords.some(w => t.includes(w));
// };

// // Phone number valid কিনা check করো
// const isValidPhone = (text) => {
//     const digits = text.replace(/\D/g, '');
//     return digits.length >= 10 && digits.length <= 15;
// };

// // ── Main handler — প্রতিটি message এখান দিয়ে যাবে ──────────
// const handleOrderFlow = async ({
//     senderId,
//     channelId,
//     userId,
//     platform,
//     text,
//     senderName,
//     senderProfilePic,
//     // Product info — image থেকে AI identify করলে pass হবে
//     productInfo = null,
// }) => {

//     // Current session খোঁজো বা নতুন তৈরি করো
//     let session = await OrderSession.findOne({ senderId, channelId });

//     // ── CASE 1: Product image recognize হয়েছে — confirm চাও ──
//     if (productInfo) {
//         // Upsert session
//         session = await OrderSession.findOneAndUpdate(
//             { senderId, channelId },
//             {
//                 userId,
//                 platform,
//                 step: 'confirm_pending',
//                 orderData: {
//                     productName: productInfo.name || '',
//                     productPrice: productInfo.price || '',
//                     productDesc: productInfo.desc || '',
//                     quantity: 1,
//                     customerName: '',
//                     address: '',
//                     phone: '',
//                 },
//                 lastActivityAt: new Date(),
//             },
//             { upsert: true, new: true }
//         );

//         const price = productInfo.price ? `\n💰 মূল্য: ${productInfo.price}` : '';
//         return `✅ আমি এই product টি চিনতে পেরেছি:\n📦 *${productInfo.name}*${price}\n\nআপনি কি এটি order করতে চান?\n👉 Order করতে *হ্যাঁ* লিখুন\n👉 বাদ দিতে *না* লিখুন`;
//     }

//     // Session নেই বা idle — normal AI flow এ যাও
//     if (!session || session.step === 'idle' || session.step === 'completed' || session.step === 'cancelled') {
//         return null; // normal RAG flow
//     }

//     // Last activity update করো
//     session.lastActivityAt = new Date();

//     // ── CASE 2: Confirm pending — customer yes/no দেবে ─────────
//     if (session.step === 'confirm_pending') {
//         if (isCancellation(text)) {
//             session.step = 'cancelled';
//             await session.save();
//             return '❌ Order বাদ দেওয়া হয়েছে। আর কোনো সাহায্য লাগলে জানান।';
//         }

//         if (isOrderConfirmation(text)) {
//             session.step = 'collecting_name';
//             await session.save();
//             return '👤 আপনার *পুরো নাম* লিখুন:';
//         }

//         // না হ্যাঁ না না — আবার জিজ্ঞেস করো
//         return `আপনি কি *${session.orderData.productName}* order করতে চান?\n👉 *হ্যাঁ* অথবা *না* লিখুন`;
//     }

//     // ── CASE 3: Name collecting ────────────────────────────────
//     if (session.step === 'collecting_name') {
//         if (!text || text.trim().length < 2) {
//             return '⚠️ সঠিক নাম লিখুন:';
//         }
//         session.orderData.customerName = text.trim();
//         session.step = 'collecting_address';
//         await session.save();
//         return '🏠 আপনার *ডেলিভারি ঠিকানা* লিখুন:\n(বাড়ি নম্বর, রোড, এলাকা, জেলা)';
//     }

//     // ── CASE 4: Address collecting ─────────────────────────────
//     if (session.step === 'collecting_address') {
//         if (!text || text.trim().length < 5) {
//             return '⚠️ সম্পূর্ণ ঠিকানা লিখুন:';
//         }
//         session.orderData.address = text.trim();
//         session.step = 'collecting_phone';
//         await session.save();
//         return '📞 আপনার *মোবাইল নম্বর* লিখুন:';
//     }

//     // ── CASE 5: Phone collecting → Order confirm ───────────────
//     if (session.step === 'collecting_phone') {
//         if (!isValidPhone(text)) {
//             return '⚠️ সঠিক মোবাইল নম্বর লিখুন (১০-১৫ সংখ্যা):';
//         }

//         session.orderData.phone = text.trim().replace(/\D/g, '');
//         session.step = 'completed';
//         await session.save();

//         // ── Order DB তে save করো ──────────────────────────────
//         const order = await Order.create({
//             userId,
//             channelId,
//             platform,
//             customer: {
//                 senderId,
//                 name: session.orderData.customerName,
//                 phone: session.orderData.phone,
//                 address: session.orderData.address,
//                 profilePic: senderProfilePic || '',
//             },
//             product: {
//                 name: session.orderData.productName,
//                 price: session.orderData.productPrice,
//                 quantity: session.orderData.quantity || 1,
//                 desc: session.orderData.productDesc,
//             },
//             status: 'pending',
//         });

//         // ── OMS এ submit করো (background) ─────────────────────
//         submitToOMS(order)
//             .then(async (result) => {
//                 if (result.success) {
//                     order.omsSynced = true;
//                     order.omsOrderId = result.data?.id || result.data?.order_id || '';
//                     order.omsSyncedAt = new Date();
//                 } else {
//                     order.omsError = result.reason || 'OMS sync failed';
//                 }
//                 await order.save();
//             })
//             .catch(async (err) => {
//                 order.omsError = err.message;
//                 await order.save();
//                 console.error('OMS sync error:', err.message);
//             });

//         // Customer কে confirmation message পাঠাও
//         return `✅ *Order Confirmed!*

// 📋 *Order ID:* ${order.orderId}
// 👤 *নাম:* ${order.customer.name}
// 📞 *মোবাইল:* ${order.customer.phone}
// 🏠 *ঠিকানা:* ${order.customer.address}
// 📦 *Product:* ${order.product.name}${order.product.price ? `\n💰 *মূল্য:* ${order.product.price}` : ''}

// আপনার order টি আমরা পেয়েছি। শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে। 🎉

// ধন্যবাদ আপনার order এর জন্য! 🙏`;
//     }

//     return null;
// };

// module.exports = { handleOrderFlow, isOrderConfirmation };












// const OrderSession = require('../models/OrderSession.model');
// const Order = require('../models/Order.model');
// const { submitToOMS } = require('./oms.service');

// // Order intent detect করো (text)
// const isOrderIntent = (text) => {
//     if (!text) return false;
//     const t = text.toLowerCase().trim();
//     const words = [
//         'order confirm', 'confirm koren', 'confirm korun', 'order korbo', 'order korte chai',
//         'order korben', 'অর্ডার কনফার্ম', 'অর্ডার করব', 'অর্ডার করতে চাই', 'কনফার্ম করেন',
//         'কনফার্ম করুন', 'order dite chai', 'order nibo', 'kinbo', 'কিনবো', 'নিতে চাই',
//         'order place', 'place order', 'অর্ডার দিন', 'order din', 'nibo', 'নিব',
//     ];
//     return words.some(w => t.includes(w));
// };

// const isOrderConfirmation = (text) => {
//     if (!text) return false;
//     const t = text.toLowerCase().trim();
//     const words = [
//         'হ্যাঁ', 'হ্যা', 'হা', 'yes', 'yeah', 'yep', 'ok', 'okay',
//         'confirm', 'কনফার্ম', 'দিন', 'চাই', 'নিব', 'নিবো',
//         '1', 'one', 'sure', 'অবশ্যই', 'ji', 'জি', 'hmm', 'হুম', 'koren', 'korun',
//     ];
//     return words.some(w => t.includes(w));
// };

// const isCancellation = (text) => {
//     if (!text) return false;
//     const t = text.toLowerCase().trim();
//     const words = ['না', 'no', 'cancel', 'বাদ', 'থাক', 'নাহ', 'not', 'lagbe na', 'লাগবে না'];
//     return words.some(w => t.includes(w));
// };

// const isValidPhone = (text) => {
//     const digits = text.replace(/\D/g, '');
//     return digits.length >= 10 && digits.length <= 15;
// };

// // AI message থেকে product নাম ও দাম extract করো
// function extractProductFromText(text) {
//     if (!text) return null;
//     const priceMatch = text.match(/(\d[\d,]{2,})\s*(টাকা|taka|tk|৳|bdt)/i)
//         || text.match(/[৳]\s*(\d[\d,]+)/);
//     const nameMatch = text.match(/"([^"]+)"/)
//         || text.match(/\*([^*]+)\*/)
//         || text.match(/([A-Z][a-zA-Z]+\s+\d+\s*piece)/i);
//     if (!nameMatch && !priceMatch) return null;
//     return {
//         name: nameMatch ? nameMatch[1].trim() : 'Product',
//         price: priceMatch ? priceMatch[0].trim() : '',
//     };
// }

// // ── Main handler ─────────────────────────────────────────────
// const handleOrderFlow = async ({
//     senderId, channelId, userId, platform, text,
//     senderName, senderProfilePic,
//     productInfo = null,
//     lastAiMessage = '',
// }) => {

//     let session = await OrderSession.findOne({ senderId, channelId });

//     // ── CASE 1: Image থেকে product recognize ────────────────
//     if (productInfo) {
//         session = await OrderSession.findOneAndUpdate(
//             { senderId, channelId },
//             {
//                 userId, platform, step: 'confirm_pending',
//                 orderData: {
//                     productName: productInfo.name || '',
//                     productPrice: productInfo.price || '',
//                     productDesc: productInfo.desc || '',
//                     size: '', quantity: 1, customerName: '', address: '', phone: '',
//                 },
//                 lastActivityAt: new Date(),
//             },
//             { upsert: true, new: true }
//         );

//         const price = productInfo.price ? `\n💰 মূল্য: ${productInfo.price}` : '';
//         return `✅ আমি এই product টি চিনতে পেরেছি:\n📦 *${productInfo.name}*${price}\n\nআপনি কি এটি order করতে চান?\n👉 Order করতে *হ্যাঁ* লিখুন\n👉 বাদ দিতে *না* লিখুন`;
//     }

//     // ── CASE 2: Text এ order intent ─────────────────────────
//     if ((!session || ['idle', 'completed', 'cancelled'].includes(session.step)) && isOrderIntent(text)) {
//         const product = extractProductFromText(lastAiMessage);

//         session = await OrderSession.findOneAndUpdate(
//             { senderId, channelId },
//             {
//                 userId, platform, step: 'collecting_size',   // ← size আগে জিজ্ঞেস করো
//                 orderData: {
//                     productName: product?.name || 'Product',
//                     productPrice: product?.price || '',
//                     productDesc: '',
//                     size: '', quantity: 1, customerName: '', address: '', phone: '',
//                 },
//                 lastActivityAt: new Date(),
//             },
//             { upsert: true, new: true }
//         );

//         const productLine = product?.name
//             ? `\n📦 Product: *${product.name}*${product.price ? ` (${product.price})` : ''}\n`
//             : '';
//         return `✅ আপনার order নিচ্ছি!${productLine}\n📏 আপনার পছন্দের *size* লিখুন:\n(যেমন: S / M / L / XL / XXL / Free Size)`;
//     }

//     if (!session || ['idle', 'completed', 'cancelled'].includes(session.step)) {
//         return null;
//     }

//     session.lastActivityAt = new Date();

//     // ── CASE 3: Confirm pending (image থেকে এসেছে) ──────────
//     if (session.step === 'confirm_pending') {
//         if (isCancellation(text)) {
//             session.step = 'cancelled';
//             await session.save();
//             return '❌ Order বাদ দেওয়া হয়েছে। আর কিছু লাগলে জানান।';
//         }
//         if (isOrderConfirmation(text)) {
//             session.step = 'collecting_size';   // ← size জিজ্ঞেস করো
//             await session.save();
//             return '📏 আপনার পছন্দের *size* লিখুন:\n(যেমন: S / M / L / XL / XXL / Free Size)';
//         }
//         return `আপনি কি *${session.orderData.productName}* order করতে চান?\n👉 *হ্যাঁ* অথবা *না* লিখুন`;
//     }

//     // ── CASE 4: Size ────────────────────────────────────────
//     if (session.step === 'collecting_size') {
//         if (!text || text.trim().length < 1) {
//             return '⚠️ আপনার size লিখুন (S / M / L / XL / XXL / Free Size):';
//         }
//         session.orderData.size = text.trim();
//         session.step = 'collecting_name';
//         await session.save();
//         return '👤 আপনার *পুরো নাম* লিখুন:';
//     }

//     // ── CASE 5: Name ────────────────────────────────────────
//     if (session.step === 'collecting_name') {
//         if (!text || text.trim().length < 2) return '⚠️ সঠিক নাম লিখুন:';
//         session.orderData.customerName = text.trim();
//         session.step = 'collecting_address';
//         await session.save();
//         return '🏠 আপনার *ডেলিভারি ঠিকানা* লিখুন:\n(বাড়ি নম্বর, রোড, এলাকা, জেলা)';
//     }

//     // ── CASE 6: Address ─────────────────────────────────────
//     if (session.step === 'collecting_address') {
//         if (!text || text.trim().length < 5) return '⚠️ সম্পূর্ণ ঠিকানা লিখুন:';
//         session.orderData.address = text.trim();
//         session.step = 'collecting_phone';
//         await session.save();
//         return '📞 আপনার *মোবাইল নম্বর* লিখুন:';
//     }

//     // ── CASE 7: Phone → Order create ────────────────────────
//     if (session.step === 'collecting_phone') {
//         if (!isValidPhone(text)) return '⚠️ সঠিক মোবাইল নম্বর লিখুন (১১ সংখ্যা):';

//         session.orderData.phone = text.trim().replace(/\D/g, '');
//         session.step = 'completed';
//         await session.save();

//         const order = await Order.create({
//             userId, channelId, platform,
//             customer: {
//                 senderId,
//                 name: session.orderData.customerName,
//                 phone: session.orderData.phone,
//                 address: session.orderData.address,
//                 profilePic: senderProfilePic || '',
//             },
//             product: {
//                 name: session.orderData.productName,
//                 price: session.orderData.productPrice,
//                 size: session.orderData.size,
//                 quantity: session.orderData.quantity || 1,
//                 desc: session.orderData.productDesc,
//             },
//             status: 'pending',
//             lastNotifiedStatus: 'pending',
//         });

//         submitToOMS(order, userId)
//             .then(async (result) => {
//                 if (result.success) {
//                     order.omsSynced = true;
//                     order.omsOrderId = result.data?.id || result.data?.order_id || '';
//                     order.omsSyncedAt = new Date();
//                 } else {
//                     order.omsError = result.error || result.reason || 'OMS sync failed';
//                 }
//                 await order.save();
//             })
//             .catch(async (err) => {
//                 order.omsError = err.message;
//                 await order.save();
//             });

//         const sizeLine = order.product.size ? `\n📏 *Size:* ${order.product.size}` : '';
//         return `✅ *Order Confirmed!*

// 📋 *Order ID:* ${order.orderId}
// 👤 *নাম:* ${order.customer.name}
// 📞 *মোবাইল:* ${order.customer.phone}
// 🏠 *ঠিকানা:* ${order.customer.address}
// 📦 *Product:* ${order.product.name}${sizeLine}${order.product.price ? `\n💰 *মূল্য:* ${order.product.price}` : ''}

// আপনার order টি পেয়েছি! শীঘ্রই আমাদের টিম যোগাযোগ করবে। 🎉
// ধন্যবাদ! 🙏`;
//     }

//     return null;
// };

// module.exports = { handleOrderFlow, isOrderIntent, isOrderConfirmation };




const OrderSession = require('../models/OrderSession.model');
const Order = require('../models/Order.model');
const { submitToOMS } = require('./oms.service');

const isOrderIntent = (text) => {
    if (!text) return false;
    const t = text.toLowerCase().trim();
    const words = [
        'order confirm', 'confirm koren', 'confirm korun', 'order korbo', 'order korte chai',
        'order korben', 'অর্ডার কনফার্ম', 'অর্ডার করব', 'অর্ডার করতে চাই', 'কনফার্ম করেন',
        'কনফার্ম করুন', 'order dite chai', 'order nibo', 'kinbo', 'কিনবো', 'নিতে চাই',
        'order place', 'place order', 'অর্ডার দিন', 'order din', 'nibo', 'নিব',
    ];
    return words.some(w => t.includes(w));
};

const isOrderConfirmation = (text) => {
    if (!text) return false;
    const t = text.toLowerCase().trim();
    const words = [
        'হ্যাঁ', 'হ্যা', 'হা', 'yes', 'yeah', 'yep', 'ok', 'okay',
        'confirm', 'কনফার্ম', 'দিন', 'চাই', 'নিব', 'নিবো',
        '1', 'one', 'sure', 'অবশ্যই', 'ji', 'জি', 'hmm', 'হুম', 'koren', 'korun',
    ];
    return words.some(w => t.includes(w));
};

const isCancellation = (text) => {
    if (!text) return false;
    const t = text.toLowerCase().trim();
    const words = ['না', 'no', 'cancel', 'বাদ', 'থাক', 'নাহ', 'not', 'lagbe na', 'লাগবে না'];
    return words.some(w => t.includes(w));
};

const isValidPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
};

// AI message থেকে product নাম, code ও দাম extract করো
function extractProductFromText(text) {
    if (!text) return null;

    const priceMatch = text.match(/(\d[\d,]{2,})\s*(টাকা|taka|tk|৳|bdt)/i)
        || text.match(/[৳]\s*(\d[\d,]+)/);

    // Product code — "1996", "Code: ABC123", "#1996"
    const codeMatch = text.match(/(?:code|কোড|#)[:\s]*([A-Za-z0-9-]+)/i)
        || text.match(/-\s*(\d{3,})/);   // "Kamiz 3 piece - 1996"

    const nameMatch = text.match(/"([^"]+)"/)
        || text.match(/\*([^*]+)\*/)
        || text.match(/([A-Z][a-zA-Z]+\s+\d+\s*piece)/i);

    if (!nameMatch && !priceMatch && !codeMatch) return null;

    return {
        name: nameMatch ? nameMatch[1].trim() : 'Product',
        code: codeMatch ? codeMatch[1].trim() : '',
        price: priceMatch ? priceMatch[0].trim() : '',
    };
}

// ── Main handler ─────────────────────────────────────────────
const handleOrderFlow = async ({
    senderId, channelId, userId, platform, text,
    senderName, senderProfilePic,
    productInfo = null,
    productImage = '',       // ← নতুন: customer এর পাঠানো image URL
    lastAiMessage = '',
}) => {

    let session = await OrderSession.findOne({ senderId, channelId });

    // ── CASE 1: Image থেকে product recognize ────────────────
    if (productInfo) {
        session = await OrderSession.findOneAndUpdate(
            { senderId, channelId },
            {
                userId, platform, step: 'confirm_pending',
                orderData: {
                    productName: productInfo.name || '',
                    productCode: productInfo.code || '',
                    productPrice: productInfo.price || '',
                    productDesc: productInfo.desc || '',
                    productImage: productImage || '',     // ← image save করো
                    size: '', quantity: 1, customerName: '', address: '', phone: '',
                },
                lastActivityAt: new Date(),
            },
            { upsert: true, new: true }
        );

        const price = productInfo.price ? `\n💰 মূল্য: ${productInfo.price}` : '';
        const code = productInfo.code ? `\n🔖 Code: ${productInfo.code}` : '';
        return `✅ আমি এই product টি চিনতে পেরেছি:\n📦 *${productInfo.name}*${code}${price}\n\nআপনি কি এটি order করতে চান?\n👉 Order করতে *হ্যাঁ* লিখুন\n👉 বাদ দিতে *না* লিখুন`;
    }

    // ── CASE 2: Text এ order intent ─────────────────────────
    if ((!session || ['idle', 'completed', 'cancelled'].includes(session.step)) && isOrderIntent(text)) {
        const product = extractProductFromText(lastAiMessage);

        session = await OrderSession.findOneAndUpdate(
            { senderId, channelId },
            {
                userId, platform, step: 'collecting_size',
                orderData: {
                    productName: product?.name || 'Product',
                    productCode: product?.code || '',
                    productPrice: product?.price || '',
                    productDesc: '',
                    productImage: '',
                    size: '', quantity: 1, customerName: '', address: '', phone: '',
                },
                lastActivityAt: new Date(),
            },
            { upsert: true, new: true }
        );

        const productLine = product?.name
            ? `\n📦 Product: *${product.name}*${product.code ? ` (Code: ${product.code})` : ''}${product.price ? ` — ${product.price}` : ''}\n`
            : '';
        return `✅ আপনার order নিচ্ছি!${productLine}\n📏 আপনার পছন্দের *size* লিখুন:\n(যেমন: S / M / L / XL / XXL / Free Size)`;
    }

    if (!session || ['idle', 'completed', 'cancelled'].includes(session.step)) {
        return null;
    }

    session.lastActivityAt = new Date();

    // ── CASE 3: Confirm pending ─────────────────────────────
    if (session.step === 'confirm_pending') {
        if (isCancellation(text)) {
            await OrderSession.deleteOne({ senderId, channelId });
            return '❌ Order বাদ দেওয়া হয়েছে। আর কিছু লাগলে জানান।';
        }
        if (isOrderConfirmation(text)) {
            session.step = 'collecting_size';
            await session.save();
            return '📏 আপনার পছন্দের *size* লিখুন:\n(যেমন: S / M / L / XL / XXL / Free Size)';
        }
        return `আপনি কি *${session.orderData.productName}* order করতে চান?\n👉 *হ্যাঁ* অথবা *না* লিখুন`;
    }

    // ── CASE 4: Size ────────────────────────────────────────
    if (session.step === 'collecting_size') {
        if (!text || text.trim().length < 1) {
            return '⚠️ আপনার size লিখুন (S / M / L / XL / XXL / Free Size):';
        }
        session.orderData.size = text.trim();
        session.step = 'collecting_name';
        await session.save();
        return '👤 আপনার *পুরো নাম* লিখুন:';
    }

    // ── CASE 5: Name ────────────────────────────────────────
    if (session.step === 'collecting_name') {
        if (!text || text.trim().length < 2) return '⚠️ সঠিক নাম লিখুন:';
        session.orderData.customerName = text.trim();
        session.step = 'collecting_address';
        await session.save();
        return '🏠 আপনার *ডেলিভারি ঠিকানা* লিখুন:\n(বাড়ি নম্বর, রোড, এলাকা, জেলা)';
    }

    // ── CASE 6: Address ─────────────────────────────────────
    if (session.step === 'collecting_address') {
        if (!text || text.trim().length < 5) return '⚠️ সম্পূর্ণ ঠিকানা লিখুন:';
        session.orderData.address = text.trim();
        session.step = 'collecting_phone';
        await session.save();
        return '📞 আপনার *মোবাইল নম্বর* লিখুন:';
    }

    // ── CASE 7: Phone → Order create ────────────────────────
    if (session.step === 'collecting_phone') {
        if (!isValidPhone(text)) return '⚠️ সঠিক মোবাইল নম্বর লিখুন (১১ সংখ্যা):';

        session.orderData.phone = text.trim().replace(/\D/g, '');
        session.step = 'completed';
        await session.save();

        const order = await Order.create({
            userId, channelId, platform,
            customer: {
                senderId,
                name: session.orderData.customerName,
                phone: session.orderData.phone,
                address: session.orderData.address,
                profilePic: senderProfilePic || '',
            },
            product: {
                name: session.orderData.productName,
                code: session.orderData.productCode,
                price: session.orderData.productPrice,
                size: session.orderData.size,
                quantity: session.orderData.quantity || 1,
                desc: session.orderData.productDesc,
                image: session.orderData.productImage,
            },
            status: 'pending',
            lastNotifiedStatus: 'pending',
        });

        submitToOMS(order, userId)
            .then(async (result) => {
                if (result.success) {
                    order.omsSynced = true;
                    order.omsOrderId = result.data?.id || result.data?.order_id || '';
                    order.omsSyncedAt = new Date();
                } else {
                    order.omsError = result.error || result.reason || 'OMS sync failed';
                }
                await order.save();
            })
            .catch(async (err) => {
                order.omsError = err.message;
                await order.save();
            });

        const sizeLine = order.product.size ? `\n📏 *Size:* ${order.product.size}` : '';
        const codeLine = order.product.code ? `\n🔖 *Code:* ${order.product.code}` : '';

        await OrderSession.deleteOne({ senderId, channelId });

        return `✅ *Order Confirmed!*

📋 *Order ID:* ${order.orderId}
👤 *নাম:* ${order.customer.name}
📞 *মোবাইল:* ${order.customer.phone}
🏠 *ঠিকানা:* ${order.customer.address}
📦 *Product:* ${order.product.name}${codeLine}${sizeLine}${order.product.price ? `\n💰 *মূল্য:* ${order.product.price}` : ''}

আপনার order টি পেয়েছি! শীঘ্রই আমাদের টিম যোগাযোগ করবে। 🎉
ধন্যবাদ! 🙏`;
    }

    return null;
};

module.exports = { handleOrderFlow, isOrderIntent, isOrderConfirmation };