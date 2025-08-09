"use strict";
/**
 * Customer Stats Controller
 * Handles customer statistics, upcoming bookings, and recent activity
 *
 * @version 1.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivity = exports.getUpcomingBookings = exports.getCustomerStats = void 0;
const firebase_1 = require("../config/firebase");
/**
 * Get customer statistics
 * GET /api/v1/customers/stats
 */
const getCustomerStats = async (req, res, next) => {
    try {
        const customerId = req.user?.uid;
        if (!customerId) {
            res.status(401).json({ success: false, error: 'Müşteri ID bulunamadı' });
            return;
        }
        // Get total bookings count
        const bookingsSnapshot = await firebase_1.db
            .collection('bookings')
            .where('customerId', '==', customerId)
            .get();
        const totalBookings = bookingsSnapshot.size;
        const confirmedBookings = bookingsSnapshot.docs.filter(doc => doc.data()['status'] === 'confirmed').length;
        // Get total spent amount
        let totalSpent = 0;
        let loyaltyPoints = 0;
        bookingsSnapshot.docs.forEach(doc => {
            const booking = doc.data();
            if (booking['status'] === 'confirmed') {
                totalSpent += booking['totalAmount'] || 0;
            }
        });
        // Get customer loyalty data
        const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
        const customerData = customerDoc.data();
        if (customerData) {
            loyaltyPoints = customerData['loyaltyPoints'] || 0;
        }
        // Get recent bookings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBookingsSnapshot = await firebase_1.db
            .collection('bookings')
            .where('customerId', '==', customerId)
            .where('createdAt', '>=', thirtyDaysAgo)
            .get();
        const recentBookingsCount = recentBookingsSnapshot.size;
        const stats = {
            totalBookings,
            confirmedBookings,
            recentBookingsCount,
            totalSpent,
            loyaltyPoints,
            memberSince: customerData?.['createdAt']?.toDate?.()?.toISOString() || null,
            averageBookingValue: confirmedBookings > 0 ? Math.round(totalSpent / confirmedBookings) : 0
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting customer stats:', error);
        next(error);
    }
};
exports.getCustomerStats = getCustomerStats;
/**
 * Get upcoming bookings
 * GET /api/v1/customers/bookings/upcoming
 */
const getUpcomingBookings = async (req, res, next) => {
    try {
        const customerId = req.user?.uid;
        if (!customerId) {
            res.status(401).json({ success: false, error: 'Müşteri ID bulunamadı' });
            return;
        }
        const now = new Date();
        const snapshot = await firebase_1.db
            .collection('bookings')
            .where('customerId', '==', customerId)
            .where('bookingDate', '>=', now)
            .where('status', 'in', ['confirmed', 'pending'])
            .orderBy('bookingDate', 'asc')
            .limit(5)
            .get();
        const upcomingBookings = await Promise.all(snapshot.docs.map(async (doc) => {
            const booking = doc.data();
            // Get service details
            let serviceName = 'Bilinmeyen Servis';
            if (booking['serviceId']) {
                const serviceDoc = await firebase_1.db.collection('services').doc(booking['serviceId']).get();
                if (serviceDoc.exists) {
                    serviceName = serviceDoc.data()?.['name'] || serviceName;
                }
            }
            return {
                id: doc.id,
                serviceName,
                bookingDate: booking['bookingDate']?.toDate?.()?.toISOString() || '',
                timeSlot: booking['timeSlot'] || '',
                participants: booking['participants'] || 1,
                totalAmount: booking['totalAmount'] || 0,
                status: booking['status'] || 'unknown',
                bookingNumber: booking['bookingNumber'] || doc.id.substring(0, 8).toUpperCase()
            };
        }));
        res.json({
            success: true,
            data: { upcomingBookings }
        });
    }
    catch (error) {
        console.error('Error getting upcoming bookings:', error);
        next(error);
    }
};
exports.getUpcomingBookings = getUpcomingBookings;
/**
 * Get recent activity
 * GET /api/v1/customers/activity/recent
 */
const getRecentActivity = async (req, res, next) => {
    try {
        const customerId = req.user?.uid;
        if (!customerId) {
            res.status(401).json({ success: false, error: 'Müşteri ID bulunamadı' });
            return;
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // Get recent bookings
        const bookingsSnapshot = await firebase_1.db
            .collection('bookings')
            .where('customerId', '==', customerId)
            .where('createdAt', '>=', thirtyDaysAgo)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        // Get recent notifications
        const notificationsSnapshot = await firebase_1.db
            .collection('notifications')
            .where('customerId', '==', customerId)
            .where('createdAt', '>=', thirtyDaysAgo)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        const recentBookings = await Promise.all(bookingsSnapshot.docs.map(async (doc) => {
            const booking = doc.data();
            let serviceName = 'Bilinmeyen Servis';
            if (booking['serviceId']) {
                const serviceDoc = await firebase_1.db.collection('services').doc(booking['serviceId']).get();
                if (serviceDoc.exists) {
                    serviceName = serviceDoc.data()?.['name'] || serviceName;
                }
            }
            const status = booking['status'] || 'unknown';
            return {
                id: doc.id,
                type: 'booking',
                action: status === 'confirmed' ? 'created' : status,
                description: `${serviceName} için rezervasyon ${status === 'confirmed' ? 'oluşturuldu' : status}`,
                date: booking['createdAt']?.toDate?.()?.toISOString() || '',
                amount: booking['totalAmount'] || 0,
                relatedBookingId: doc.id,
                relatedServiceId: booking['serviceId'] || undefined
            };
        }));
        const recentNotifications = notificationsSnapshot.docs.map(doc => {
            const notification = doc.data();
            return {
                id: doc.id,
                type: 'notification',
                action: 'received',
                description: notification['message'] || 'Bildirim alındı',
                date: notification['createdAt']?.toDate?.()?.toISOString() || ''
            };
        });
        // Combine and sort by date
        const allActivity = [...recentBookings, ...recentNotifications]
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
            .slice(0, 15);
        res.json({
            success: true,
            data: { recentActivity: allActivity }
        });
    }
    catch (error) {
        console.error('Error getting recent activity:', error);
        next(error);
    }
};
exports.getRecentActivity = getRecentActivity;
//# sourceMappingURL=customerStatsController.js.map