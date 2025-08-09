"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminSMSController_1 = require("../controllers/adminSMSController");
const asyncHandler_1 = require("../middleware/asyncHandler");
const authMiddleware_1 = require("../middleware/authMiddleware");
/**
 * Admin SMS Management Routes
 * Comprehensive SMS system administration endpoints
 */
const router = (0, express_1.Router)();
// Apply authentication and admin middleware to all routes
router.use((0, asyncHandler_1.asyncHandler)(authMiddleware_1.protect));
router.use((req, res, next) => (0, authMiddleware_1.adminOnly)(req, res, next));
// Initialize SMS controller
const smsController = new adminSMSController_1.AdminSMSController();
router.get('/dashboard', (req, res, next) => smsController.getDashboardOverview(req, res, next));
router.get('/statistics', (req, res, next) => smsController.getSMSStatistics(req, res, next));
router.get('/account', (req, res, next) => smsController.getAccountInfo(req, res, next));
// ==================== SMS OPERATIONS ====================
// ...existing code...
router.post('/send/test', (0, asyncHandler_1.asyncHandler)(smsController.sendTestSMS.bind(smsController)));
router.post('/send/bulk', (0, asyncHandler_1.asyncHandler)(smsController.sendBulkSMS.bind(smsController)));
// ==================== SMS TEMPLATES ====================
// Template management
router.get('/templates', (0, asyncHandler_1.asyncHandler)(smsController.getSMSTemplates.bind(smsController)));
router.post('/templates', (0, asyncHandler_1.asyncHandler)(smsController.saveSMSTemplate.bind(smsController)));
router.put('/templates/:templateId', (0, asyncHandler_1.asyncHandler)(smsController.saveSMSTemplate.bind(smsController)));
router.delete('/templates/:templateId', (0, asyncHandler_1.asyncHandler)(smsController.deleteSMSTemplate.bind(smsController)));
// ==================== SMS REPORTS ====================
// Delivery reports and analytics
router.get('/reports/delivery', (0, asyncHandler_1.asyncHandler)(smsController.getDeliveryReports.bind(smsController)));
router.get('/reports/export', (0, asyncHandler_1.asyncHandler)(smsController.exportSMSData.bind(smsController)));
// ==================== SMS ALERTS ====================
// Alert configuration
router.post('/alerts', (0, asyncHandler_1.asyncHandler)(smsController.setSMSAlerts.bind(smsController)));
exports.default = router;
//# sourceMappingURL=adminSMSRoutes.js.map