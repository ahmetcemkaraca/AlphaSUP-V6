"use strict";
/**
 * Support Routes
 * Handles customer support ticket system
 *
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/support/health
 * Health check endpoint for support API
 */
router.get('/health', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        success: true,
        message: 'Support API is operational',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: [
            'GET /support/tickets - List support tickets',
            'POST /support/tickets - Create new support ticket',
            'GET /support/tickets/:id - Get ticket details',
            'PATCH /support/tickets/:id - Update ticket status'
        ]
    });
}));
/**
 * GET /api/v1/support/tickets
 * Get support tickets (basic implementation)
 */
router.get('/tickets', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const snapshot = await firebase_1.db
            .collection('supportTickets')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        const tickets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()['createdAt']?.toDate?.()?.toISOString(),
            updatedAt: doc.data()['updatedAt']?.toDate?.()?.toISOString()
        }));
        res.json({
            success: true,
            data: { tickets }
        });
    }
    catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Destek biletleri alınırken hata oluştu'
        });
    }
}));
/**
 * POST /api/v1/support/tickets
 * Create new support ticket
 */
router.post('/tickets', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { subject, message, priority = 'medium', category = 'general' } = req.body;
        if (!subject || !message) {
            res.status(400).json({
                success: false,
                error: 'Konu ve mesaj alanları gereklidir'
            });
            return;
        }
        const ticket = {
            subject,
            message,
            priority,
            category,
            status: 'open',
            customerId: req.user?.uid || 'anonymous',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const docRef = await firebase_1.db.collection('supportTickets').add(ticket);
        res.status(201).json({
            success: true,
            data: {
                ticketId: docRef.id,
                ...ticket,
                createdAt: ticket.createdAt.toISOString(),
                updatedAt: ticket.updatedAt.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Destek bileti oluşturulurken hata oluştu'
        });
    }
}));
/**
 * GET /api/v1/support/tickets/:id
 * Get ticket details (basic implementation)
 */
router.get('/tickets/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Destek bileti ID gereklidir'
            });
            return;
        }
        const doc = await firebase_1.db.collection('supportTickets').doc(id).get();
        if (!doc.exists) {
            res.status(404).json({
                success: false,
                error: 'Destek bileti bulunamadı'
            });
            return;
        }
        const ticket = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()?.['createdAt']?.toDate?.()?.toISOString(),
            updatedAt: doc.data()?.['updatedAt']?.toDate?.()?.toISOString()
        };
        res.json({
            success: true,
            data: { ticket }
        });
    }
    catch (error) {
        console.error('Error fetching support ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Destek bileti alınırken hata oluştu'
        });
    }
}));
exports.default = router;
//# sourceMappingURL=supportRoutes.js.map