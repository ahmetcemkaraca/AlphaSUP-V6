"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = require("express");
const multer_1 = tslib_1.__importDefault(require("multer"));
const bulkOperationsController_1 = require("../controllers/bulkOperationsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
/**
 * Bulk Operations Routes
 * Multi-entity batch processing endpoints
 */
const router = (0, express_1.Router)();
// Apply authentication and admin middleware to all routes
router.use(authMiddleware_1.protect);
router.use(authMiddleware_1.adminOnly);
// Initialize controller
const bulkController = new bulkOperationsController_1.BulkOperationsController();
// Configure multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/json'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
        }
    }
});
// ==================== BULK OPERATIONS ====================
// Generic bulk operation endpoint
router.post('/execute', bulkController.executeBulkOperation);
// ==================== ENTITY-SPECIFIC BULK OPERATIONS ====================
// Bulk customer operations
router.post('/customers', bulkController.bulkCustomerOperations);
// Bulk booking operations  
router.post('/bookings', bulkController.bulkBookingOperations);
// Bulk service operations
router.post('/services', bulkController.bulkServiceOperations);
// Bulk equipment operations
router.post('/equipment', bulkController.bulkEquipmentOperations);
// Bulk user operations
router.post('/users', bulkController.bulkUserOperations);
// ==================== OPERATION MANAGEMENT ====================
// Get operation status
router.get('/operations/:operationId/status', bulkController.getBulkOperationStatus);
// Cancel operation
router.delete('/operations/:operationId', bulkController.cancelBulkOperation);
// Get operation history
router.get('/operations/history', bulkController.getBulkOperationHistory);
// ==================== IMPORT OPERATIONS ====================
// Import customers from file
// @ts-ignore
router.post('/import/customers', upload.single('file'), bulkController.importCustomers);
// Import services from file
// @ts-ignore
router.post('/import/services', upload.single('file'), bulkController.importServices);
// Import equipment from file
// @ts-ignore
router.post('/import/equipment', upload.single('file'), bulkController.importEquipment);
exports.default = router;
//# sourceMappingURL=bulkOperationsRoutes.js.map