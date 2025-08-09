"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createPaymentIntent = void 0;
const tslib_1 = require("tslib");
const stripe_1 = tslib_1.__importDefault(require("stripe"));
const firebase_1 = require("../config/firebase");
// Initialize Stripe client (optional for development)
let stripe = null;
if (firebase_1.stripeSecretKey) {
    stripe = new stripe_1.default(firebase_1.stripeSecretKey, { apiVersion: '2023-10-16' });
}
else {
    console.warn('Stripe secret key not configured - payment functionality disabled');
}
// --- Create a Stripe Payment Intent ---
const createPaymentIntent = async (req, res, next) => {
    try {
        if (!stripe) {
            res.status(503).json({
                error: 'Payment service unavailable - Stripe not configured'
            });
            return;
        }
        const { amount, currency } = req.body; // amount should be in the smallest currency unit (e.g., cents)
        if (!amount || !currency) {
            res.status(400).json({ error: 'Amount and currency are required' });
            return;
        }
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: { enabled: true },
        });
        res.status(200).json({ client_secret: paymentIntent.client_secret });
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        next(error);
    }
};
exports.createPaymentIntent = createPaymentIntent;
// --- Stripe Webhook Handler ---
const stripeWebhook = async (req, res, next) => {
    try {
        if (!stripe || !firebase_1.stripeWebhookSecret) {
            res.status(503).json({ error: 'Webhook service not configured' });
            return;
        }
        const sig = req.headers['stripe-signature'];
        const body = req.body;
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, firebase_1.stripeWebhookSecret);
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err);
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }
        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                console.log('Payment succeeded:', event.data.object);
                // Update booking status to confirmed
                break;
            case 'payment_intent.payment_failed':
                console.log('Payment failed:', event.data.object);
                // Update booking status to failed
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        next(error);
    }
};
exports.stripeWebhook = stripeWebhook;
//# sourceMappingURL=paymentController.js.map