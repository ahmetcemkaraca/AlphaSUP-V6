"use strict";
/**
 * SMS Routes
 * AlphaSUP - Phase 7 SMS Integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
const authMiddleware = new auth_1.default();
// SMS gönderimi endpoint'i
router.post('/send', authMiddleware.authenticate, controllers_1.sendSMSController);
// SMS durum sorgulama
router.get('/status/:messageId', authMiddleware.authenticate, controllers_1.getSMSStatusController);
// Toplu SMS gönderimi (admin only)
router.post('/bulk', authMiddleware.requireAdmin, controllers_1.sendBulkSMSController);
// SMS şablonları listesi
router.get('/templates', authMiddleware.authenticate, async (_req, res) => {
    try {
        console.log('🚧 [SMS API] Şablon listesi getirme - Phase 7 Implementation');
        // TODO: Implement template listing
        res.json({
            success: true,
            templates: [
                {
                    id: 'booking_confirmation_tr',
                    type: 'booking_confirmation',
                    language: 'tr',
                    title: 'Rezervasyon Onayı',
                },
                {
                    id: 'booking_reminder_tr',
                    type: 'booking_reminder',
                    language: 'tr',
                    title: 'Rezervasyon Hatırlatması',
                },
            ],
        });
    }
    catch (error) {
        console.error('SMS şablon listesi hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Şablon listesi alınamadı',
        });
    }
});
// Müşteri SMS tercihlerini güncelle
router.put('/preferences/:customerId', authMiddleware.authenticate, async (req, res) => {
    try {
        console.log('🚧 [SMS API] Müşteri tercihleri güncelleme - Phase 7 Implementation');
        const { customerId } = req.params;
        const preferences = req.body;
        // TODO: Implement preference update in Firestore
        console.log('Güncellenen tercihler:', { customerId, preferences });
        res.json({
            success: true,
            message: 'Tercihler güncellendi',
        });
    }
    catch (error) {
        console.error('SMS tercih güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Tercihler güncellenemedi',
        });
    }
});
// SMS istatistikleri (admin only)
router.get('/analytics', authMiddleware.requireAdmin, async (_req, res) => {
    try {
        console.log('🚧 [SMS API] SMS istatistikleri - Phase 7 Implementation');
        // TODO: Implement SMS analytics from Firestore
        res.json({
            success: true,
            analytics: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0,
                deliveryRate: 0,
                totalCost: 0,
            },
        });
    }
    catch (error) {
        console.error('SMS istatistik hatası:', error);
        res.status(500).json({
            success: false,
            error: 'İstatistikler alınamadı',
        });
    }
});
exports.default = router;
//# sourceMappingURL=sms.js.map