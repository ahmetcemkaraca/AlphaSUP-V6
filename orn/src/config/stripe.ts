/**
 * Stripe Configuration and Client Setup
 * Ödeme işleme yapılandırması ve güvenli anahtar yönetimi
 */

import Stripe from 'stripe';

// Environment'dan güvenli anahtar okuma
const getStripeSecretKey = (): string => {
  // Use environment variable only (Firebase config deprecated)
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn(
      'Warning: Stripe secret key not set. Requests may fail if used without valid key.'
    );
    return '';
  }
  return secretKey;
};

// Stripe client instance oluşturma
export const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'AlphaSUP Booking System',
    version: '3.0.0',
    url: 'https://alphasupack.web.app',
  },
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Webhook endpoint secret (environment'dan okunacak)
  getWebhookSecret: (): string => {
    // Use environment variable only (Firebase config deprecated)
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.warn(
        'Warning: Stripe webhook secret not set. Webhook validation may fail if secret is missing.'
      );
      return '';
    }
    return secret;
  },

  // Payment intent configuration
  PAYMENT_INTENT_CONFIG: {
    captureMethod: 'automatic' as const,
    confirmationMethod: 'automatic' as const,
    currency: 'try', // Turkish Lira for AlphaSUP
  },

  // Deposit percentage (değiştirilebilir)
  DEFAULT_DEPOSIT_PERCENTAGE: 30, // %30 deposit for SUP bookings

  // Payment method types allowed
  ALLOWED_PAYMENT_METHODS: ['card', 'apple_pay', 'google_pay'] as const,

  // Refund reasons
  REFUND_REASONS: {
    CUSTOMER_REQUEST: 'customer_request',
    WEATHER_CANCELLATION: 'weather_cancellation',
    EQUIPMENT_ISSUE: 'equipment_issue',
    BUSINESS_CANCELLATION: 'business_cancellation',
    DUPLICATE_CHARGE: 'duplicate_charge',
    FRAUDULENT: 'fraudulent',
  } as const,

  // Fee calculation
  PROCESSING_FEE_PERCENTAGE: 2.9, // Stripe fee percentage
  FIXED_FEE_CENTS: 30, // Fixed fee in cents (kuruş)

  // Payment timeout
  PAYMENT_INTENT_TIMEOUT_MINUTES: 30,
} as const;

// Utility functions for Stripe operations
export const StripeUtils = {
  /**
   * Calculate total amount including fees
   */
  calculateTotalWithFees: (
    baseAmount: number
  ): { total: number; fees: number } => {
    const fees = Math.round(
      (baseAmount * STRIPE_CONFIG.PROCESSING_FEE_PERCENTAGE) / 100 +
        STRIPE_CONFIG.FIXED_FEE_CENTS
    );
    return {
      total: baseAmount + fees,
      fees,
    };
  },

  /**
   * Calculate deposit amount
   */
  calculateDepositAmount: (
    totalAmount: number,
    depositPercentage?: number
  ): number => {
    const percentage =
      depositPercentage || STRIPE_CONFIG.DEFAULT_DEPOSIT_PERCENTAGE;
    return Math.round((totalAmount * percentage) / 100);
  },

  /**
   * Convert amount to Stripe format (cents/kuruş)
   */
  toStripeAmount: (amount: number): number => {
    return Math.round(amount * 100); // TRY to kuruş
  },

  /**
   * Convert Stripe amount to regular format
   */
  fromStripeAmount: (amount: number): number => {
    return amount / 100; // kuruş to TRY
  },

  /**
   * Generate unique idempotency key
   */
  generateIdempotencyKey: (bookingId: string, operation: string): string => {
    return `${bookingId}-${operation}-${Date.now()}`;
  },

  /**
   * Validate webhook signature
   */
  validateWebhookSignature: (
    payload: string,
    signature: string
  ): Stripe.Event => {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_CONFIG.getWebhookSecret()
      );
    } catch (error: any) {
      throw new Error(
        `Webhook signature validation failed: ${error?.message || 'Unknown error'}`
      );
    }
  },
};

// Export Stripe client and configuration
export default stripe;
