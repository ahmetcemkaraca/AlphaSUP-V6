"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adminController_1 = require("../controllers/adminController");
/**
 * Admin Routes
 * Comprehensive admin panel API endpoints with role-based access control
 *
 * @version 2.0.0
 * @requires Express.js Router
 * @requires Firebase Authentication
 * @requires Role-based authorization (admin/editor only)
 */
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const auditLog_1 = require("../middleware/auditLog");
const authMiddleware_1 = require("../middleware/authMiddleware");
// Import controllers
const adminController_2 = require("../controllers/adminController");
const adminSMSController_1 = require("../controllers/adminSMSController");
const bulkOperationsController_1 = require("../controllers/bulkOperationsController");
// Initialize controllers
const bulkController = new bulkOperationsController_1.BulkOperationsController();
const smsController = new adminSMSController_1.AdminSMSController();
const router = (0, express_1.Router)();
// Apply authentication and admin-only middleware to all routes
router.use(authMiddleware_1.protect);
router.use(authMiddleware_1.adminOnly);
// ===== DASHBOARD ROUTES =====
/**
 * GET /api/admin/dashboard/stats
 * Get comprehensive dashboard statistics
 */
router.get('/dashboard/stats', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getDashboardStats));
/**
 * GET /api/admin/dashboard/overview
 * Get simplified dashboard overview
 */
router.get('/dashboard/overview', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getDashboard));
// ===== CUSTOMER MANAGEMENT ROUTES =====
/**
 * GET /api/admin/customers
 * Get all customers with pagination and filtering
 * Query params: page, limit, search, status, sortBy, sortOrder, lastDocId
 */
router.get('/customers', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getCustomers));
/**
 * GET /api/admin/customers/:customerId
 * Get specific customer details with booking history
 */
router.get('/customers/:customerId', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getCustomer));
// ===== SERVICE MANAGEMENT ROUTES =====
/**
 * GET /api/admin/services
 * Get all services with filtering
 * Query params: status, type, category, isActive
 */
router.get('/services', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getServices));
/**
 * POST /api/admin/services
 * Create a new service
 */
router.post('/services', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.createService));
/**
 * PUT /api/admin/services/:serviceId
 * Update an existing service
 */
router.put('/services/:serviceId', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.updateService));
/**
 * DELETE /api/admin/services/:serviceId
 * Soft delete a service (marks as deleted)
 */
router.delete('/services/:serviceId', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.deleteService));
/**
 * GET /api/admin/services/search
 * Advanced service search with full-text search
 * Query params: q (search query)
 */
router.get('/services/search', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.searchServices));
// ===== BOOKING MANAGEMENT ROUTES =====
/**
 * GET /api/admin/bookings
 * Get all bookings with filtering and pagination
 * Query params: page, limit, status, serviceId, customerId, dateFrom, dateTo, lastDocId
 */
router.get('/bookings', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getBookings));
/**
 * PUT /api/admin/bookings/:bookingId/status
 * Update booking status
 * Body: { status, notes }
 */
router.put('/bookings/:bookingId/status', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.updateBookingStatus));
/**
 * POST /api/admin/bookings/:bookingId/payment
 * Update booking payment manually (admin only)
 */
router.post('/bookings/:bookingId/payment', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const { amount, method, status, notes, timestamp } = req.body;
    // Validate required fields
    if (!amount || !method || !status) {
        res.status(400).json({
            success: false,
            error: 'Eksik gerekli alanlar: amount, method, status'
        });
        return;
    }
    try {
        // Here you would implement the payment update logic
        // For now, return success
        console.log('Manual payment update:', {
            bookingId,
            amount,
            method,
            status,
            notes,
            timestamp,
            adminId: req.user?.uid
        });
        res.status(200).json({
            success: true,
            message: 'Ödeme başarıyla güncellendi'
        });
    }
    catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({
            success: false,
            error: 'Ödeme güncellenirken hata oluştu'
        });
    }
}));
/**
 * GET /api/admin/bookings/search
 * Advanced booking search
 * Query params: status, customerId
 */
router.get('/bookings/search', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.searchBookings));
// ===== EQUIPMENT MANAGEMENT ROUTES =====
/**
 * GET /api/admin/equipment/search
 * Advanced equipment search
 * Query params: location, status
 */
router.get('/equipment/search', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.searchEquipment));
// ===== BUSINESS SETTINGS ROUTES =====
/**
 * GET /api/admin/settings
 * Get business settings
 */
router.get('/settings', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.getBusinessSettings));
/**
 * PUT /api/admin/settings
 * Update business settings
 */
router.put('/settings', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.updateBusinessSettings));
// ===== BULK OPERATIONS ROUTES =====
/**
 * POST /api/admin/bulk/execute
 * Execute bulk operation
 * Body: BulkOperationRequest
 */
router.post('/bulk/execute', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.executeBulkOperation));
/**
 * POST /api/admin/bulk/customers
 * Bulk customer operations
 * Body: { operation, customerIds, data, options }
 */
router.post('/bulk/customers', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.bulkCustomerOperations));
/**
 * POST /api/admin/bulk/bookings
 * Bulk booking operations
 * Body: { operation, bookingIds, data, options }
 */
router.post('/bulk/bookings', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.bulkBookingOperations));
/**
 * POST /api/admin/bulk/services
 * Bulk service operations
 * Body: { operation, serviceIds, data, options }
 */
