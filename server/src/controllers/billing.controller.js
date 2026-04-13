const stripe = require('../config/stripe');
const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');

const PRICE_TO_PLAN = {
    [process.env.STRIPE_PRO_PRICE_ID]: 'pro',
    [process.env.STRIPE_PROMAX_PRICE_ID]: 'pro-max',
};

// ── POST /api/billing/checkout ───────────────────────────────
// Stripe checkout session তৈরি করো
exports.createCheckout = async (req, res) => {
    try {
        const { plan } = req.body;
        const user = req.user;

        if (!['pro', 'pro-max'].includes(plan)) {
            return res.status(400).json({ message: 'Invalid plan. Must be pro or pro-max' });
        }

        const priceId = plan === 'pro'
            ? process.env.STRIPE_PRO_PRICE_ID
            : process.env.STRIPE_PROMAX_PRICE_ID;

        // Stripe customer তৈরি বা খোঁজো
        let customerId = user.subscription?.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            customerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.CLIENT_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/billing?canceled=true`,
            metadata: {
                userId: user._id.toString(),
                plan,
            },
        });

        res.json({ success: true, url: session.url });
    } catch (err) {
        console.error('Checkout error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/billing/portal ─────────────────────────────────
// Stripe customer portal — subscription manage করতে
exports.createPortal = async (req, res) => {
    try {
        const user = req.user;
        const customerId = user.subscription?.stripeCustomerId;

        if (!customerId) {
            return res.status(400).json({ message: 'No active subscription found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.CLIENT_URL}/billing`,
        });

        res.json({ success: true, url: session.url });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/billing/status ──────────────────────────────────
exports.getStatus = async (req, res) => {
    try {
        const user = req.user;
        const sub = await Subscription.findOne({ userId: user._id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            plan: user.effectivePlan,
            subscription: sub ? {
                status: sub.status,
                currentPeriodEnd: sub.currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            } : null,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/billing/webhook ────────────────────────────────
// Stripe webhook — payment success হলে plan update করো
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {

            // ── Checkout completed ──────────────────────────────────
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                const subId = session.subscription;

                if (!userId || !plan) break;

                const user = await User.findById(userId);
                if (!user) break;

                // Stripe subscription details
                const stripeSub = await stripe.subscriptions.retrieve(subId);

                // User plan update
                user.plan = plan;
                user.subscription = {
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: subId,
                    stripePriceId: stripeSub.items.data[0]?.price?.id,
                    status: 'active',
                    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                };
                await user.save();

                // Subscription record তৈরি করো
                await Subscription.create({
                    userId: user._id,
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: subId,
                    stripePriceId: stripeSub.items.data[0]?.price?.id,
                    plan,
                    status: 'active',
                    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
                    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                });

                console.log(`✅ Payment success: ${user.email} → ${plan}`);
                break;
            }

            // ── Subscription updated ────────────────────────────────
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const priceId = sub.items.data[0]?.price?.id;
                const plan = PRICE_TO_PLAN[priceId];

                const user = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
                if (!user || !plan) break;

                user.plan = plan;
                user.subscription.status = sub.status;
                user.subscription.currentPeriodEnd = new Date(sub.current_period_end * 1000);
                await user.save();
                break;
            }

            // ── Subscription cancelled / deleted ────────────────────
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const user = await User.findOne({ 'subscription.stripeSubscriptionId': sub.id });
                if (!user) break;

                user.plan = 'free';
                user.subscription.status = 'canceled';
                await user.save();

                console.log(`⚠️  Subscription canceled: ${user.email} → free`);
                break;
            }

            // ── Payment failed ──────────────────────────────────────
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer });
                if (!user) break;

                user.subscription.status = 'past_due';
                await user.save();
                console.warn(`⚠️  Payment failed: ${user.email}`);
                break;
            }
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err.message);
        res.status(500).json({ message: err.message });
    }
};