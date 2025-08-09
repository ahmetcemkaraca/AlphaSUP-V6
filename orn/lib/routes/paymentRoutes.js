"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Payment Routes
 *
 * Defines API endpoints for handling payments, primarily with Stripe.
 *
 * @version 2.0.0
 */
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
// Create a payment intent for a new booking
router.post('/create-payment-intent', authMiddleware_1.protect, (0, asyncHandler_1.asyncHandler)(paymentController_1.createPaymentIntent));
// Handle webhooks from Stripe for payment confirmations
router.post('/webhook', paymentController_1.stripeWebhook);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map