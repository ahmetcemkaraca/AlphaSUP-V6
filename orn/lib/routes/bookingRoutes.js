"use strict";
/**
 * Booking Routes
 * Enhanced CRUD API for booking management with payment integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const bookingController_1 = require("../controllers/bookingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all bookings (admin only) or user's own bookings
router.get('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const { role, uid } = req.user;
        let ref = firebase_1.db.collection('bookings');
        let snapshot;
        if (role === 'admin' || role === 'editor') {
            // Admin can see all bookings
            snapshot = await ref.orderBy('createdAt', 'desc').get();
        }
        else {
            // Regular users see only their bookings
            snapshot = await ref.where('customer.id', '==', uid).orderBy('createdAt', 'desc').get();
        }
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: bookings });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Create new booking (public endpoint - no auth required for customer bookings)
router.post('/', bookingController_1.createBooking);
// Get specific booking (using enhanced controller)
router.get('/:id', bookingController_1.getBookingById);
// Process remaining payment for deposit bookings
router.post('/:id/payment/remaining', bookingController_1.processRemainingPayment);
// Update booking status (admin only, using enhanced controller)
router.put('/:id/status', authMiddleware_1.protect, authMiddleware_1.adminOnly, bookingController_1.updateBookingStatus);
// Cancel booking
router.delete('/:id', authMiddleware_1.protect, async (req, res) => {
    try {
        const { role, uid } = req.user;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, error: 'Booking ID is required' });
            return;
        }
        const bookingDoc = await firebase_1.db.collection('bookings').doc(id).get();
        if (!bookingDoc.exists) {
            res.status(404).json({ success: false, error: 'Booking not found' });
            return;
        }
        const booking = bookingDoc.data();
        // Check permission
        if (role !== 'admin' && role !== 'editor' && booking?.customer?.id !== uid) {
            res.status(403).json({ success: false, error: 'Access denied' });
            return;
        }
        // Update booking status
        await firebase_1.db.collection('bookings').doc(id).update({
            status: 'cancelled',
            updatedAt: new Date().toISOString()
        });
        // Release reserved boards
        if (booking?.selectedBoards) {
            const batch = firebase_1.db.batch();
            booking.selectedBoards.forEach((boardId) => {
                const boardRef = firebase_1.db.collection('boards').doc(boardId);
                batch.update(boardRef, {
                    status: 'available',
                    reservedBy: null,
                    reservedAt: null
                });
            });
            await batch.commit();
        }
        res.json({ success: true, message: 'Booking cancelled successfully' });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Get board availability (moved to /api/v1/boards/availability)
// This endpoint is now handled by boards routes
// Get pending payments (for customers with deposit bookings)
router.get('/payments/pending', authMiddleware_1.protect, async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await firebase_1.db.collection('bookings')
            .where('customer.id', '==', uid)
            .where('paymentStatus', '==', 'partial')
            .get();
        const pendingPayments = snapshot.docs.map(doc => {
            const booking = doc.data();
            return {
                id: doc.id,
                serviceName: booking.serviceName,
                totalAmount: booking.paymentInfo?.totalAmount || booking.totalAmount,
                paidAmount: booking.paymentInfo?.paidAmount || 0,
                remainingAmount: booking.paymentInfo?.remainingAmount || 0,
                dueDate: booking.paymentInfo?.dueDate,
                createdAt: booking.createdAt
            };
        });
        res.json({ success: true, data: pendingPayments });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map