/**
 * Payment Service - Stripe Integration
 * Ödeme işlemlerinin yönetimi ve Stripe entegrasyonu
 */
import Stripe from 'stripe';
import { Payment, PaymentRefund } from '../types/payment';
export declare class PaymentService {
    private db;
    private auditService;
    private notificationService;
    constructor();
    /**
     * Create payment intent for booking
     * Rezervasyon için ödeme niyeti oluşturma
     */
    createPaymentIntent(bookingId: string, customerId: string, amount: number, options?: {
        depositOnly?: boolean;
        depositPercentage?: number;
        currency?: string;
        savePaymentMethod?: boolean;
    }): Promise<{
        paymentIntent: Stripe.PaymentIntent;
        clientSecret: string;
    }>;
    /**
     * Process successful payment
     * Başarılı ödeme işlemi sonrası süreçler
     */
    processSuccessfulPayment(paymentIntentId: string): Promise<void>;
    /**
     * Process payment failure
     * Başarısız ödeme işlemi sonrası süreçler
     */
    processFailedPayment(paymentIntentId: string, failureReason?: string): Promise<void>;
    /**
     * Create refund for payment
     * Ödeme iadesi oluşturma
     */
    createRefund(paymentId: string, amount: number, reason: string, requestedBy: string, options?: {
        partial?: boolean;
        adminNotes?: string;
    }): Promise<PaymentRefund>;
    /**
     * Get payment by ID
     */
    getPayment(paymentId: string): Promise<Payment | null>;
    /**
     * Get payments for booking
     */
    getPaymentsForBooking(bookingId: string): Promise<Payment[]>;
    private getOrCreateStripeCustomer;
    private extractPaymentMethodFromStripe;
    private savePaymentIntentToDb;
    private updateBookingPaymentStatus;
    private sendPaymentReceipt;
    private mapRefundReason;
}
export default PaymentService;
