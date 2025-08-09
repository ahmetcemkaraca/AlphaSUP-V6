/**
 * Payment API Routes
 * Ödeme işlemleri için API endpoint'leri
 */

import { Request, Response, Router } from 'express';
import { AuthMiddleware } from '../middleware/auth';
import PaymentService from '../services/payment';

const router = Router();
const paymentService = new PaymentService();
const authMiddleware = new AuthMiddleware();

// Simple helpers for validation
const badRequest = (
  res: Response,
  message: string,
  details?: unknown
): void => {
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      ...(details ? { details } : {}),
    },
  });
};

/**
 * POST /api/payments/create-intent
 * Create payment intent for booking
 */
router.post(
  '/create-intent',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const {
        bookingId,
        amount,
        depositOnly,
        depositPercentage,
        currency,
        savePaymentMethod,
      } = req.body || {};

      if (!bookingId || typeof bookingId !== 'string') {
        return badRequest(res, 'Booking ID is required');
      }
      const amt = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (!Number.isFinite(amt) || amt < 0.01) {
        return badRequest(res, 'Amount must be greater than 0');
      }
      if (depositOnly !== undefined && typeof depositOnly !== 'boolean') {
        return badRequest(res, 'Deposit only must be boolean');
      }
      if (
        depositPercentage !== undefined &&
        (!Number.isFinite(Number(depositPercentage)) ||
          Number(depositPercentage) < 1 ||
          Number(depositPercentage) > 100)
      ) {
        return badRequest(res, 'Deposit percentage must be between 1-100');
      }
      if (
        currency !== undefined &&
        (typeof currency !== 'string' || currency.length !== 3)
      ) {
        return badRequest(res, 'Currency must be 3 characters');
      }
      if (
        savePaymentMethod !== undefined &&
        typeof savePaymentMethod !== 'boolean'
      ) {
        return badRequest(res, 'Save payment method must be boolean');
      }

      const { paymentIntent, clientSecret } =
        await paymentService.createPaymentIntent(
          bookingId,
          req.user!.uid,
          amt,
          {
            depositOnly,
            depositPercentage:
              depositPercentage !== undefined
                ? Number(depositPercentage)
                : undefined,
            currency,
            savePaymentMethod,
          }
        );

      res.status(200).json({
        success: true,
        data: {
          paymentIntentId: paymentIntent.id,
          clientSecret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
      });
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PAYMENT_INTENT_CREATION_FAILED',
          message: error?.message || 'Failed to create payment intent',
        },
      });
    }
  }
);

/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
router.get(
  '/:paymentId',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      if (!paymentId) {
        return badRequest(res, 'Payment ID is required');
      }
      const payment = await paymentService.getPayment(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      // Check if user owns this payment or is admin
      if (payment.customerId !== req.user!.uid && !req.user!.isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PAYMENT_RETRIEVAL_FAILED',
          message: error?.message || 'Failed to retrieve payment',
        },
      });
    }
  }
);

/**
 * GET /api/payments/booking/:bookingId
 * Get payments for booking
 */
router.get(
  '/booking/:bookingId',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      if (!bookingId) {
        return badRequest(res, 'Booking ID is required');
      }
      const payments = await paymentService.getPaymentsForBooking(bookingId);

      // Check if user owns this booking or is admin
      if (
        payments.length > 0 &&
        payments[0].customerId !== req.user!.uid &&
        !req.user!.isAdmin
      ) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error('Get booking payments error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PAYMENT_RETRIEVAL_FAILED',
          message: error?.message || 'Failed to retrieve payments',
        },
      });
    }
  }
);

/**
 * POST /api/payments/:paymentId/refund
 * Create refund for payment (Admin only)
 */
router.post(
  '/:paymentId/refund',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { amount, reason, adminNotes } = req.body || {};

      if (!paymentId) {
        return badRequest(res, 'Payment ID is required');
      }
      const amt = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (!Number.isFinite(amt) || amt < 0.01) {
        return badRequest(res, 'Amount must be greater than 0');
      }
      if (!reason || typeof reason !== 'string') {
        return badRequest(res, 'Refund reason is required');
      }
      if (adminNotes !== undefined && typeof adminNotes !== 'string') {
        return badRequest(res, 'Admin notes must be string');
      }

      const refund = await paymentService.createRefund(
        paymentId,
        amt,
        reason,
        req.user!.uid,
        {
          adminNotes,
        }
      );

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error: any) {
      console.error('Create refund error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REFUND_CREATION_FAILED',
          message: error?.message || 'Failed to create refund',
        },
      });
    }
  }
);

// Webhook route mounted in index.ts with raw body to preserve signature verification

/**
 * GET /api/payments/config
 * Get payment configuration (public)
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        currency: 'try',
        allowedPaymentMethods: ['card', 'apple_pay', 'google_pay'],
        defaultDepositPercentage: 30,
        minimumAmount: 1,
      },
    });
  } catch (error: any) {
    console.error('Get payment config error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIG_RETRIEVAL_FAILED',
        message: 'Failed to retrieve payment configuration',
      },
    });
  }
});

export default router;
