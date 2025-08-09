"use strict";
/**
 * Booking Controller
 * Handles booking-related HTTP requests with enhanced payment options
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = exports.processRemainingPayment = exports.getBookingById = exports.createBooking = exports.BookingStatus = void 0;
const firebase_1 = require("../config/firebase");
const db = firebase_1.admin.firestore();
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
// Simple validation function for booking data
const validateBookingData = (data) => {
    if (!data.serviceId)
        return 'Service ID is required';
    if (!data.customerInfo && !data.customerId)
        return 'Customer information is required';
    if (!data.participants || data.participants < 1)
        return 'Participant count must be at least 1';
    if (!data.totalAmount || data.totalAmount <= 0)
        return 'Total amount must be greater than 0';
    return null;
};
// --- Create new booking ---
const createBooking = async (req, res, next) => {
    try {
        const bookingData = req.body;
        console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
        // Validate booking data
        const validationError = validateBookingData(bookingData);
        if (validationError) {
            console.error('Booking validation failed:', validationError);
            res.status(400).json({
                success: false,
                error: validationError
            });
            return;
        }
        // Determine payment type and calculate amounts
        const paymentInfo = calculatePaymentInfo(bookingData);
        // Add timestamps and system fields
        const now = firebase_1.admin.firestore.FieldValue.serverTimestamp();
        const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const enhancedBookingData = {
            ...bookingData,
            id: bookingId,
            status: paymentInfo.type === 'full' ? 'confirmed' : 'pending_payment',
            paymentStatus: paymentInfo.type === 'full' ? 'completed' : 'partial',
            paymentInfo,
            createdAt: now,
            updatedAt: now,
            // Ensure customer data is properly structured
            customer: {
                id: bookingData.customerInfo?.id || `customer-${Date.now()}`,
                firstName: bookingData.customerInfo?.firstName,
                lastName: bookingData.customerInfo?.lastName,
                email: bookingData.customerInfo?.email,
                phone: bookingData.customerInfo?.phone,
                emergencyContact: bookingData.customerInfo?.emergencyContact
            }
        };
        // Save to Firestore with explicit document ID
        await db.collection('bookings').doc(bookingId).set(enhancedBookingData);
        console.log('Booking saved to Firestore:', bookingId);
        // Also create customer record if not exists
        if (enhancedBookingData.customer) {
            const customerRef = db.collection('customers').doc(enhancedBookingData.customer.id);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                await customerRef.set({
                    ...enhancedBookingData.customer,
                    bookingHistory: [bookingId],
                    createdAt: now,
                    updatedAt: now
                });
                console.log('Customer record created:', enhancedBookingData.customer.id);
            }
            else {
                // Update booking history
                await customerRef.update({
                    bookingHistory: firebase_1.admin.firestore.FieldValue.arrayUnion(bookingId),
                    updatedAt: now
                });
                console.log('Customer booking history updated:', enhancedBookingData.customer.id);
            }
        }
        // Create payment record
        if (bookingData.paymentData) {
            const paymentId = `payment-${Date.now()}`;
            const paymentRecord = {
                id: paymentId,
                bookingId,
                customerId: enhancedBookingData.customer.id,
                amount: paymentInfo.paidAmount,
                currency: 'TRY',
                type: paymentInfo.type,
                status: 'completed',
                createdAt: now,
                updatedAt: now
            };
            // Only add stripePaymentIntentId if it exists
            if (bookingData.paymentData.paymentIntentId || bookingData.paymentData.stripePaymentIntentId) {
                paymentRecord.stripePaymentIntentId = bookingData.paymentData.paymentIntentId || bookingData.paymentData.stripePaymentIntentId;
            }
            await db.collection('payments').doc(paymentId).set(paymentRecord);
            console.log('Payment record created:', paymentId);
        }
        // Return created booking
        const responseData = {
            success: true,
            id: bookingId,
            data: enhancedBookingData,
            message: 'Booking created successfully'
        };
        console.log('Booking creation successful:', bookingId);
        res.status(201).json(responseData);
    }
    catch (error) {
        console.error('Error creating booking:', error);
        next(error);
    }
};
exports.createBooking = createBooking;
// --- Get booking by ID ---
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Booking ID is required'
            });
            return;
        }
        console.log('Fetching booking:', id);
        const bookingDoc = await db.collection('bookings').doc(id).get();
        if (!bookingDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
            return;
        }
        const bookingData = bookingDoc.data();
        res.json({
            success: true,
            data: {
                id: bookingDoc.id,
                ...bookingData
            }
        });
    }
    catch (error) {
        console.error('Error fetching booking:', error);
        next(error);
    }
};
exports.getBookingById = getBookingById;
// --- Process remaining payment ---
const processRemainingPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentIntentId, amount } = req.body;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Booking ID is required'
            });
            return;
        }
        console.log('Processing remaining payment for booking:', id);
        // Get booking
        const bookingRef = db.collection('bookings').doc(id);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
            return;
        }
        const bookingData = bookingDoc.data();
        // Update booking payment status
        await bookingRef.update({
            paymentStatus: 'completed',
            status: 'confirmed',
            'paymentInfo.remainingAmount': 0,
            'paymentInfo.paidAmount': bookingData?.paymentInfo?.totalAmount || amount,
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp()
        });
        // Create payment record for remaining payment
        const paymentId = `payment-${Date.now()}`;
        await db.collection('payments').doc(paymentId).set({
            id: paymentId,
            bookingId: id,
            customerId: bookingData?.customer?.id,
            amount,
            currency: 'TRY',
            type: 'remaining',
            status: 'completed',
            stripePaymentIntentId: paymentIntentId,
            createdAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Remaining payment processed successfully'
        });
    }
    catch (error) {
        console.error('Error processing remaining payment:', error);
        next(error);
    }
};
exports.processRemainingPayment = processRemainingPayment;
// --- Helper function to calculate payment info ---
function calculatePaymentInfo(bookingData) {
    const totalAmount = bookingData.pricing?.total || bookingData.totalAmount || 0;
    const paymentType = bookingData.paymentData?.type || 'full';
    switch (paymentType) {
        case 'deposit':
            const depositAmount = Math.round(totalAmount * 0.3); // 30% deposit
            return {
                type: 'deposit',
                amount: totalAmount,
                currency: 'TRY',
                paidAmount: depositAmount,
                remainingAmount: totalAmount - depositAmount,
                totalAmount: totalAmount,
                dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now
            };
        case 'full':
        default:
            return {
                type: 'full',
                amount: totalAmount,
                currency: 'TRY',
                paidAmount: totalAmount,
                remainingAmount: 0,
                totalAmount: totalAmount
            };
    }
}
// --- Update booking status (Admin only) ---
const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Booking ID is required'
            });
            return;
        }
        await db.collection('bookings').doc(id).update({
            status,
            adminNotes,
            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({
            success: true,
            message: 'Booking status updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating booking status:', error);
        next(error);
    }
};
exports.updateBookingStatus = updateBookingStatus;
//# sourceMappingURL=bookingController.js.map