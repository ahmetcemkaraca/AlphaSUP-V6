"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackDailySMSCosts = exports.cleanupNotificationLogs = exports.sendWeatherAlerts = exports.sendBookingReminders = void 0;
const tslib_1 = require("tslib");
/**
 * Scheduled Functions for AlphaSUP
 *
 * Contains time-based tasks such as booking reminders and weather alerts
 * Integrated with VatanSMS for cost-effective SMS delivery
 * Optimized for low-cost operations with smart scheduling
 * Configurable SMS reminder timing via environment variables
 */
const functions = tslib_1.__importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const notificationService_1 = require("../services/notificationService");
const smsService_1 = require("../services/smsService");
const TIMEZONE = 'Europe/Istanbul';
// Configurable SMS reminder timing
const SMS_REMINDER_HOURS_BEFORE = parseInt(process.env['SMS_REMINDER_HOURS_BEFORE'] || '24'); // Default: 24 hours before
const SMS_SECOND_REMINDER_HOURS_BEFORE = parseInt(process.env['SMS_SECOND_REMINDER_HOURS_BEFORE'] || '2'); // Default: 2 hours before
const ENABLE_SECOND_REMINDER = process.env['ENABLE_SECOND_REMINDER'] !== 'false'; // Default: enabled
/**
 * Sends booking reminders to customers (configurable timing).
 * Runs twice daily at 9 AM and 6 PM to optimize costs and avoid peak hours
 * Supports configurable reminder timing via environment variables
 */
exports.sendBookingReminders = functions.pubsub
    .schedule('0 9,18 * * *') // 9 AM and 6 PM daily
    .timeZone(TIMEZONE)
    .onRun(async () => {
    console.log('🔔 Running sendBookingReminders function - VatanSMS');
    // Check if SMS is enabled before running
    if (!(0, smsService_1.isSMSEnabled)()) {
        console.log('📱 SMS not enabled - skipping booking reminders');
        return {
            success: true,
            message: 'SMS disabled - reminders skipped',
            remindersSent: 0,
            secondRemindersSent: 0
        };
    }
    try {
        const now = new Date();
        // Primary reminder (configurable hours before)
        const reminderStart = new Date(now.getTime() + (SMS_REMINDER_HOURS_BEFORE - 1) * 60 * 60 * 1000);
        const reminderEnd = new Date(now.getTime() + (SMS_REMINDER_HOURS_BEFORE + 1) * 60 * 60 * 1000);
        // Second reminder (if enabled and configured)
        const secondReminderStart = ENABLE_SECOND_REMINDER ?
            new Date(now.getTime() + (SMS_SECOND_REMINDER_HOURS_BEFORE - 0.5) * 60 * 60 * 1000) : null;
        const secondReminderEnd = ENABLE_SECOND_REMINDER ?
            new Date(now.getTime() + (SMS_SECOND_REMINDER_HOURS_BEFORE + 0.5) * 60 * 60 * 1000) : null;
        // Get bookings that need reminders
        const snapshot = await firebase_1.db.collection('bookings')
            .where('status', '==', 'confirmed')
            .where('startDate', '>=', reminderStart.toISOString())
            .where('startDate', '<=', reminderEnd.toISOString())
            .where('reminderSent', '!=', true) // Only bookings without reminders
            .limit(50) // Limit to control costs
            .get();
        if (snapshot.empty) {
            console.log('📭 No bookings need reminders at this time');
            return null;
        }
        let sentCount = 0;
        let errorCount = 0;
        for (const doc of snapshot.docs) {
            try {
                const booking = doc.data();
                const customerId = booking.customerId;
                // Get customer details
                const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
                if (!customerDoc.exists) {
                    console.warn(`⚠️ Customer ${customerId} not found for booking ${doc.id}`);
                    continue;
                }
                const customer = customerDoc.data();
                const phone = customer?.['phone'];
                const name = customer?.['firstName'] || 'Müşteri';
                if (!phone) {
                    console.warn(`⚠️ No phone number for customer ${customerId}`);
                    continue;
                }
                console.log(`📱 Sending reminder to ${name} (${phone}) for booking ${doc.id}`);
                await (0, notificationService_1.sendBookingReminderSms)(phone, name, doc.id, customerId);
                sentCount++;
                // Add small delay between SMS to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                console.error(`❌ Failed to send reminder for booking ${doc.id}:`, error);
                errorCount++;
            }
        }
        console.log(`✅ Booking reminders completed: ${sentCount} sent, ${errorCount} errors out of ${snapshot.docs.length} total`);
        return { sentCount, errorCount, totalBookings: snapshot.docs.length };
    }
    catch (error) {
        console.error('❌ Error in sendBookingReminders:', error);
        throw error;
    }
});
/**
 * Sends weather alerts if conditions are unsafe for upcoming bookings.
 * Runs once daily at 7 PM for next day's bookings
 */
