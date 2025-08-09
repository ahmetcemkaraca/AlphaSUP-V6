/**
 * Payment Controller
 *
 * Handles payment processing logic using Stripe.
 *
 * @version 2.0.0
 */
import { NextFunction, Request, Response } from 'express';
export declare const createPaymentIntent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const stripeWebhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=paymentController.d.ts.map