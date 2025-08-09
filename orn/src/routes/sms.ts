/**
 * SMS Routes
 * AlphaSUP - Phase 7 SMS Integration
 */

import { Router } from 'express';
import {
  getSMSStatusController,
  sendBulkSMSController,
  sendSMSController,
} from '../controllers';
import AuthMiddleware from '../middleware/auth';

const router = Router();
const authMiddleware = new AuthMiddleware();

// SMS gönderimi endpoint'i
router.post('/send', authMiddleware.authenticate, sendSMSController);

// SMS durum sorgulama
router.get(
  '/status/:messageId',
  authMiddleware.authenticate,
  getSMSStatusController
);

// Toplu SMS gönderimi (admin only)
router.post('/bulk', authMiddleware.requireAdmin, sendBulkSMSController);

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
  } catch (error) {
    console.error('SMS şablon listesi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Şablon listesi alınamadı',
    });
  }
});

// Müşteri SMS tercihlerini güncelle
router.put(
  '/preferences/:customerId',
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      console.log(
        '🚧 [SMS API] Müşteri tercihleri güncelleme - Phase 7 Implementation'
      );

      const { customerId } = req.params;
      const preferences = req.body;

      // TODO: Implement preference update in Firestore
      console.log('Güncellenen tercihler:', { customerId, preferences });

      res.json({
        success: true,
        message: 'Tercihler güncellendi',
      });
    } catch (error) {
      console.error('SMS tercih güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        error: 'Tercihler güncellenemedi',
      });
    }
  }
);

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
  } catch (error) {
    console.error('SMS istatistik hatası:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler alınamadı',
    });
  }
});

export default router;
