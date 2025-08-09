/**
 * Webhook Handler - Stripe Payment Events
 * Stripe webhook olaylarının işlenmesi
 * AlphaSUP - Phase 7 SMS Integration Enhanced
 */
import { Request, Response } from 'express';
export declare class WebhookHandler {
    private paymentService;
    private auditService;
    private notificationService;
    constructor();
    /**
     * Handle Stripe webhook events
     */
    handleStripeWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Process individual webhook events
     */
    private processWebhookEvent;
    /**
     * Handle successful payment intent
     */
    private handlePaymentIntentSucceeded;
    /**
     * Handle failed payment intent
     */
    private handlePaymentIntentFailed;
    /**
     * Handle canceled payment intent
     */
    private handlePaymentIntentCanceled;
    /**
     * Handle charge dispute created
     */
    private handleChargeDisputeCreated;
    /**
     * Handle successful invoice payment
     */
    private handleInvoicePaymentSucceeded;
    /**
     * Handle failed invoice payment
     */
    private handleInvoicePaymentFailed;
    /**
     * Handle subscription deleted
     */
    private handleSubscriptionDeleted;
    /**
     * Handle payment method attached
     */
    private handlePaymentMethodAttached;
    /**
     * Handle setup intent succeeded
     */
    private handleSetupIntentSucceeded;
}
export default WebhookHandler;
