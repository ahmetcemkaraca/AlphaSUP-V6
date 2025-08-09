"use strict";
/**
 * Customer Equipment Routes
 * Routes for customer-facing equipment operations
 *
 * Task 5: Equipment Management Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const equipmentController_1 = require("../controllers/equipmentController");
const asyncHandler_1 = require("../middleware/asyncHandler");
const auditLog_1 = require("../middleware/auditLog");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/equipment/available
 * Get available equipment for customers
 * Query params: location, type, date
 */
router.get('/available', (0, asyncHandler_1.asyncHandler)(equipmentController_1.getAvailableEquipment));
/**
 * GET /api/v1/equipment/types
 * Get equipment types and categories
 * Public endpoint - no authentication required
 */
router.get('/types', (0, asyncHandler_1.asyncHandler)(equipmentController_1.getEquipmentTypes));
/**
 * GET /api/v1/equipment/recommendations
 * Get equipment recommendations based on customer preferences
 * Public endpoint - works better with authentication but not required
 */
router.get('/recommendations', auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(equipmentController_1.getEquipmentRecommendations));
router.get('/:id/specs', authMiddleware_1.protect, auditLog_1.auditLog, (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    await (0, equipmentController_1.getEquipmentSpecs)(req, res, next);
}));
exports.default = router;
//# sourceMappingURL=equipmentRoutes.js.map