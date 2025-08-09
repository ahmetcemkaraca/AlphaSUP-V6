"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = (0, express_1.Router)();
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
function generateSampleSlots() {
    const slots = [];
    for (let h = 9; h <= 18; h++) {
        slots.push({ time: `${pad(h)}:00`, capacity: 8, booked: 0 });
    }
    return slots;
}
/**
 * GET /api/availability
 * Query: date=YYYY-MM-DD&serviceId=<id>
 */
router.get('/', async (req, res) => {
    try {
        const date = req.query.date || '';
        const serviceId = req.query.serviceId || '';
        if (!date || !serviceId) {
            res.status(400).json({
                success: false,
                error: 'Missing required query params',
                message: 'Provide date=YYYY-MM-DD and serviceId',
            });
            return;
        }
        const db = firebase_admin_1.default.firestore();
        const docId = `${date}_${serviceId}`;
        const doc = await db.collection('availability').doc(docId).get();
        if (doc.exists) {
            const data = doc.data() || {};
            res.status(200).json({
                success: true,
                data: {
                    id: doc.id,
                    dateISO: date,
                    serviceId,
                    slots: data.slots || [],
                },
                source: 'firestore',
            });
            return;
        }
        // Fallback to generated sample slots
        res.status(200).json({
            success: true,
            data: {
                id: docId,
                dateISO: date,
                serviceId,
                slots: generateSampleSlots(),
            },
            source: 'mock-fallback',
        });
    }
    catch (error) {
        console.error('❌ Error fetching availability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch availability',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=availability.js.map