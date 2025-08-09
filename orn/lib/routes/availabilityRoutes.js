"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Availability Routes
 *
 * Defines API endpoints for checking and managing service availability.
 *
 * @version 2.0.0
 */
const express_1 = require("express");
const availabilityController_1 = require("../controllers/availabilityController");
const router = (0, express_1.Router)();
// Public route to check availability
router.get('/', availabilityController_1.getAvailability);
// TODO: Add admin routes for managing availability slots if needed
exports.default = router;
//# sourceMappingURL=availabilityRoutes.js.map