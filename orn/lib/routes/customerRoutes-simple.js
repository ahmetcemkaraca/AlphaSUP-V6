"use strict";
/**
 * Customer Routes - Simplified
 * Basic customer endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const router = express_1.default.Router();
// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'customer-api' });
});
// Profile endpoints (mock for now)
router.get('/profile', (req, res) => {
    res.json({
        success: true,
        data: {
            id: 'customer-1',
            name: 'Test Customer',
            email: 'test@example.com'
        }
    });
});
exports.default = router;
//# sourceMappingURL=customerRoutes-simple.js.map