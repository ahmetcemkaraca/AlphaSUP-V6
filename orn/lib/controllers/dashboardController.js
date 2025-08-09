"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const firebase_1 = require("../config/firebase");
const getDashboardStats = async (req, res) => {
    try {
        // Example KPIs: total bookings, revenue, active services
        const bookingsSnap = await firebase_1.db.collection('bookings').get();
        const servicesSnap = await firebase_1.db.collection('services').where('isActive', '==', true).get();
        const totalBookings = bookingsSnap.size;
        const activeServices = servicesSnap.size;
        // Calculate revenue from payments (simplistic example)
        const revenueSnap = await firebase_1.db.collection('payments').where('status', '==', 'succeeded').get();
        let totalRevenue = 0;
        revenueSnap.docs.forEach(doc => {
            const data = doc.data();
            totalRevenue += data['amount'] || 0;
        });
        res.status(200).json({ totalBookings, activeServices, totalRevenue });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).send('Error getting dashboard stats');
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=dashboardController.js.map