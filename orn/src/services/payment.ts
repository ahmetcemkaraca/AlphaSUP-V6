/**
 * Payment Service - Stripe Integration
 * Ödeme işlemlerinin yönetimi ve Stripe entegrasyonu
 */

import { firestore } from 'firebase-admin';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

import { BookingStatus } from '../types/booking';
import {
  Payment,
  PaymentIntentStatus,
  PaymentIntent as PaymentIntentType,
  PaymentMethodType,
  PaymentRefund,
  PaymentStatus,
  RefundStatus,
} from '../types/payment';
import { stripe, STRIPE_CONFIG, StripeUtils } from '../config/stripe';
import { AuditService } from './audit';
import { NotificationService } from './notification';

export class PaymentService {
  private db: FirebaseFirestore.Firestore;
  private auditService: AuditService;
  private notificationService: NotificationService;

  constructor() {
    this.db = firestore();
    this.auditService = new AuditService();
    this.notificationService = new NotificationService();
  }

  /**
   * Create payment intent for booking
   * Rezervasyon için ödeme niyeti oluşturma
   */
  async createPaymentIntent(
    bookingId: string,
    customerId: string,
    amount: number,
    options: {
      depositOnly?: boolean;
      depositPercentage?: number;
      currency?: string;
      savePaymentMethod?: boolean;
    } = {}
  ): Promise<{ paymentIntent: Stripe.PaymentIntent; clientSecret: string }> {
    try {
      // Calculate payment amount
      const finalAmount = options.depositOnly
        ? StripeUtils.calculateDepositAmount(amount, options.depositPercentage)
        : amount;

      const { total, fees } = StripeUtils.calculateTotalWithFees(finalAmount);

      // Create Stripe payment intent
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: StripeUtils.toStripeAmount(total),
        currency:
          options.currency || STRIPE_CONFIG.PAYMENT_INTENT_CONFIG.currency,
        customer: await this.getOrCreateStripeCustomer(customerId),
        payment_method_types: [...STRIPE_CONFIG.ALLOWED_PAYMENT_METHODS],
        capture_method: STRIPE_CONFIG.PAYMENT_INTENT_CONFIG.captureMethod,
        confirmation_method:
          STRIPE_CONFIG.PAYMENT_INTENT_CONFIG.confirmationMethod,
        metadata: {
          bookingId,
          customerId,
          originalAmount: amount.toString(),
          depositOnly: options.depositOnly?.toString() || 'false',
          fees: fees.toString(),
        },
      };

      if (options.savePaymentMethod) {
        paymentIntentParams.setup_future_usage = 'off_session';
      }

      const paymentIntent = await stripe.paymentIntents.create(
        paymentIntentParams,
        {
          idempotencyKey: StripeUtils.generateIdempotencyKey(
            bookingId,
            'create-intent'
          ),
        }
      );

      // Save payment intent to database (only if clientSecret exists)
      if (paymentIntent.client_secret) {
        await this.savePaymentIntentToDb({
          id: paymentIntent.id,
          bookingId,
          customerId,
          amount: total,
          currency: paymentIntent.currency,
          status: paymentIntent.status as PaymentIntentStatus,
          clientSecret: paymentIntent.client_secret,
          paymentMethods: [...STRIPE_CONFIG.ALLOWED_PAYMENT_METHODS],
          captureMethod: 'automatic',
          metadata: paymentIntent.metadata,
          expiresAt: new Date(
            Date.now() +
              STRIPE_CONFIG.PAYMENT_INTENT_TIMEOUT_MINUTES * 60 * 1000
          ).toISOString(),
        });
      }

      // Audit logging
      await this.auditService.log({
        action: 'PAYMENT_INTENT_CREATED',
        resource: 'payment_intent',
        resourceId: paymentIntent.id,
        userId: customerId,
        metadata: {
          bookingId,
          amount: total,
          depositOnly: options.depositOnly,
        },
      });

      return {
        paymentIntent,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error: any) {
      console.error('Payment intent creation failed:', error);
      throw new Error(
        `Payment intent creation failed: ${error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Process successful payment
   * Başarılı ödeme işlemi sonrası süreçler
   */
  async processSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      // Get payment intent from Stripe
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      const bookingId = paymentIntent.metadata.bookingId;
      const customerId = paymentIntent.metadata.customerId;

      if (!bookingId || !customerId) {
        throw new Error('Invalid payment intent metadata');
      }

      // Create payment record
      const payment: Payment = {
        id: uuidv4(),
        paymentId: paymentIntent.id,
        bookingId,
        customerId,
        amount: StripeUtils.fromStripeAmount(paymentIntent.amount),
        currency: paymentIntent.currency,
        paymentMethod: this.extractPaymentMethodFromStripe(paymentIntent),
        status: PaymentStatus.SUCCEEDED,
        intentStatus: paymentIntent.status as PaymentIntentStatus,
        provider: 'stripe',
        providerTransactionId: paymentIntent.id,
        providerMetadata: paymentIntent,
        fees: {
          processingFee: parseFloat(paymentIntent.metadata.fees || '0'),
          platformFee: 0,
          totalFees: parseFloat(paymentIntent.metadata.fees || '0'),
        },
        authorizedAt: new Date(paymentIntent.created * 1000).toISOString(),
        capturedAt: new Date().toISOString(),
        refunds: [],
        refundableAmount: StripeUtils.fromStripeAmount(paymentIntent.amount),
        receiptSent: false,
        riskLevel: 'low',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save payment to database
      await this.db.collection('payments').doc(payment.id).set(payment);

      // Update booking status
      await this.updateBookingPaymentStatus(
        bookingId,
        PaymentStatus.SUCCEEDED,
        payment.id
      );

      // Send receipt
      await this.sendPaymentReceipt(payment);

      // Audit logging
      await this.auditService.log({
        action: 'PAYMENT_SUCCEEDED',
        resource: 'payment',
        resourceId: payment.id,
        userId: customerId,
        metadata: {
          bookingId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod.type,
        },
      });

      console.log(`Payment processed successfully: ${payment.id}`);
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Process payment failure
   * Başarısız ödeme işlemi sonrası süreçler
   */
  async processFailedPayment(
    paymentIntentId: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      const bookingId = paymentIntent.metadata.bookingId;
      const customerId = paymentIntent.metadata.customerId;

      if (!bookingId || !customerId) {
        throw new Error('Invalid payment intent metadata');
      }

      // Create failed payment record
      const paymentData = {
        id: uuidv4(),
        paymentId: paymentIntent.id,
        bookingId,
        customerId,
        amount: StripeUtils.fromStripeAmount(paymentIntent.amount),
        currency: paymentIntent.currency,
        paymentMethod: this.extractPaymentMethodFromStripe(paymentIntent),
        status: PaymentStatus.FAILED,
        intentStatus: paymentIntent.status as PaymentIntentStatus,
        provider: 'stripe' as const,
        providerTransactionId: paymentIntent.id,
        providerMetadata: paymentIntent,
        fees: {
          processingFee: 0,
          platformFee: 0,
          totalFees: 0,
        },
        failedAt: new Date().toISOString(),
        ...(failureReason && { failureReason }),
        ...(paymentIntent.last_payment_error?.message && {
          failureReason: paymentIntent.last_payment_error.message,
        }),
        ...(paymentIntent.last_payment_error?.code && {
          failureCode: paymentIntent.last_payment_error.code,
        }),
        refunds: [],
        refundableAmount: 0,
        receiptSent: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save failed payment to database
      await this.db.collection('payments').doc(paymentData.id).set(paymentData);

      // Update booking status
      await this.updateBookingPaymentStatus(
        bookingId,
        PaymentStatus.FAILED,
        paymentData.id
      );

      // Send failure notification
      await this.notificationService.sendPaymentFailedNotification(
        customerId,
        bookingId,
        failureReason
      );

      // Audit logging
      await this.auditService.log({
        action: 'PAYMENT_FAILED',
        resource: 'payment',
        resourceId: paymentData.id,
        userId: customerId,
        metadata: {
          bookingId,
          amount: paymentData.amount,
          failureReason,
        },
      });

      console.log(`Payment failed: ${paymentData.id}`);
    } catch (error) {
      console.error('Payment failure processing failed:', error);
      throw error;
    }
  }

  /**
   * Create refund for payment
   * Ödeme iadesi oluşturma
   */
  async createRefund(
    paymentId: string,
    amount: number,
    reason: string,
    requestedBy: string,
    options: {
      partial?: boolean;
      adminNotes?: string;
    } = {}
  ): Promise<PaymentRefund> {
    try {
      // Get original payment
      const paymentDoc = await this.db
        .collection('payments')
        .doc(paymentId)
        .get();
      if (!paymentDoc.exists) {
        throw new Error('Payment not found');
      }

      const payment = paymentDoc.data() as Payment;

      // Validate refund amount
      if (amount > payment.refundableAmount) {
        throw new Error('Refund amount exceeds refundable amount');
      }

      // Create Stripe refund
      const stripeRefund = await stripe.refunds.create(
        {
          payment_intent: payment.providerTransactionId!,
          amount: StripeUtils.toStripeAmount(amount),
          reason: this.mapRefundReason(reason),
          metadata: {
            paymentId,
            bookingId: payment.bookingId,
            requestedBy,
            adminNotes: options.adminNotes || '',
          },
        },
        {
          idempotencyKey: StripeUtils.generateIdempotencyKey(
            paymentId,
            'refund'
          ),
        }
      );

      // Create refund record
      const refund: PaymentRefund = {
        id: uuidv4(),
        paymentId,
        refundId: stripeRefund.id,
        amount,
        currency: payment.currency,
        status: RefundStatus.PENDING,
        reason,
        requestedBy,
        providerRefundId: stripeRefund.id,
        metadata: {
          stripeRefund,
          adminNotes: options.adminNotes,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save refund to database
      await this.db.collection('payment_refunds').doc(refund.id).set(refund);

      // Update payment record
      const updatedRefunds = [...payment.refunds, refund];
      const newRefundableAmount = payment.refundableAmount - amount;
      const newStatus =
        newRefundableAmount === 0
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      await this.db.collection('payments').doc(paymentId).update({
        refunds: updatedRefunds,
        refundableAmount: newRefundableAmount,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update booking status if fully refunded
      if (newRefundableAmount === 0) {
        await this.updateBookingPaymentStatus(
          payment.bookingId,
          PaymentStatus.REFUNDED
        );
      }

      // Send refund notification
      await this.notificationService.sendRefundNotification(
        payment.customerId,
        payment.bookingId,
        amount
      );

      // Audit logging
      await this.auditService.log({
        action: 'REFUND_CREATED',
        resource: 'refund',
        resourceId: refund.id,
        userId: requestedBy,
        metadata: {
          paymentId,
          bookingId: payment.bookingId,
          amount,
          reason,
        },
      });

      return refund;
    } catch (error: any) {
      console.error('Refund creation failed:', error);
      throw new Error(
        `Refund creation failed: ${error?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const doc = await this.db.collection('payments').doc(paymentId).get();
      return doc.exists ? (doc.data() as Payment) : null;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  }

  /**
   * Get payments for booking
   */
  async getPaymentsForBooking(bookingId: string): Promise<Payment[]> {
    try {
      const snapshot = await this.db
        .collection('payments')
        .where('bookingId', '==', bookingId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data() as Payment);
    } catch (error) {
      console.error('Error getting payments for booking:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getOrCreateStripeCustomer(customerId: string): Promise<string> {
    try {
      // Check if customer already has Stripe ID
      const customerDoc = await this.db
        .collection('customers')
        .doc(customerId)
        .get();

      if (customerDoc.exists) {
        const customerData = customerDoc.data();
        if (customerData?.stripeCustomerId) {
          return customerData.stripeCustomerId;
        }
      }

      // Create new Stripe customer
      const stripeCustomer = await stripe.customers.create({
        metadata: {
          firebaseCustomerId: customerId,
        },
      });

      // Save Stripe ID to customer record
      await this.db.collection('customers').doc(customerId).update({
        stripeCustomerId: stripeCustomer.id,
        updatedAt: new Date().toISOString(),
      });

      return stripeCustomer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  private extractPaymentMethodFromStripe(
    paymentIntent: Stripe.PaymentIntent
  ): Payment['paymentMethod'] {
    const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;

    if (!paymentMethod) {
      return {
        type: PaymentMethodType.CARD,
      };
    }

    switch (paymentMethod.type) {
      case 'card': {
        const cardInfo: Payment['paymentMethod'] = {
          type: PaymentMethodType.CARD,
          card: {
            brand: paymentMethod.card?.brand || 'unknown',
            last4: paymentMethod.card?.last4 || '0000',
            expMonth: paymentMethod.card?.exp_month || 0,
            expYear: paymentMethod.card?.exp_year || 0,
          },
        };

        if (paymentMethod.card?.country) {
          // country is optional on our type
          if (cardInfo.card) {
            cardInfo.card.country = paymentMethod.card.country;
          }
        }

        return cardInfo;
      }
      default:
        return {
          type: PaymentMethodType.CARD,
        };
    }
  }

  private async savePaymentIntentToDb(
    paymentIntent: PaymentIntentType
  ): Promise<void> {
    await this.db
      .collection('payment_intents')
      .doc(paymentIntent.id)
      .set(paymentIntent);
  }

  private async updateBookingPaymentStatus(
    bookingId: string,
    paymentStatus: PaymentStatus,
    paymentId?: string
  ): Promise<void> {
    const updateData: any = {
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    // Update booking status based on payment status
    if (paymentStatus === PaymentStatus.SUCCEEDED) {
      updateData.status = BookingStatus.CONFIRMED;
    } else if (paymentStatus === PaymentStatus.FAILED) {
      updateData.status = BookingStatus.CANCELLED; // Use CANCELLED instead of PAYMENT_FAILED
    } else if (paymentStatus === PaymentStatus.REFUNDED) {
      updateData.status = BookingStatus.CANCELLED;
    }

    await this.db.collection('bookings').doc(bookingId).update(updateData);
  }

  private async sendPaymentReceipt(payment: Payment): Promise<void> {
    try {
      await this.notificationService.sendPaymentReceiptNotification(
        payment.customerId,
        payment.bookingId,
        payment
      );

      // Update payment record
      await this.db.collection('payments').doc(payment.id).update({
        receiptSent: true,
        receiptSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending payment receipt:', error);
      // Don't throw error - receipt failure shouldn't fail payment processing
    }
  }

  private mapRefundReason(reason: string): Stripe.RefundCreateParams.Reason {
    switch (reason) {
      case STRIPE_CONFIG.REFUND_REASONS.FRAUDULENT:
        return 'fraudulent';
      case STRIPE_CONFIG.REFUND_REASONS.DUPLICATE_CHARGE:
        return 'duplicate';
      case STRIPE_CONFIG.REFUND_REASONS.CUSTOMER_REQUEST:
      case STRIPE_CONFIG.REFUND_REASONS.WEATHER_CANCELLATION:
      case STRIPE_CONFIG.REFUND_REASONS.EQUIPMENT_ISSUE:
      case STRIPE_CONFIG.REFUND_REASONS.BUSINESS_CANCELLATION:
      default:
        return 'requested_by_customer';
    }
  }
}

export default PaymentService;
