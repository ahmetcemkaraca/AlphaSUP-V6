/**
 * Webhook Handler - Stripe Payment Events
 * Stripe webhook olaylarının işlenmesi
 * AlphaSUP - Phase 7 SMS Integration Enhanced
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, StripeUtils } from '../config/stripe';
import { AuditService } from '../services/audit';
import NotificationService from '../services/notification';
import PaymentService from '../services/payment';

export class WebhookHandler {
  private paymentService: PaymentService;
  private auditService: AuditService;
  private notificationService: NotificationService;

  constructor() {
    this.paymentService = new PaymentService();
    this.auditService = new AuditService();
    this.notificationService = new NotificationService();
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      // Validate webhook signature
      event = StripeUtils.validateWebhookSignature(req.body, sig);
    } catch (error: any) {
      console.error('Webhook signature validation failed:', error);
      res
        .status(400)
        .send(`Webhook Error: ${error?.message || 'Invalid signature'}`);
      return;
    }

    try {
      // Process webhook event
      await this.processWebhookEvent(event);

      // Log successful webhook processing
      await this.auditService.log({
        action: 'WEBHOOK_PROCESSED',
        resource: 'webhook',
        resourceId: event.id,
        userId: 'system',
        metadata: {
          eventType: event.type,
          eventId: event.id,
        },
      });

      console.log(
        `Webhook processed successfully: ${event.type} - ${event.id}`
      );
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook processing failed:', error);

      // Log failed webhook processing
      await this.auditService.log({
        action: 'WEBHOOK_FAILED',
        resource: 'webhook',
        resourceId: event.id,
        userId: 'system',
        success: false,
        errorMessage: error?.message || 'Unknown error',
        metadata: {
          eventType: event.type,
          eventId: event.id,
        },
      });

      res.status(500).json({
        error: 'Webhook processing failed',
        eventId: event.id,
      });
    }
  }

  /**
   * Process individual webhook events
   */
  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'charge.dispute.created':
        await this.handleChargeDisputeCreated(
          event.data.object as Stripe.Dispute
        );
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(
          event.data.object as Stripe.PaymentMethod
        );
        break;

      case 'setup_intent.succeeded':
        await this.handleSetupIntentSucceeded(
          event.data.object as Stripe.SetupIntent
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      console.log(`Processing successful payment: ${paymentIntent.id}`);
      await this.paymentService.processSuccessfulPayment(paymentIntent.id);

      // 🚧 Phase 7 SMS Integration - TODO: Trigger payment confirmation SMS
      try {
        console.log(
          '🚧 [Webhook SMS] Ödeme başarılı SMS tetikleyicisi - Phase 7 Implementation'
        );

        // Extract booking/customer info from payment metadata
        const metadata = paymentIntent.metadata;
        if (metadata.bookingId && metadata.customerId) {
          await this.notificationService.sendSMSNotification(
            'payment_confirmation',
            {
              customerId: metadata.customerId,
              customerName: metadata.customerName || 'Müşteri',
              customerPhone: metadata.customerPhone || '',
              bookingId: metadata.bookingId,
              amount: (paymentIntent.amount / 100).toString(),
              currency: paymentIntent.currency.toUpperCase(),
            }
          );
        }
      } catch (smsError) {
        console.error('SMS gönderim hatası (ödeme onayı):', smsError);
        // SMS hatası webhook işlemini durdurmaz
      }
    } catch (error) {
      console.error(
        `Failed to process successful payment ${paymentIntent.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      console.log(`Processing failed payment: ${paymentIntent.id}`);
      const failureReason =
        paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.paymentService.processFailedPayment(
        paymentIntent.id,
        failureReason
      );
    } catch (error) {
      console.error(
        `Failed to process failed payment ${paymentIntent.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle canceled payment intent
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    try {
      console.log(`Processing canceled payment: ${paymentIntent.id}`);
      await this.paymentService.processFailedPayment(
        paymentIntent.id,
        'Payment canceled'
      );
    } catch (error) {
      console.error(
        `Failed to process canceled payment ${paymentIntent.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle charge dispute created
   */
  private async handleChargeDisputeCreated(
    dispute: Stripe.Dispute
  ): Promise<void> {
    try {
      console.log(`Processing charge dispute: ${dispute.id}`);

      // Find the payment associated with this charge
      const charge = await stripe.charges.retrieve(dispute.charge as string);
      const paymentIntent = await stripe.paymentIntents.retrieve(
        charge.payment_intent as string
      );

      // Update payment status to disputed
      const payment = await this.paymentService.getPaymentsForBooking(
        paymentIntent.metadata.bookingId
      );

      if (payment.length > 0) {
        // TODO: Implement dispute handling logic
        console.log(`Dispute created for payment: ${payment[0].id}`);

        // Log dispute creation
        await this.auditService.log({
          action: 'PAYMENT_DISPUTED',
          resource: 'payment',
          resourceId: payment[0].id,
          userId: 'system',
          metadata: {
            disputeId: dispute.id,
            disputeReason: dispute.reason,
            disputeAmount: dispute.amount,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to process dispute ${dispute.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    try {
      console.log(`Processing successful invoice payment: ${invoice.id}`);
      // TODO: Handle subscription payments if applicable
    } catch (error) {
      console.error(`Failed to process invoice payment ${invoice.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<void> {
    try {
      console.log(`Processing failed invoice payment: ${invoice.id}`);
      // TODO: Handle subscription payment failures
    } catch (error) {
      console.error(
        `Failed to process failed invoice payment ${invoice.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    try {
      console.log(`Processing deleted subscription: ${subscription.id}`);
      // TODO: Handle subscription cancellations if applicable
    } catch (error) {
      console.error(
        `Failed to process subscription deletion ${subscription.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle payment method attached
   */
  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    try {
      console.log(`Processing attached payment method: ${paymentMethod.id}`);
      // TODO: Save payment method to customer record if needed
    } catch (error) {
      console.error(
        `Failed to process payment method attachment ${paymentMethod.id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Handle setup intent succeeded
   */
  private async handleSetupIntentSucceeded(
    setupIntent: Stripe.SetupIntent
  ): Promise<void> {
    try {
      console.log(`Processing successful setup intent: ${setupIntent.id}`);
      // TODO: Handle saved payment method setup completion
    } catch (error) {
      console.error(`Failed to process setup intent ${setupIntent.id}:`, error);
      throw error;
    }
  }
}

export default WebhookHandler;
