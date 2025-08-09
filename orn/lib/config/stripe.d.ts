/**
 * Stripe Configuration and Client Setup
 * Ödeme işleme yapılandırması ve güvenli anahtar yönetimi
 */
import Stripe from 'stripe';
export declare const stripe: Stripe;
export declare const STRIPE_CONFIG: {
    readonly getWebhookSecret: () => string;
    readonly PAYMENT_INTENT_CONFIG: {
        readonly captureMethod: "automatic";
        readonly confirmationMethod: "automatic";
        readonly currency: "try";
    };
    readonly DEFAULT_DEPOSIT_PERCENTAGE: 30;
    readonly ALLOWED_PAYMENT_METHODS: readonly ["card", "apple_pay", "google_pay"];
    readonly REFUND_REASONS: {
        readonly CUSTOMER_REQUEST: "customer_request";
        readonly WEATHER_CANCELLATION: "weather_cancellation";
        readonly EQUIPMENT_ISSUE: "equipment_issue";
        readonly BUSINESS_CANCELLATION: "business_cancellation";
        readonly DUPLICATE_CHARGE: "duplicate_charge";
        readonly FRAUDULENT: "fraudulent";
    };
    readonly PROCESSING_FEE_PERCENTAGE: 2.9;
    readonly FIXED_FEE_CENTS: 30;
    readonly PAYMENT_INTENT_TIMEOUT_MINUTES: 30;
};
export declare const StripeUtils: {
    /**
     * Calculate total amount including fees
     */
    calculateTotalWithFees: (baseAmount: number) => {
        total: number;
        fees: number;
    };
    /**
     * Calculate deposit amount
     */
    calculateDepositAmount: (totalAmount: number, depositPercentage?: number) => number;
    /**
     * Convert amount to Stripe format (cents/kuruş)
     */
    toStripeAmount: (amount: number) => number;
    /**
     * Convert Stripe amount to regular format
     */
    fromStripeAmount: (amount: number) => number;
    /**
     * Generate unique idempotency key
     */
    generateIdempotencyKey: (bookingId: string, operation: string) => string;
    /**
     * Validate webhook signature
     */
    validateWebhookSignature: (payload: string, signature: string) => Stripe.Event;
};
export default stripe;
