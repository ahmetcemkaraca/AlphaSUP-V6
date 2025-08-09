"use strict";
/**
 * Service Routes
 * Customer-facing service operations with full implementation
 *
 * @version 3.0.0
 * @requires Express.js Router
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const serviceController_1 = require("../controllers/serviceController");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/services/health
 * Health check endpoint for service API
 */
router.get('/health', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Service API is fully operational',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        endpoints: [
            'GET /services - List all services with filtering',
            'GET /services/featured - Get featured services',
            'GET /services/categories - Get service categories',
            'GET /services/search - Search services',
            'GET /services/:id - Get service by ID',
            'GET /services/:id/availability - Get service availability',
            'GET /services/:id/pricing - Get service pricing'
        ]
    });
}));
// Service listing and filtering
router.get('/featured', (0, asyncHandler_1.asyncHandler)(serviceController_1.getFeaturedServices));
router.get('/categories', (0, asyncHandler_1.asyncHandler)(serviceController_1.getServiceCategories));
router.get('/search', (0, asyncHandler_1.asyncHandler)(serviceController_1.searchServices));
// Service details and operations
router.get('/:id/availability', (0, asyncHandler_1.asyncHandler)(serviceController_1.getServiceAvailability));
router.get('/:id/pricing', (0, asyncHandler_1.asyncHandler)(serviceController_1.getServicePricing));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(serviceController_1.getServiceById));
// Main service listing (must be last to avoid route conflicts)
router.get('/', (0, asyncHandler_1.asyncHandler)(serviceController_1.getServices));
exports.default = router;
//# sourceMappingURL=serviceRoutes.js.map