"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const booking_1 = require("../types/booking");
const router = (0, express_1.Router)();
const auth = new auth_1.AuthMiddleware();
const db = firebase_admin_1.default.firestore();
// POST /api/v1/bookings - create booking (server-side validation placeholder)
router.post('/', auth.authenticate, async (req, res) => {
    try {
        const { serviceId, dateISO, time, people, boardType, extras, totalTRY } = req.body || {};
        if (!serviceId || !dateISO || !time || !people || !totalTRY) {
            return res
                .status(400)
                .json({ success: false, error: 'Missing required fields' });
        }
        const payload = {
            serviceId: String(serviceId),
            dateISO: String(dateISO),
            time: String(time),
            people: Number(people),
            boardType: boardType ? String(boardType) : undefined,
            extras: Array.isArray(extras)
                ? extras.map((e) => String(e))
                : undefined,
            totalTRY: Number(totalTRY),
            status: booking_1.BookingStatus.PENDING,
            customerId: req.user?.uid || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const ref = await db.collection('bookings').add(payload);
        const doc = await ref.get();
        res.status(201).json({ success: true, data: { id: doc.id, ...doc.data() } });
    }
    catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, error: error?.message || 'ERROR' });
    }
});
// GET /api/v1/bookings/:id - get booking (owner or admin)
router.get('/:id', auth.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('bookings').doc(id).get();
        if (!doc.exists)
            return res.status(404).json({ success: false, error: 'NOT_FOUND' });
        const data = doc.data();
        if (data.customerId && data.customerId !== req.user.uid && !req.user.isAdmin) {
            return res.status(403).json({ success: false, error: 'FORBIDDEN' });
        }
        res.status(200).json({ success: true, data: { id: doc.id, ...data } });
    }
    catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ success: false, error: error?.message || 'ERROR' });
    }
});
exports.default = router;
//# sourceMappingURL=bookings.js.map