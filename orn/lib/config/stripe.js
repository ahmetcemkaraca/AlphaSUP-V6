"use strict";
/**
 * Stripe Configuration and Client Setup
 * Ödeme işleme yapılandırması ve güvenli anahtar yönetimi
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeUtils = exports.STRIPE_CONFIG = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
// Environment'dan güvenli anahtar okuma
const getStripeSecretKey = () => {
    // Use environment variable only (Firebase config deprecated)
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        console.warn('Warning: Stripe secret key not set. Requests may fail if used without valid key.');
        return '';
    }
    return secretKey;
};
// Stripe client instance oluşturma
exports.stripe = new stripe_1.default(getStripeSecretKey(), {
    apiVersion: '2023-10-16',
    typescript: true,
    appInfo: {
        name: 'AlphaSUP Booking System',
        version: '3.0.0',
        url: 'https://alphasupack.web.app',
    },
});
// Stripe configuration constants
exports.STRIPE_CONFIG = {
    // Webhook endpoint secret (environment'dan okunacak)
    getWebhookSecret: () => {
        // Use environment variable only (Firebase config deprecated)
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
            console.warn('Warning: Stripe webhook secret not set. Webhook validation may fail if secret is missing.');
            return '';
        }
        return secret;
    },
    // Payment intent configuration
    PAYMENT_INTENT_CONFIG: {
        captureMethod: 'automatic',
        confirmationMethod: 'automatic',
        currency: 'try', // Turkish Lira for AlphaSUP
    },
    // Deposit percentage (değiştirilebilir)
    DEFAULT_DEPOSIT_PERCENTAGE: 30, // %30 deposit for SUP bookings
    // Payment method types allowed
    ALLOWED_PAYMENT_METHODS: ['card', 'apple_pay', 'google_pay'],
    // Refund reasons
    REFUND_REASONS: {
        CUSTOMER_REQUEST: 'customer_request',
        WEATHER_CANCELLATION: 'weather_cancellation',
        EQUIPMENT_ISSUE: 'equipment_issue',
        BUSINESS_CANCELLATION: 'business_cancellation',
        DUPLICATE_CHARGE: 'duplicate_charge',
        FRAUDULENT: 'fraudulent',
    },
    // Fee calculation
    PROCESSING_FEE_PERCENTAGE: 2.9, // Stripe fee percentage
    FIXED_FEE_CENTS: 30, // Fixed fee in cents (kuruş)
    // Payment timeout
    PAYMENT_INTENT_TIMEOUT_MINUTES: 30,
};
// Utility functions for Stripe operations
exports.StripeUtils = {
    /**
     * Calculate total amount including fees
     */
    calculateTotalWithFees: (baseAmount) => {
        const fees = Math.round((baseAmount * exports.STRIPE_CONFIG.PROCESSING_FEE_PERCENTAGE) / 100 +
            exports.STRIPE_CONFIG.FIXED_FEE_CENTS);
        return {
            total: baseAmount + fees,
            fees,
        };
    },
    /**
     * Calculate deposit amount
     */
    calculateDepositAmount: (totalAmount, depositPercentage) => {
        const percentage = depositPercentage || exports.STRIPE_CONFIG.DEFAULT_DEPOSIT_PERCENTAGE;
        return Math.round((totalAmount * percentage) / 100);
    },
    /**
     * Convert amount to Stripe format (cents/kuruş)
     */
    toStripeAmount: (amount) => {
        return Math.round(amount * 100); // TRY to kuruş
    },
    /**
     * Convert Stripe amount to regular format
     */
    fromStripeAmount: (amount) => {
        return amount / 100; // kuruş to TRY
    },
    /**
     * Generate unique idempotency key
     */
    generateIdempotencyKey: (bookingId, operation) => {
        return `${bookingId}-${operation}-${Date.now()}`;
    },
    /**
     * Validate webhook signature
     */
    validateWebhookSignature: (payload, signature) => {
        try {
            return exports.stripe.webhooks.constructEvent(payload, signature, exports.STRIPE_CONFIG.getWebhookSecret());
        }
        catch (error) {
            throw new Error(`Webhook signature validation failed: ${error?.message || 'Unknown error'}`);
        }
    },
};
// Export Stripe client and configuration
exports.default = exports.stripe;
//# sourceMappingURL=stripe.js.map