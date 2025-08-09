"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerFeedbackController_1 = require("../controllers/customerFeedbackController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
const feedbackController = new customerFeedbackController_1.CustomerFeedbackController();
/**
 * Feedback Routes
 * Handles review submission and retrieval
 */
// Submit a new review (authenticated customers only)
router.post('/', authMiddleware_1.protect, (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await feedbackController.submitReview(req, res, next);
}));
// Get reviews for a specific service (public)
router.get('/service/:serviceId', (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await feedbackController.getServiceReviews(req, res, next);
}));
// Get reviews by a specific customer (authenticated customers only)
router.get('/customer/:customerId', authMiddleware_1.protect, (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await feedbackController.getCustomerReviews(req, res, next);
}));
// Get customer review statistics (authenticated customers and admins only)
router.get('/customer/:customerId/stats', authMiddleware_1.protect, (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await feedbackController.getCustomerReviewStats(req, res, next);
}));
exports.default = router;
//# sourceMappingURL=feedbackRoutes.js.map