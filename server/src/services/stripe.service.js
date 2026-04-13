const stripe = require('../config/stripe');

const PLAN_PRICE = {
    'pro': process.env.STRIPE_PRO_PRICE_ID,
    'pro-max': process.env.STRIPE_PROMAX_PRICE_ID,
};

const PRICE_PLAN = {};
// runtime এ reverse map তৈরি হবে
const getPricePlanMap = () => {
    const map = {};
    map[process.env.STRIPE_PRO_PRICE_ID] = 'pro';
    map[process.env.STRIPE_PROMAX_PRICE_ID] = 'pro-max';
    return map;
};

// ── Customer তৈরি বা খোঁজো ───────────────────────────────────
const getOrCreateCustomer = async ({ email, name, userId, existingCustomerId }) => {
    if (existingCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(existingCustomerId);
            if (!customer.deleted) return customer;
        } catch { }
    }

    const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId: userId.toString() },
    });

    return customer;
};

// ── Checkout session তৈরি করো ────────────────────────────────
const createCheckoutSession = async ({
    customerId,
    plan,
    userId,
    successUrl,
    cancelUrl,
}) => {
    const priceId = PLAN_PRICE[plan];
    if (!priceId) throw new Error(`Invalid plan: ${plan}`);

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId: userId.toString(), plan },
        allow_promotion_codes: true,
        subscription_data: {
            metadata: { userId: userId.toString(), plan },
        },
    });

    return session;
};

// ── Customer Portal session তৈরি করো ─────────────────────────
const createPortalSession = async ({ customerId, returnUrl }) => {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
    return session;
};

// ── Subscription details নিয়ে আসো ────────────────────────────
const getSubscription = async (subscriptionId) => {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return sub;
};

// ── Subscription cancel করো ──────────────────────────────────
const cancelSubscription = async (subscriptionId, { immediately = false } = {}) => {
    if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
    }
    // Period শেষে cancel হবে
    return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
};

// ── Webhook event construct করো ──────────────────────────────
const constructWebhookEvent = (rawBody, signature, webhookSecret) => {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
};

// ── Stripe event থেকে plan বের করো ──────────────────────────
const getPlanFromEvent = (event) => {
    const pricePlanMap = getPricePlanMap();

    if (event.type === 'checkout.session.completed') {
        return event.data.object.metadata?.plan || null;
    }

    if (event.type.startsWith('customer.subscription')) {
        const sub = event.data.object;
        const priceId = sub.items?.data?.[0]?.price?.id;
        return pricePlanMap[priceId] || null;
    }

    return null;
};

// ── Invoice details নিয়ে আসো ─────────────────────────────────
const getInvoice = async (invoiceId) => {
    return await stripe.invoices.retrieve(invoiceId);
};

module.exports = {
    getOrCreateCustomer,
    createCheckoutSession,
    createPortalSession,
    getSubscription,
    cancelSubscription,
    constructWebhookEvent,
    getPlanFromEvent,
    getInvoice,
};