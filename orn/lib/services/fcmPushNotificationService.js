"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FCM_TOPICS = exports.PUSH_NOTIFICATION_TEMPLATES = exports.FCMPushNotificationService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
class FCMPushNotificationService {
    constructor() {
        this.messaging = admin.messaging();
    }
    /**
     * Send push notification to single device
     */
    async sendToDevice(token, payload) {
        try {
            const message = {
                token,
                notification: payload.notification,
                data: payload.data,
                webpush: payload.webpush,
                android: payload.android,
                apns: payload.apns
            };
            const response = await this.messaging.send(message);
            console.log('Push notification sent successfully:', response);
            return response;
        }
        catch (error) {
            console.error('Failed to send push notification:', error);
            // Handle invalid token
            if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'messaging/registration-token-not-registered') {
                await this.markTokenAsInvalid(token);
            }
            throw error;
        }
    }
    /**
     * Send push notification to multiple devices
     */
    async sendToMultipleDevices(tokens, payload) {
        try {
            // Ensure APNS payload always has a valid aps object
            let apnsConfig = undefined;
            if (payload.apns) {
                apnsConfig = {
                    ...payload.apns,
                    payload: {
                        aps: payload.apns.payload?.aps ?? {} // Always provide an object
                    }
                };
            }
            const message = {
                tokens,
                notification: payload.notification,
                data: payload.data,
                webpush: payload.webpush,
                android: payload.android,
                apns: apnsConfig
            };
            // Use the recommended sendEachForMulticast instead of deprecated sendMulticast
            const multicastResult = await this.messaging.sendMulticast(message);
            // Aggregate results to mimic BatchResponse
            let successCount = multicastResult.successCount;
            let failureCount = multicastResult.failureCount;
            const failedTokens = [];
            multicastResult.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
                    if (resp.error?.code === 'messaging/registration-token-not-registered') {
                        const failedToken = tokens[idx];
                        if (typeof failedToken === 'string') {
                            failedTokens.push(failedToken);
                        }
                    }
                }
            });
            // Remove invalid tokens
            if (failedTokens.length > 0) {
                await this.removeInvalidTokens(failedTokens);
            }
            console.log(`Push notifications sent: ${successCount} successful, ${failureCount} failed`);
            // BatchResponse expects responses: SendResponse[]
            return {
                responses: multicastResult.responses,
                successCount,
                failureCount
            };
        }
        catch (error) {
            console.error('Failed to send multicast push notification:', error);
            throw error;
        }
    }
    /**
     * Send push notification to user (all devices)
     */
    async sendToUser(userId, payload) {
        const tokens = await this.getUserTokens(userId);
        if (tokens.length === 0) {
            console.log(`No push tokens found for user ${userId}`);
            return {
                responses: [],
                successCount: 0,
                failureCount: 0
            };
        }
        return await this.sendToMultipleDevices(tokens.map(t => t.token), payload);
    }
    /**
     * Send push notification to topic
     */
    async sendToTopic(topic, payload) {
        try {
            const apnsConfig = payload.apns
                ? {
                    ...payload.apns,
                    payload: {
                        aps: payload.apns.payload?.aps ?? {}
                    }
                }
                : undefined;
            const message = {
                topic,
                notification: payload.notification,
                data: payload.data,
                webpush: payload.webpush,
                android: payload.android,
                apns: apnsConfig
            };
            const response = await this.messaging.send(message);
            console.log(`Push notification sent to topic ${topic}:`, response);
            return response;
        }
        catch (error) {
            console.error(`Failed to send push notification to topic ${topic}:`, error);
            throw error;
        }
    }
    /**
     * Subscribe user to topic
     */
    async subscribeToTopic(tokens, topic) {
        try {
            await this.messaging.subscribeToTopic(tokens, topic);
            console.log(`Subscribed ${tokens.length} tokens to topic ${topic}`);
        }
        catch (error) {
            console.error(`Failed to subscribe to topic ${topic}:`, error);
            throw error;
        }
    }
    /**
     * Unsubscribe user from topic
     */
    async unsubscribeFromTopic(tokens, topic) {
        try {
            await this.messaging.unsubscribeFromTopic(tokens, topic);
            console.log(`Unsubscribed ${tokens.length} tokens from topic ${topic}`);
        }
        catch (error) {
            console.error(`Failed to unsubscribe from topic ${topic}:`, error);
            throw error;
        }
    }
    /**
     * Register device token for user
     */
    async registerDeviceToken(userId, token, platform, deviceInfo) {
        const db = admin.firestore();
        const tokenRef = db.collection('deviceTokens').doc(token);
        const deviceToken = {
            userId,
            token,
            platform,
            deviceInfo,
            isActive: true,
            lastUsed: new Date(),
            createdAt: new Date()
        };
        await tokenRef.set({
            ...deviceToken,
            lastUsed: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Registered device token for user ${userId}`);
    }
    /**
     * Get user's device tokens
     */
    async getUserTokens(userId) {
        const db = admin.firestore();
        const snapshot = await db.collection('deviceTokens')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                lastUsed: data.lastUsed.toDate(),
                createdAt: data.createdAt.toDate()
            };
        });
    }
    /**
     * Mark token as invalid
     */
    async markTokenAsInvalid(token) {
        const db = admin.firestore();
        const tokenRef = db.collection('deviceTokens').doc(token);
        await tokenRef.update({
            isActive: false,
            invalidatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Marked token as invalid: ${token}`);
    }
    /**
     * Remove invalid tokens
     */
    async removeInvalidTokens(tokens) {
        const db = admin.firestore();
        const batch = db.batch();
        tokens.forEach(token => {
            const tokenRef = db.collection('deviceTokens').doc(token);
            batch.update(tokenRef, {
                isActive: false,
                invalidatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        console.log(`Marked ${tokens.length} tokens as invalid`);
    }
    /**
     * Update token last used timestamp
     */
    async updateTokenLastUsed(token) {
        const db = admin.firestore();
        const tokenRef = db.collection('deviceTokens').doc(token);
        await tokenRef.update({
            lastUsed: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    /**
     * Cleanup old/inactive tokens
     */
    async cleanupOldTokens(daysOld = 30) {
        const db = admin.firestore();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const snapshot = await db.collection('deviceTokens')
            .where('lastUsed', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
            .get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.docs.length} old device tokens`);
        return snapshot.docs.length;
    }
}
exports.FCMPushNotificationService = FCMPushNotificationService;
// Push notification templates
exports.PUSH_NOTIFICATION_TEMPLATES = {
    booking_confirmation: {
        notification: {
            title: 'Rezervasyon Onaylandı! 🎉',
            body: 'SUP rezervasyonunuz başarıyla onaylandı.',
            icon: '/icons/booking-confirmed.png',
            badge: '/icons/badge.png'
        },
        webpush: {
            notification: {
                requireInteraction: true,
                actions: [
                    {
                        action: 'view_booking',
                        title: 'Rezervasyonu Görüntüle'
                    }
                ]
            },
            fcmOptions: {
                link: '/account/bookings'
            }
        }
    },
    booking_reminder: {
        notification: {
            title: 'Rezervasyon Hatırlatması ⏰',
            body: 'Yarın SUP rezervasyonunuz var!',
            icon: '/icons/reminder.png',
            badge: '/icons/badge.png'
        },
        webpush: {
            notification: {
                requireInteraction: true,
                vibrate: [200, 100, 200],
                actions: [
                    {
                        action: 'view_details',
                        title: 'Detayları Gör'
                    },
                    {
                        action: 'check_weather',
                        title: 'Hava Durumu'
                    }
                ]
            }
        }
    },
    payment_success: {
        notification: {
            title: 'Ödeme Başarılı ✅',
            body: 'Ödemeniz başarıyla alındı.',
            icon: '/icons/payment-success.png',
            badge: '/icons/badge.png'
        },
        webpush: {
            notification: {
                actions: [
                    {
                        action: 'view_receipt',
                        title: 'Fişi Görüntüle'
                    }
                ]
            }
        }
    },
    weather_alert: {
        notification: {
            title: 'Hava Durumu Uyarısı ⛈️',
            body: 'Rezervasyonunuz için hava koşulları uygun olmayabilir.',
            icon: '/icons/weather-alert.png',
            badge: '/icons/badge.png'
        },
        webpush: {
            notification: {
                requireInteraction: true,
                vibrate: [300, 200, 300],
                actions: [
                    {
                        action: 'check_forecast',
                        title: 'Hava Tahmini'
                    },
                    {
                        action: 'contact_support',
                        title: 'Destek'
                    }
                ]
            }
        }
    }
};
// FCM Topics for different user segments
exports.FCM_TOPICS = {
    ALL_USERS: 'all-users',
    PREMIUM_USERS: 'premium-users',
    BOOKING_REMINDERS: 'booking-reminders',
    WEATHER_ALERTS: 'weather-alerts',
    PROMOTIONS: 'promotions',
    SYSTEM_NOTIFICATIONS: 'system-notifications'
};
//# sourceMappingURL=fcmPushNotificationService.js.map