router.post('/bulk/services', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.bulkServiceOperations));
/**
 * POST /api/admin/bulk/equipment
 * Bulk equipment operations
 * Body: { operation, equipmentIds, data, options }
 */
router.post('/bulk/equipment', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.bulkEquipmentOperations));
/**
 * POST /api/admin/bulk/users
 * Bulk user operations
 * Body: { operation, userIds, data, options }
 */
router.post('/bulk/users', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.bulkUserOperations));
/**
 * GET /api/admin/bulk/status/:operationId
 * Get bulk operation status
 */
router.get('/bulk/status/:operationId', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.getBulkOperationStatus));
/**
 * POST /api/admin/bulk/cancel/:operationId
 * Cancel bulk operation
 */
router.post('/bulk/cancel/:operationId', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.cancelBulkOperation));
/**
 * GET /api/admin/bulk/history
 * Get bulk operation history
 * Query params: page, limit, entityType, operation, status, userId
 */
router.get('/bulk/history', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(bulkController.getBulkOperationHistory));
// ===== EXPORT/IMPORT ROUTES =====
/**
 * GET /api/admin/export/services
 * Export services data (CSV/PDF)
 * Query params: format (csv|pdf)
 */
router.get('/export/services', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.exportServices));
/**
 * GET /api/admin/export/bookings
 * Export bookings data (CSV/PDF)
 * Query params: format (csv|pdf), dateFrom, dateTo, status
 */
router.get('/export/bookings', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.exportBookings));
/**
 * GET /api/admin/export/equipment
 * Export equipment data (CSV/PDF)
 * Query params: format (csv|pdf), location, status
 */
router.get('/export/equipment', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.exportEquipment));
/**
 * POST /api/admin/import/services
 * Import services data (CSV upload)
 * Body: multipart/form-data with file upload
 */
router.post('/import/services', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.importServices));
/**
 * POST /api/admin/import/bookings
 * Import bookings data (CSV upload)
 * Body: multipart/form-data with file upload
 */
router.post('/import/bookings', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.importBookings));
/**
 * POST /api/admin/import/equipment
 * Import equipment data (CSV upload)
 * Body: multipart/form-data with file upload
 */
router.post('/import/equipment', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_2.importEquipment));
// ===== SMS MANAGEMENT ROUTES =====
/**
 * GET /api/admin/sms/dashboard
 * Get SMS dashboard overview
 */
router.get('/sms/dashboard', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.getDashboardOverview));
/**
 * GET /api/admin/sms/statistics
 * Get SMS statistics with filtering
 * Query params: startDate, endDate, messageType, status, groupBy
 */
router.get('/sms/statistics', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.getSMSStatistics));
/**
 * POST /api/admin/sms/test
 * Send test SMS
 * Body: { phoneNumber, message, templateType }
 */
router.post('/sms/test', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.sendTestSMS));
/**
 * POST /api/admin/sms/bulk
 * Send bulk SMS
 * Body: { phoneNumbers, message, templateType, scheduledAt }
 */
router.post('/sms/bulk', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.sendBulkSMS));
/**
 * GET /api/admin/sms/templates
 * Get all SMS templates
 */
router.get('/sms/templates', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.getSMSTemplates));
/**
 * POST /api/admin/sms/templates
 * Create/Update SMS template
 * Body: { templateId?, name, content, variables, isActive }
 */
router.post('/sms/templates', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.saveSMSTemplate));
/**
 * DELETE /api/admin/sms/templates/:templateId
 * Delete SMS template
 */
router.delete('/sms/templates/:templateId', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.deleteSMSTemplate));
/**
 * GET /api/admin/sms/account
 * Get SMS account info (balance, usage, limits)
 */
router.get('/sms/account', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.getAccountInfo));
/**
 * GET /api/admin/sms/reports
 * Get SMS delivery reports
 * Query params: startDate, endDate, status, phoneNumber, page, limit
 */
router.get('/sms/reports', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.getDeliveryReports));
/**
 * GET /api/admin/sms/export
 * Export SMS data
 * Query params: startDate, endDate, format, type
 */
router.get('/sms/export', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.exportSMSData));
/**
 * POST /api/admin/sms/alerts
 * Set SMS alerts and notifications
 * Body: { alertType, threshold, enabled, recipients }
 */
router.post('/sms/alerts', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(smsController.setSMSAlerts));
// ===== HEALTH CHECK ROUTE =====
/**
 * GET /api/admin/health
 * Health check endpoint for admin API
 */
router.get('/health', (0, asyncHandler_1.asyncHandler)((req, res) => {
    res.json({
        success: true,
        message: 'Admin API is healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        user: req.user?.uid || 'unknown'
    });
}));
exports.default = router;
// ===== ANALYTICS & METRICS ROUTES =====
/**
 * GET /api/admin/analytics/revenue
 * Get revenue analytics
 * Query: period=week|month|year
 */
router.get('/analytics/revenue', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_1.getRevenueAnalytics));
/**
 * GET /api/admin/analytics/services
 * Get service performance analytics
 * Query: period=week|month|year
 */
router.get('/analytics/services', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_1.getServicePerformance));
/**
 * GET /api/admin/metrics
 * Get business metrics
 */
router.get('/metrics', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(adminController_1.getBusinessMetrics));
//# sourceMappingURL=adminRoutes.js.map