exports.sendWeatherAlerts = functions.pubsub
    .schedule('0 19 * * *') // 7 PM daily
    .timeZone(TIMEZONE)
    .onRun(async () => {
    console.log('🌦️ Running sendWeatherAlerts function - VatanSMS');
    try {
        // Get tomorrow's bookings
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        const snapshot = await firebase_1.db.collection('bookings')
            .where('status', '==', 'confirmed')
            .where('startDate', '>=', tomorrow.toISOString())
            .where('startDate', '<=', endOfTomorrow.toISOString())
            .limit(100) // Limit to control costs
            .get();
        if (snapshot.empty) {
            console.log('📭 No bookings for tomorrow, skipping weather alerts');
            return { alertCount: 0, totalBookings: 0 };
        }
        // TODO: Integrate with weather API (OpenWeatherMap free tier)
        // For now, simulate weather conditions
        const weatherConditions = await checkWeatherConditions();
        if (!weatherConditions.isUnsafe) {
            console.log('☀️ Weather conditions are good, no alerts needed');
            return { alertCount: 0, totalBookings: snapshot.docs.length, weatherConditions };
        }
        console.log(`⛈️ Unsafe weather detected: ${weatherConditions.description}`);
        let alertCount = 0;
        let errorCount = 0;
        for (const doc of snapshot.docs) {
            try {
                const booking = doc.data();
                const customerId = booking.customerId;
                // Get customer details
                const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
                if (!customerDoc.exists)
                    continue;
                const customer = customerDoc.data();
                const phone = customer?.['phone'];
                const name = customer?.['firstName'] || 'Müşteri';
                if (!phone)
                    continue;
                console.log(`🌨️ Sending weather alert to ${name} (${phone}) for booking ${doc.id}`);
                await (0, notificationService_1.sendWeatherAlertSms)(phone, name, doc.id, weatherConditions.description, customerId);
                alertCount++;
                // Add delay between SMS
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            catch (error) {
                console.error(`❌ Failed to send weather alert for booking ${doc.id}:`, error);
                errorCount++;
            }
        }
        console.log(`✅ Weather alerts completed: ${alertCount} sent, ${errorCount} errors`);
        return { alertCount, errorCount, totalBookings: snapshot.docs.length, weatherConditions };
    }
    catch (error) {
        console.error('❌ Error in sendWeatherAlerts:', error);
        throw error;
    }
});
/**
 * Cleans up old notification logs to save storage costs
 * Runs weekly on Sundays at 2 AM
 */
exports.cleanupNotificationLogs = functions.pubsub
    .schedule('0 2 * * 0') // Sundays at 2 AM
    .timeZone(TIMEZONE)
    .onRun(async () => {
    console.log('🧹 Running cleanupNotificationLogs function');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const snapshot = await firebase_1.db.collection('notifications')
            .where('sentAt', '<', thirtyDaysAgo.toISOString())
            .limit(500) // Process in batches
            .get();
        if (snapshot.empty) {
            console.log('📭 No old notification logs to clean up');
            return { deletedCount: 0 };
        }
        const batch = firebase_1.db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Cleaned up ${snapshot.docs.length} old notification logs`);
        return { deletedCount: snapshot.docs.length };
    }
    catch (error) {
        console.error('❌ Error in cleanupNotificationLogs:', error);
        throw error;
    }
});
/**
 * Daily SMS cost tracking and alerts
 * Runs daily at 11 PM to track SMS costs
 */
exports.trackDailySMSCosts = functions.pubsub
    .schedule('0 23 * * *') // 11 PM daily
    .timeZone(TIMEZONE)
    .onRun(async () => {
    console.log('💰 Running trackDailySMSCosts function');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Get today's SMS notifications
        const snapshot = await firebase_1.db.collection('notifications')
            .where('sentAt', '>=', today.toISOString())
            .where('sentAt', '<', tomorrow.toISOString())
            .where('provider', '==', 'vatansms')
            .where('status', '==', 'sent')
            .get();
        let totalCost = 0;
        let totalSent = 0;
        const costsByType = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const cost = data['cost'] || 0;
            const type = data['type'];
            totalCost += cost;
            totalSent++;
            if (!costsByType[type]) {
                costsByType[type] = { count: 0, cost: 0 };
            }
            costsByType[type].count++;
            costsByType[type].cost += cost;
        });
        // Save daily cost summary
        await firebase_1.db.collection('sms_cost_tracking').add({
            date: today.toISOString().split('T')[0],
            totalCost,
            totalSent,
            costsByType,
            createdAt: new Date().toISOString()
        });
        console.log(`📊 Daily SMS cost tracking: ${totalSent} SMS sent, ${totalCost.toFixed(4)}₺ total cost`);
        // Alert if daily cost exceeds threshold (e.g., 10₺)
        const DAILY_COST_THRESHOLD = 10;
        if (totalCost > DAILY_COST_THRESHOLD) {
            console.warn(`⚠️ Daily SMS cost threshold exceeded: ${totalCost.toFixed(2)}₺ > ${DAILY_COST_THRESHOLD}₺`);
            // TODO: Send alert to admins
        }
        return { totalCost, totalSent, costsByType };
    }
    catch (error) {
        console.error('❌ Error in trackDailySMSCosts:', error);
        throw error;
    }
});
/**
 * Simulates weather condition checking
 * TODO: Replace with real weather API integration (OpenWeatherMap free tier)
 */
async function checkWeatherConditions() {
    // Simulated weather check - replace with actual API call
    const conditions = {
        isUnsafe: Math.random() < 0.1, // 10% chance of unsafe weather
        description: 'Güçlü rüzgar ve dalgalar bekleniyor. Güvenlik için rezervasyonunuzu kontrol edin.',
        temperature: 25,
        windSpeed: 15
    };
    return conditions;
}
//# sourceMappingURL=index.js.map