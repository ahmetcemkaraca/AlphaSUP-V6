/**
 * Notification Preferences Service
 * Comprehensive notification management with GDPR compliance
 */
export interface NotificationPreferences {
    userId: string;
    smsEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    categories: {
        booking: boolean;
        payment: boolean;
        system: boolean;
        promotion: boolean;
        reminder: boolean;
        alert: boolean;
    };
    quietHours: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone?: string;
    };
    language: 'tr' | 'en';
    gdprConsent: {
        marketing: boolean;
        analytics: boolean;
        personalizedContent: boolean;
        thirdPartySharing: boolean;
        consentDate: Date;
    };
    unsubscribeToken?: string;
    lastUpdated: Date;
    createdAt: Date;
}
export interface NotificationStatistics {
    totalUsers: number;
    enabledByType: {
        sms: number;
        email: number;
        push: number;
        inApp: number;
    };
    enabledByCategory: {
        booking: number;
        payment: number;
        system: number;
        promotion: number;
        reminder: number;
        alert: number;
    };
    optOutRates: {
        sms: number;
        email: number;
        push: number;
        inApp: number;
    };
    consentRates: {
        marketing: number;
        analytics: number;
        personalizedContent: number;
        thirdPartySharing: number;
    };
}
export declare class NotificationPreferencesService {
    private db;
    constructor();
    /**
     * Get user notification preferences with defaults
     */
    getUserPreferences(userId: string): Promise<NotificationPreferences>;
    /**
     * Helper to create and save default preferences
     */
    private getDefaultPreferences;
    /**
     * Update user notification preferences
     */
    updateUserPreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<void>;
    /**
     * Check if user allows specific notification type
     */
    canSendNotification(userId: string, type: 'sms' | 'email' | 'push' | 'inApp', category: string): Promise<boolean>;
    /**
     * Bulk update preferences for multiple users
     */
    bulkUpdatePreferences(userIds: string[], preferences: Partial<NotificationPreferences>): Promise<{
        successCount: number;
        failureCount: number;
        errors: any[];
    }>;
    /**
     * Unsubscribe user from all notifications
     */
    unsubscribeFromAll(userId: string): Promise<void>;
    /**
     * Reset preferences to defaults
     */
    resetToDefaults(userId: string): Promise<void>;
    /**
     * Get notification statistics for admin dashboard
     */
    getNotificationStatistics(): Promise<NotificationStatistics>;
    /**
     * Handle unsubscribe via token (email links)
     */
    unsubscribeViaToken(token: string, type?: string): Promise<{
        success: boolean;
        userId?: string;
    }>;
    /**
     * Check if current time is within user's quiet hours
     */
    private isQuietHours;
    /**
     * Generate unique unsubscribe token
     */
    private generateUnsubscribeToken;
    /**
     * Log preference changes for audit
     */
    private logPreferenceChange;
    /**
     * Log unsubscribe events
     */
    private logUnsubscribe;
}
//# sourceMappingURL=notificationPreferencesService.d.ts.map