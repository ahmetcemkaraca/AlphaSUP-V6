"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentType = exports.BookingStatus = void 0;
exports.validateBookingData = validateBookingData;
exports.validatePaymentType = validatePaymentType;
exports.validateBookingStatus = validateBookingStatus;
exports.calculateDepositAmount = calculateDepositAmount;
exports.calculateRemainingAmount = calculateRemainingAmount;
exports.generatePaymentDueDate = generatePaymentDueDate;
// Local type definitions for validation
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["DEPOSIT"] = "deposit";
    PaymentType["FULL"] = "full";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
function validateBookingData(data) {
    const errors = [];
    // Validate required fields
    if (!data.customerId) {
        errors.push('Customer ID is required');
    }
    if (!data.serviceId) {
        errors.push('Service ID is required');
    }
    if (!data.date) {
        errors.push('Date is required');
    }
    else {
        const bookingDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
            errors.push('Booking date cannot be in the past');
        }
    }
    if (!data.timeSlot) {
        errors.push('Time slot is required');
    }
    if (!data.participantCount || data.participantCount < 1) {
        errors.push('Participant count must be at least 1');
    }
    if (!data.totalAmount || data.totalAmount <= 0) {
        errors.push('Total amount must be greater than 0');
    }
    // Validate participant count limit
    if (data.participantCount > 20) {
        errors.push('Participant count cannot exceed 20');
    }
    // Validate time slot format (HH:MM)
    if (data.timeSlot && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.timeSlot)) {
        errors.push('Invalid time slot format. Use HH:MM format');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
function validatePaymentType(paymentType) {
    return Object.values(PaymentType).includes(paymentType);
}
function validateBookingStatus(status) {
    return Object.values(BookingStatus).includes(status);
}
function calculateDepositAmount(totalAmount, depositPercentage = 30) {
    return Math.round((totalAmount * depositPercentage) / 100);
}
function calculateRemainingAmount(totalAmount, depositAmount) {
    return totalAmount - depositAmount;
}
function generatePaymentDueDate(hoursFromNow = 12) {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + hoursFromNow);
    return dueDate;
}
//# sourceMappingURL=validation.js.map