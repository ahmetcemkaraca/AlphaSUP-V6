"use strict";
/**
 * Availability Service
 * Handles service availability calculations and booking conflicts
 *
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableDates = exports.canMakeBooking = exports.checkServiceAvailability = void 0;
const firebase_1 = require("../config/firebase");
/**
 * Check service availability for a specific date
 */
const checkServiceAvailability = async (serviceId, date) => {
    try {
        // Get service details
        const serviceDoc = await firebase_1.db.collection('services').doc(serviceId).get();
        if (!serviceDoc.exists) {
            throw new Error('Service not found');
        }
        const service = serviceDoc.data();
        const maxCapacity = service?.['maxCapacity'] || 10;
        // Get existing bookings for this date
        const bookingsSnapshot = await firebase_1.db
            .collection('bookings')
            .where('serviceId', '==', serviceId)
            .where('date', '==', date)
            .where('status', 'in', ['confirmed', 'pending'])
            .get();
        // Calculate booked capacity per time slot
        const bookedSlots = new Map();
        bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();
            const timeSlot = booking['timeSlot'] || '09:00';
            const participants = booking['participantCount'] || 1;
            bookedSlots.set(timeSlot, (bookedSlots.get(timeSlot) || 0) + participants);
        });
        // Generate time slots
        const defaultTimeSlots = ['09:00', '11:00', '14:00', '16:00'];
        const timeSlots = defaultTimeSlots.map(time => {
            const booked = bookedSlots.get(time) || 0;
            const available = Math.max(0, maxCapacity - booked);
            return {
                time,
                available: available > 0,
                capacity: maxCapacity,
                bookedCapacity: booked,
                availableCapacity: available
            };
        });
        const totalCapacity = timeSlots.reduce((sum, slot) => sum + slot.capacity, 0);
        const totalBooked = timeSlots.reduce((sum, slot) => sum + slot.bookedCapacity, 0);
        const totalAvailable = timeSlots.reduce((sum, slot) => sum + slot.availableCapacity, 0);
        return {
            serviceId,
            date,
            timeSlots,
            totalCapacity,
            totalBooked,
            totalAvailable
        };
    }
    catch (error) {
        console.error('Error checking service availability:', error);
        throw new Error('Failed to check service availability');
    }
};
exports.checkServiceAvailability = checkServiceAvailability;
/**
 * Check if a booking can be made
 */
const canMakeBooking = async (serviceId, date, timeSlot, participantCount) => {
    try {
        const availability = await (0, exports.checkServiceAvailability)(serviceId, date);
        const slot = availability.timeSlots.find(s => s.time === timeSlot);
        if (!slot) {
            return { canBook: false, reason: 'Invalid time slot' };
        }
        if (slot.availableCapacity < participantCount) {
            return {
                canBook: false,
                reason: `Not enough capacity. Available: ${slot.availableCapacity}, Requested: ${participantCount}`
            };
        }
        return { canBook: true };
    }
    catch (error) {
        console.error('Error checking booking availability:', error);
        return { canBook: false, reason: 'System error while checking availability' };
    }
};
exports.canMakeBooking = canMakeBooking;
/**
 * Get available dates for a service
 */
const getAvailableDates = async (serviceId, startDate, endDate) => {
    try {
        const availableDates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0] ?? '';
            // Skip past dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (currentDate >= today && dateStr) {
                const availability = await (0, exports.checkServiceAvailability)(serviceId, dateStr);
                if (availability.totalAvailable > 0 &&
                    availability.timeSlots.some((slot) => slot.available)) {
                    availableDates.push(dateStr);
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return availableDates;
    }
    catch (error) {
        console.error('Error getting available dates:', error);
        return [];
    }
};
exports.getAvailableDates = getAvailableDates;
exports.default = {
    checkServiceAvailability: exports.checkServiceAvailability,
    canMakeBooking: exports.canMakeBooking,
    getAvailableDates: exports.getAvailableDates
};
//# sourceMappingURL=availabilityService.js.map