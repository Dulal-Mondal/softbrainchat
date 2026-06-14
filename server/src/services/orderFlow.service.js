const OrderSession = require('../models/OrderSession.model');
const Order = require('../models/Order.model');
const { submitToOMS } = require('./oms.service');

// Customer এর message দেখে order confirm করতে চাচ্ছে কিনা check করো
const isOrderConfirmation = (text) => {
    if (!text) return false;
    const t = text.toLowerCase().trim();
    const confirmWords = [
        'হ্যাঁ', 'হ্যা', 'হা', 'yes', 'yeah', 'yep', 'ok', 'okay',
        'order', 'অর্ডার', 'confirm', 'কনফার্ম', 'দিন', 'চাই', 'নিব',
        '1', 'one', 'sure', 'অবশ্যই',
    ];
    return confirmWords.some(w => t.includes(w));
};

// Customer cancel করছে কিনা check করো
const isCancellation = (text) => {
    if (!text) return false;
    const t = text.toLowerCase().trim();
    const cancelWords = ['না', 'no', 'cancel', 'বাদ', 'থাক', 'নাহ', 'not'];
    return cancelWords.some(w => t.includes(w));
};

// Phone number valid কিনা check করো
const isValidPhone = (text) => {
    const digits = text.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
};

// ── Main handler — প্রতিটি message এখান দিয়ে যাবে ──────────
const handleOrderFlow = async ({
    senderId,
    channelId,
    userId,
    platform,
    text,
    senderName,
    senderProfilePic,
    // Product info — image থেকে AI identify করলে pass হবে
    productInfo = null,
}) => {

    // Current session খোঁজো বা নতুন তৈরি করো
    let session = await OrderSession.findOne({ senderId, channelId });

    // ── CASE 1: Product image recognize হয়েছে — confirm চাও ──
    if (productInfo) {
        // Upsert session
        session = await OrderSession.findOneAndUpdate(
            { senderId, channelId },
            {
                userId,
                platform,
                step: 'confirm_pending',
                orderData: {
                    productName: productInfo.name || '',
                    productPrice: productInfo.price || '',
                    productDesc: productInfo.desc || '',
                    quantity: 1,
                    customerName: '',
                    address: '',
                    phone: '',
                },
                lastActivityAt: new Date(),
            },
            { upsert: true, new: true }
        );

        const price = productInfo.price ? `\n💰 মূল্য: ${productInfo.price}` : '';
        return `✅ আমি এই product টি চিনতে পেরেছি:\n📦 *${productInfo.name}*${price}\n\nআপনি কি এটি order করতে চান?\n👉 Order করতে *হ্যাঁ* লিখুন\n👉 বাদ দিতে *না* লিখুন`;
    }

    // Session নেই বা idle — normal AI flow এ যাও
    if (!session || session.step === 'idle' || session.step === 'completed' || session.step === 'cancelled') {
        return null; // normal RAG flow
    }

    // Last activity update করো
    session.lastActivityAt = new Date();

    // ── CASE 2: Confirm pending — customer yes/no দেবে ─────────
    if (session.step === 'confirm_pending') {
        if (isCancellation(text)) {
            session.step = 'cancelled';
            await session.save();
            return '❌ Order বাদ দেওয়া হয়েছে। আর কোনো সাহায্য লাগলে জানান।';
        }

        if (isOrderConfirmation(text)) {
            session.step = 'collecting_name';
            await session.save();
            return '👤 আপনার *পুরো নাম* লিখুন:';
        }

        // না হ্যাঁ না না — আবার জিজ্ঞেস করো
        return `আপনি কি *${session.orderData.productName}* order করতে চান?\n👉 *হ্যাঁ* অথবা *না* লিখুন`;
    }

    // ── CASE 3: Name collecting ────────────────────────────────
    if (session.step === 'collecting_name') {
        if (!text || text.trim().length < 2) {
            return '⚠️ সঠিক নাম লিখুন:';
        }
        session.orderData.customerName = text.trim();
        session.step = 'collecting_address';
        await session.save();
        return '🏠 আপনার *ডেলিভারি ঠিকানা* লিখুন:\n(বাড়ি নম্বর, রোড, এলাকা, জেলা)';
    }

    // ── CASE 4: Address collecting ─────────────────────────────
    if (session.step === 'collecting_address') {
        if (!text || text.trim().length < 5) {
            return '⚠️ সম্পূর্ণ ঠিকানা লিখুন:';
        }
        session.orderData.address = text.trim();
        session.step = 'collecting_phone';
        await session.save();
        return '📞 আপনার *মোবাইল নম্বর* লিখুন:';
    }

    // ── CASE 5: Phone collecting → Order confirm ───────────────
    if (session.step === 'collecting_phone') {
        if (!isValidPhone(text)) {
            return '⚠️ সঠিক মোবাইল নম্বর লিখুন (১০-১৫ সংখ্যা):';
        }

        session.orderData.phone = text.trim().replace(/\D/g, '');
        session.step = 'completed';
        await session.save();

        // ── Order DB তে save করো ──────────────────────────────
        const order = await Order.create({
            userId,
            channelId,
            platform,
            customer: {
                senderId,
                name: session.orderData.customerName,
                phone: session.orderData.phone,
                address: session.orderData.address,
                profilePic: senderProfilePic || '',
            },
            product: {
                name: session.orderData.productName,
                price: session.orderData.productPrice,
                quantity: session.orderData.quantity || 1,
                desc: session.orderData.productDesc,
            },
            status: 'pending',
        });

        // ── OMS এ submit করো (background) ─────────────────────
        submitToOMS(order)
            .then(async (result) => {
                if (result.success) {
                    order.omsSynced = true;
                    order.omsOrderId = result.data?.id || result.data?.order_id || '';
                    order.omsSyncedAt = new Date();
                } else {
                    order.omsError = result.reason || 'OMS sync failed';
                }
                await order.save();
            })
            .catch(async (err) => {
                order.omsError = err.message;
                await order.save();
                console.error('OMS sync error:', err.message);
            });

        // Customer কে confirmation message পাঠাও
        return `✅ *Order Confirmed!*

📋 *Order ID:* ${order.orderId}
👤 *নাম:* ${order.customer.name}
📞 *মোবাইল:* ${order.customer.phone}
🏠 *ঠিকানা:* ${order.customer.address}
📦 *Product:* ${order.product.name}${order.product.price ? `\n💰 *মূল্য:* ${order.product.price}` : ''}

আপনার order টি আমরা পেয়েছি। শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে। 🎉

ধন্যবাদ আপনার order এর জন্য! 🙏`;
    }

    return null;
};

module.exports = { handleOrderFlow, isOrderConfirmation };