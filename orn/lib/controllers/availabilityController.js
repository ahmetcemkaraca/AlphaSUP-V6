"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = void 0;
const firebase_1 = require("../config/firebase");
// --- Get availability for a service on a given date ---
const getAvailability = async (req, res, next) => {
    try {
        const { serviceId, date } = req.query;
        if (!serviceId || !date) {
            res.status(400).send('serviceId and date are required query parameters.');
            return;
        }
        // This is a simplified example. A real implementation would be more complex.
        // It should check existing bookings and capacity for the given service and date.
        const slotsSnapshot = await firebase_1.db.collection('availabilitySlots')
            .where('serviceId', '==', serviceId)
            .where('date', '==', date)
            .get();
        if (slotsSnapshot.empty) {
            // If no specific slots are defined, we might assume general availability
            // based on service settings, or return no slots.
            res.status(200).json([]);
            return;
        }
        const slots = slotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Here you would typically cross-reference with the 'bookings' collection
        // to calculate remaining capacity for each slot.
        res.status(200).json(slots);
    }
    catch (error) {
        console.error('Error getting availability:', error);
        res.status(500).send('Error getting availability');
    }
};
exports.getAvailability = getAvailability;
//# sourceMappingURL=availabilityController.js.map