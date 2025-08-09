"use strict";
/**
 * Payment API Routes - Simplified
 * Ödeme işlemleri için API endpoint'leri
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Simple health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'Payment service is running',
        timestamp: new Date().toISOString(),
    });
});
// Basic payment endpoint placeholder
router.post('/create-intent', (req, res) => {
    res.json({
        success: true,
        message: 'Payment intent creation endpoint (to be implemented)',
        data: { paymentIntentId: 'placeholder_' + Date.now() },
    });
});
exports.default = router;
//# sourceMappingURL=payment-simple.js.map