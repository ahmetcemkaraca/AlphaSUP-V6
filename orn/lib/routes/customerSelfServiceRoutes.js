"use strict";
/**
 * Customer Self-Service Routes
 * Self-service functionality routes for customers
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerSelfServiceController_1 = require("../controllers/customerSelfServiceController");
const asyncHandler_1 = require("../middleware/asyncHandler");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
const customerSelfServiceController = new customerSelfServiceController_1.CustomerSelfServiceController();
// Apply authentication middleware to all routes
router.use((0, asyncHandler_1.asyncHandler)(authMiddleware_1.protect));
// Use asyncHandler for all controller methods to handle async errors properly
/**
 * Customer Dashboard & Profile Routes
 */
// GET /api/customer/dashboard - Get customer dashboard data
router.get('/dashboard', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getCustomerDashboard.bind(customerSelfServiceController)));
router.put('/profile', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.updateCustomerProfile.bind(customerSelfServiceController)));
router.get('/statistics', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getCustomerStatistics.bind(customerSelfServiceController)));
router.get('/bookings', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getBookingHistory.bind(customerSelfServiceController)));
router.get('/loyalty', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getLoyaltyProgram.bind(customerSelfServiceController)));
router.post('/loyalty/redeem', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.redeemLoyaltyPoints.bind(customerSelfServiceController)));
router.get('/notifications', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getCustomerNotifications.bind(customerSelfServiceController)));
router.patch('/notifications/read', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.markNotificationsRead.bind(customerSelfServiceController)));
router.patch('/notifications/preferences', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.updateNotificationPreferences.bind(customerSelfServiceController)));
router.put('/preferences', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.updateCustomerPreferences.bind(customerSelfServiceController)));
router.get('/support/tickets', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getSupportTickets.bind(customerSelfServiceController)));
router.post('/support/tickets', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.createSupportTicket.bind(customerSelfServiceController)));
// PUT /api/customer/profile - Update customer profile
router.put('/profile', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.updateCustomerProfile.bind(customerSelfServiceController)));
router.get('/statistics', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getCustomerStatistics.bind(customerSelfServiceController)));
router.get('/bookings', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getBookingHistory.bind(customerSelfServiceController)));
router.get('/loyalty', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getLoyaltyProgram.bind(customerSelfServiceController)));
router.post('/loyalty/redeem', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.redeemLoyaltyPoints.bind(customerSelfServiceController)));
router.get('/notifications', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getCustomerNotifications.bind(customerSelfServiceController)));
router.patch('/notifications/read', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.markNotificationsRead.bind(customerSelfServiceController)));
router.patch('/notifications/preferences', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.updateNotificationPreferences.bind(customerSelfServiceController)));
router.put('/preferences', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.updateCustomerPreferences.bind(customerSelfServiceController)));
router.get('/support/tickets', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.getSupportTickets.bind(customerSelfServiceController)));
router.post('/support/tickets', (0, asyncHandler_1.asyncHandler)(customerSelfServiceController.createSupportTicket.bind(customerSelfServiceController)));
exports.default = router;
//# sourceMappingURL=customerSelfServiceRoutes.js.map