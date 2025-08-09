"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferencesService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
class NotificationPreferencesService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Get user notification preferences with defaults
     */
    async getUserPreferences(userId) {
        const preferencesRef = this.db.collection('notificationPreferences').doc(userId);
        const doc = await preferencesRef.get();
        if (doc.exists) {
            const data = doc.data();
            if (!data) {
                // Data is undefined, return default preferences
                return await this.getDefaultPreferences(userId, preferencesRef);
            }
            return {
                userId,
                ...data,
                gdprConsent: {
                    ...data.gdprConsent,
                    consentDate: data.gdprConsent?.consentDate?.toDate?.() ?? new Date()
                },
                lastUpdated: data.lastUpdated?.toDate?.() ?? new Date(),
                createdAt: data.createdAt?.toDate?.() ?? new Date()
            };
        }
        // Create and save default preferences using helper
        return await this.getDefaultPreferences(userId, preferencesRef);
    }
    /**
     * Helper to create and save default preferences
     */
    async getDefaultPreferences(userId, preferencesRef) {
        const defaultPreferences = {
            userId,
            smsEnabled: true,
            emailEnabled: true,
            pushEnabled: true,
            inAppEnabled: true,
            categories: {
                booking: true,
                payment: true,
                system: true,
                promotion: false,
                reminder: true,
                alert: true
            },
            quietHours: {
                enabled: false,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'Europe/Istanbul'
            },
            language: 'tr',
            gdprConsent: {
                marketing: false,
                analytics: true,
                personalizedContent: true,
                thirdPartySharing: false,
                consentDate: new Date()
            },
            unsubscribeToken: this.generateUnsubscribeToken(userId),
            lastUpdated: new Date(),
            createdAt: new Date()
        };
        await preferencesRef.set({
            ...defaultPreferences,
            gdprConsent: {
                ...defaultPreferences.gdprConsent,
                consentDate: firestore_1.Timestamp.now()
            },
            lastUpdated: firestore_1.Timestamp.now(),
            createdAt: firestore_1.Timestamp.now()
        });
        return defaultPreferences;
    }
    /**
     * Update user notification preferences
     */
    async updateUserPreferences(userId, updates) {
        const preferencesRef = this.db.collection('notificationPreferences').doc(userId);
        // Ensure user preferences exist
        await this.getUserPreferences(userId);
        const updateData = {
            ...updates,
            lastUpdated: firestore_1.Timestamp.now()
        };
        // Handle GDPR consent updates
        if (updates.gdprConsent) {
            updateData.gdprConsent = {
                ...updates.gdprConsent,
                consentDate: firestore_1.Timestamp.now()
            };
        }
        await preferencesRef.update(updateData);
        // Log preference change for audit
        await this.logPreferenceChange(userId, updates);
    }
    /**
     * Check if user allows specific notification type
     */
    async canSendNotification(userId, type, category) {
        try {
            const preferences = await this.getUserPreferences(userId);
            // Check if notification type is enabled
            const typeEnabled = preferences[`${type}Enabled`];
            if (!typeEnabled)
                return false;
            // Check if category is enabled
            const categoryEnabled = preferences.categories[category];
            if (!categoryEnabled)
                return false;
            // Check quiet hours for non-urgent notifications
            if (this.isQuietHours(preferences) && category !== 'alert') {
                return false;
            }
            return true;
        }
        catch (error) {
            console.error(`Error checking notification permissions for user ${userId}:`, error);
            return false; // Fail safe - don't send if we can't verify
        }
    }
    /**
     * Bulk update preferences for multiple users
     */
    async bulkUpdatePreferences(userIds, preferences) {
        const batch = this.db.batch();
        const errors = [];
        let successCount = 0;
        for (const userId of userIds) {
            try {
                const preferencesRef = this.db.collection('notificationPreferences').doc(userId);
                const updateData = {
                    ...preferences,
                    lastUpdated: firestore_1.Timestamp.now()
                };
                batch.update(preferencesRef, updateData);
                successCount++;
            }
            catch (error) {
                let errorMsg = 'Unknown error';
                if (error instanceof Error) {
                    errorMsg = error.message;
                }
                else if (typeof error === 'string') {
                    errorMsg = error;
                }
                errors.push({
                    userId,
                    error: errorMsg
                });
            }
        }
        try {
            await batch.commit();
        }
        catch (error) {
            let errorMsg = 'Unknown error';
            if (error instanceof Error) {
                errorMsg = error.message;
            }
            else if (typeof error === 'string') {
                errorMsg = error;
            }
            return {
                successCount: 0,
                failureCount: userIds.length,
                errors: [{ error: 'Batch commit failed', details: errorMsg }]
            };
        }
        return {
            successCount,
            failureCount: userIds.length - successCount,
            errors
        };
    }
    /**
     * Unsubscribe user from all notifications
     */
    async unsubscribeFromAll(userId) {
        await this.updateUserPreferences(userId, {
            smsEnabled: false,
            emailEnabled: false,
            pushEnabled: false,
            inAppEnabled: false,
            categories: {
                booking: false,
                payment: false,
                system: false,
                promotion: false,
                reminder: false,
                alert: false
            }
        });
        // Log unsubscribe for compliance
        await this.logUnsubscribe(userId, 'all');
    }
    /**
     * Reset preferences to defaults
     */
    async resetToDefaults(userId) {
        const preferencesRef = this.db.collection('notificationPreferences').doc(userId);
        await preferencesRef.delete();
        // This will trigger creation of new default preferences
        await this.getUserPreferences(userId);
    }
    /**
     * Get notification statistics for admin dashboard
     */
    async getNotificationStatistics() {
        const preferencesCollection = this.db.collection('notificationPreferences');
        const snapshot = await preferencesCollection.get();
        const totalUsers = snapshot.size;
        const stats = {
            totalUsers,
            enabledByType: { sms: 0, email: 0, push: 0, inApp: 0 },
            enabledByCategory: { booking: 0, payment: 0, system: 0, promotion: 0, reminder: 0, alert: 0 },
            optOutRates: { sms: 0, email: 0, push: 0, inApp: 0 },
            consentRates: { marketing: 0, analytics: 0, personalizedContent: 0, thirdPartySharing: 0 }
        };
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Count enabled by type
            if (data.smsEnabled)
                stats.enabledByType.sms++;
            if (data.emailEnabled)
                stats.enabledByType.email++;
            if (data.pushEnabled)
                stats.enabledByType.push++;
            if (data.inAppEnabled)
                stats.enabledByType.inApp++;
            // Count enabled by category
            Object.keys(stats.enabledByCategory).forEach(category => {
                if (data.categories?.[category]) {
                    stats.enabledByCategory[category]++;
                }
            });
            // Count GDPR consents
            if (data.gdprConsent?.marketing)
                stats.consentRates.marketing++;
            if (data.gdprConsent?.analytics)
                stats.consentRates.analytics++;
            if (data.gdprConsent?.personalizedContent)
                stats.consentRates.personalizedContent++;
            if (data.gdprConsent?.thirdPartySharing)
                stats.consentRates.thirdPartySharing++;
        });
        // Calculate opt-out rates
        if (totalUsers > 0) {
            stats.optOutRates.sms = ((totalUsers - stats.enabledByType.sms) / totalUsers) * 100;
            stats.optOutRates.email = ((totalUsers - stats.enabledByType.email) / totalUsers) * 100;
            stats.optOutRates.push = ((totalUsers - stats.enabledByType.push) / totalUsers) * 100;
            stats.optOutRates.inApp = ((totalUsers - stats.enabledByType.inApp) / totalUsers) * 100;
        }
        return stats;
    }
    /**
     * Handle unsubscribe via token (email links)
     */
    async unsubscribeViaToken(token, type) {
        // Find user by unsubscribe token
        const snapshot = await this.db.collection('notificationPreferences')
            .where('unsubscribeToken', '==', token)
            .limit(1)
            .get();
        if (snapshot.empty) {
            return { success: false };
        }
        const doc = snapshot.docs[0];
        if (!doc) {
            return { success: false };
        }
        const userId = doc.id;
        if (type === 'email') {
            await this.updateUserPreferences(userId, { emailEnabled: false });
        }
        else {
            await this.unsubscribeFromAll(userId);
        }
        await this.logUnsubscribe(userId, type || 'all', { method: 'token', token });
        return { success: true, userId };
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
        // Handle overnight quiet hours
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        return currentTime >= startTime && currentTime <= endTime;
    }
    /**
     * Generate unique unsubscribe token
     */
    generateUnsubscribeToken(userId) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(`${userId}_${Date.now()}_${Math.random()}`).digest('hex');
    }
    /**
     * Log preference changes for audit
     */
    async logPreferenceChange(userId, changes) {
        await this.db.collection('auditLogs').add({
            type: 'notification_preference_change',
            userId,
            changes,
            timestamp: firestore_1.Timestamp.now(),
            ip: null, // Would be populated in real request
            userAgent: null
        });
    }
    /**
     * Log unsubscribe events
     */
    async logUnsubscribe(userId, type, metadata) {
        await this.db.collection('auditLogs').add({
            type: 'notification_unsubscribe',
            userId,
            unsubscribeType: type,
            metadata,
            timestamp: firestore_1.Timestamp.now()
        });
    }
}
exports.NotificationPreferencesService = NotificationPreferencesService;
//# sourceMappingURL=notificationPreferencesService.js.map