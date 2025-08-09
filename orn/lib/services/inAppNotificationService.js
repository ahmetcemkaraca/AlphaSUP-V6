"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IN_APP_NOTIFICATION_TEMPLATES = exports.InAppNotificationService = void 0;
const firestore_1 = require("firebase-admin/firestore");
class InAppNotificationService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Send in-app notification to user
     */
    async sendNotification(notification) {
        try {
            // Check user notification preferences
            const preferences = await this.getUserPreferences(notification.userId);
            if (!preferences.enableInApp || !preferences.categories[notification.type]) {
                console.log(`User ${notification.userId} has disabled ${notification.type} notifications`);
                return null;
            }
            // Check quiet hours
            if (this.isQuietHours(preferences)) {
                // Schedule notification for later or reduce priority
                notification.priority = notification.priority === 'urgent' ? 'high' : 'low';
            }
            // Create notification document
            const notificationData = {
                ...notification,
                id: '', // Will be set by Firestore
                isRead: false,
                isArchived: false,
                createdAt: new Date()
            };
            const docRef = await this.db.collection('notifications').add({
                ...notificationData,
                createdAt: firestore_1.Timestamp.now(),
                expiresAt: notification.expiresAt ? firestore_1.Timestamp.fromDate(notification.expiresAt) : null,
                readAt: null
            });
            // Update notification with generated ID
            await docRef.update({ id: docRef.id });
            // Trigger real-time update for user
            await this.updateUserNotificationCount(notification.userId);
            console.log(`In-app notification sent to user ${notification.userId}: ${docRef.id}`);
            return docRef.id;
        }
        catch (error) {
            console.error('Failed to send in-app notification:', error);
            throw error;
        }
    }
    /**
     * Get user notifications with pagination
     */
    async getUserNotifications(userId, options = {}) {
        const { limit = 20, lastDocId, includeRead = true, includeArchived = false, type } = options;
        let query = this.db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc');
        // Filter by read status
        if (!includeRead) {
            query = query.where('isRead', '==', false);
        }
        // Filter by archived status
        if (!includeArchived) {
            query = query.where('isArchived', '==', false);
        }
        // Filter by type
        if (type) {
            query = query.where('type', '==', type);
        }
        // Pagination
        if (lastDocId) {
            const lastDoc = await this.db.collection('notifications').doc(lastDocId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        query = query.limit(limit + 1); // +1 to check if there are more
        const snapshot = await query.get();
        const notifications = [];
        snapshot.docs.slice(0, limit).forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate(),
                readAt: data.readAt?.toDate(),
                expiresAt: data.expiresAt?.toDate()
            });
        });
        const lastNotification = notifications.length > 0 ? notifications[notifications.length - 1] : undefined;
        return {
            notifications,
            hasMore: snapshot.docs.length > limit,
            lastDocId: lastNotification && typeof lastNotification.id === 'string' ? lastNotification.id : undefined
        };
    }
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const notificationRef = this.db.collection('notifications').doc(notificationId);
        const notification = await notificationRef.get();
        if (!notification.exists) {
            throw new Error('Notification not found');
        }
        const data = notification.data();
        if (!data || data.userId !== userId) {
            throw new Error('Unauthorized to mark this notification as read');
        }
        if (!data.isRead) {
            await notificationRef.update({
                isRead: true,
                readAt: firestore_1.Timestamp.now()
            });
            // Update user notification count
            await this.updateUserNotificationCount(userId);
        }
    }
    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId) {
        const unreadQuery = this.db.collection('notifications')
            .where('userId', '==', userId)
            .where('isRead', '==', false);
        const snapshot = await unreadQuery.get();
        const batch = this.db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                isRead: true,
                readAt: firestore_1.Timestamp.now()
            });
        });
        await batch.commit();
        await this.updateUserNotificationCount(userId);
    }
    /**
     * Archive notification
     */
    async archiveNotification(notificationId, userId) {
        const notificationRef = this.db.collection('notifications').doc(notificationId);
        const notification = await notificationRef.get();
        if (!notification.exists) {
            throw new Error('Notification not found');
        }
        const data = notification.data();
        if (!data || data.userId !== userId) {
            throw new Error('Unauthorized to archive this notification');
        }
        await notificationRef.update({
            isArchived: true,
            isRead: true,
            readAt: data.readAt ? data.readAt : firestore_1.Timestamp.now()
        });
        await this.updateUserNotificationCount(userId);
    }
    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        const notificationRef = this.db.collection('notifications').doc(notificationId);
        const notification = await notificationRef.get();
        if (!notification.exists) {
            throw new Error('Notification not found');
        }
        const data = notification.data();
        if (!data || data.userId !== userId) {
            throw new Error('Unauthorized to delete this notification');
        }
        await notificationRef.delete();
        await this.updateUserNotificationCount(userId);
    }
    /**
     * Get user notification preferences
     */
    async getUserPreferences(userId) {
        const preferencesRef = this.db.collection('userNotificationPreferences').doc(userId);
        const doc = await preferencesRef.get();
        if (doc.exists) {
            const data = doc.data();
            if (data && data.updatedAt) {
                return {
                    userId,
                    ...data,
                    updatedAt: data.updatedAt.toDate()
                };
            }
            else if (data) {
                return {
                    userId,
                    ...data,
                    updatedAt: new Date()
                };
            }
        }
        // Default preferences
        const defaultPreferences = {
            userId,
            enableInApp: true,
            categories: {
                booking: true,
                payment: true,
                system: true,
                promotion: true,
                reminder: true,
                alert: true
            },
            quietHours: {
                enabled: false,
                startTime: '22:00',
                endTime: '08:00'
            },
            updatedAt: new Date()
        };
        // Save default preferences
        await preferencesRef.set({
            ...defaultPreferences,
            updatedAt: firestore_1.Timestamp.now()
        });
        return defaultPreferences;
    }
    /**
     * Update user notification preferences
     */
    async updateUserPreferences(userId, preferences) {
        const preferencesRef = this.db.collection('userNotificationPreferences').doc(userId);
        await preferencesRef.update({
            ...preferences,
            updatedAt: firestore_1.Timestamp.now()
        });
    }
    /**
     * Get user notification count (unread)
     */
    async getUserNotificationCount(userId) {
        const [unreadSnapshot, totalSnapshot] = await Promise.all([
            this.db.collection('notifications')
                .where('userId', '==', userId)
                .where('isRead', '==', false)
                .where('isArchived', '==', false)
                .count()
                .get(),
            this.db.collection('notifications')
                .where('userId', '==', userId)
                .where('isArchived', '==', false)
                .count()
                .get()
        ]);
        return {
            unread: unreadSnapshot.data().count,
            total: totalSnapshot.data().count
        };
    }
    /**
     * Update user notification count cache
     */
    async updateUserNotificationCount(userId) {
        const count = await this.getUserNotificationCount(userId);
        // Update user document with notification count
        await this.db.collection('users').doc(userId).update({
            notificationCount: count.unread,
            totalNotifications: count.total,
            lastNotificationUpdate: firestore_1.Timestamp.now()
        });
    }
    /**
     * Check if current time is within user's quiet hours
     */
    isQuietHours(preferences) {
        if (!preferences.quietHours.enabled) {
            return false;
        }
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const { startTime, endTime } = preferences.quietHours;
        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        // Handle same-day quiet hours (e.g., 12:00 to 14:00)
        return currentTime >= startTime && currentTime <= endTime;
    }
    /**
     * Cleanup expired notifications
     */
    async cleanupExpiredNotifications() {
        const expiredQuery = this.db.collection('notifications')
            .where('expiresAt', '<=', firestore_1.Timestamp.now());
        const snapshot = await expiredQuery.get();
        const batch = this.db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.docs.length} expired notifications`);
        return snapshot.docs.length;
    }
    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(notifications) {
        const batch = this.db.batch();
        const notificationIds = [];
        for (const notification of notifications) {
            const docRef = this.db.collection('notifications').doc();
            const notificationData = {
                ...notification,
                id: docRef.id,
                isRead: false,
                isArchived: false,
                createdAt: firestore_1.Timestamp.now(),
                expiresAt: notification.expiresAt ? firestore_1.Timestamp.fromDate(notification.expiresAt) : null,
                readAt: null
            };
            batch.set(docRef, notificationData);
            notificationIds.push(docRef.id);
        }
        await batch.commit();
        // Update notification counts for all affected users
        const userIds = [...new Set(notifications.map(n => n.userId))];
        await Promise.all(userIds.map(userId => this.updateUserNotificationCount(userId)));
        return notificationIds;
    }
}
exports.InAppNotificationService = InAppNotificationService;
// Notification templates
exports.IN_APP_NOTIFICATION_TEMPLATES = {
    booking_confirmed: {
        title: 'Rezervasyon Onaylandı! 🎉',
        message: '{{service_name}} rezervasyonunuz {{booking_date}} tarihinde onaylandı.',
        type: 'booking',
        priority: 'normal'
    },
    payment_received: {
        title: 'Ödeme Alındı ✅',
        message: '{{amount}} ₺ tutarındaki ödemeniz başarıyla alındı.',
        type: 'payment',
        priority: 'normal'
    },
    booking_reminder: {
        title: 'Rezervasyon Hatırlatması ⏰',
        message: 'Yarın {{booking_time}} saatinde {{service_name}} rezervasyonunuz var.',
        type: 'reminder',
        priority: 'high'
    },
    weather_alert: {
        title: 'Hava Durumu Uyarısı ⛈️',
        message: 'Rezervasyonunuz için hava koşulları uygun olmayabilir. {{weather_details}}',
        type: 'alert',
        priority: 'urgent'
    },
    system_maintenance: {
        title: 'Sistem Bakımı 🔧',
        message: 'Sistem bakımı nedeniyle {{maintenance_date}} tarihinde kısa süreli kesinti olabilir.',
        type: 'system',
        priority: 'low'
    }
};
//# sourceMappingURL=inAppNotificationService.js.map