import { Firestore } from 'firebase-admin/firestore';
/**
 * In-App Notifications System
 * Real-time Firestore-based notification system
 */
export interface InAppNotification {
    id: string;
    userId: string;
    type: 'booking' | 'payment' | 'system' | 'promotion' | 'reminder' | 'alert';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    isRead: boolean;
    isArchived: boolean;
    actionUrl?: string;
    actionLabel?: string;
    imageUrl?: string;
    createdAt: Date;
    readAt?: Date;
    expiresAt?: Date;
}
export interface NotificationPreferences {
    userId: string;
    enableInApp: boolean;
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
    };
    updatedAt: Date;
}
export declare class InAppNotificationService {
    private db;
    constructor(db: Firestore);
    /**
     * Send in-app notification to user
     */
    sendNotification(notification: Omit<InAppNotification, 'id' | 'isRead' | 'isArchived' | 'createdAt'>): Promise<string | null>;
    /**
     * Get user notifications with pagination
     */
    getUserNotifications(userId: string, options?: {
        limit?: number;
        lastDocId?: string;
        includeRead?: boolean;
        includeArchived?: boolean;
        type?: string;
    }): Promise<{
        notifications: InAppNotification[];
        hasMore: boolean;
        lastDocId?: string;
    }>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string, userId: string): Promise<void>;
    /**
     * Mark all notifications as read for user
     */
    markAllAsRead(userId: string): Promise<void>;
    /**
     * Archive notification
     */
    archiveNotification(notificationId: string, userId: string): Promise<void>;
    /**
     * Delete notification
     */
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    /**
     * Get user notification preferences
     */
    getUserPreferences(userId: string): Promise<NotificationPreferences>;
    /**
     * Update user notification preferences
     */
    updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>;
    /**
     * Get user notification count (unread)
     */
    getUserNotificationCount(userId: string): Promise<{
        unread: number;
        total: number;
    }>;
    /**
     * Update user notification count cache
     */
    private updateUserNotificationCount;
    /**
     * Check if current time is within user's quiet hours
     */
    private isQuietHours;
    /**
     * Cleanup expired notifications
     */
    cleanupExpiredNotifications(): Promise<number>;
    /**
     * Send bulk notifications
     */
    sendBulkNotifications(notifications: Array<Omit<InAppNotification, 'id' | 'isRead' | 'isArchived' | 'createdAt'>>): Promise<string[]>;
}
export declare const IN_APP_NOTIFICATION_TEMPLATES: {
    booking_confirmed: {
        title: string;
        message: string;
        type: "booking";
        priority: "normal";
    };
    payment_received: {
        title: string;
        message: string;
        type: "payment";
        priority: "normal";
    };
    booking_reminder: {
        title: string;
        message: string;
        type: "reminder";
        priority: "high";
    };
    weather_alert: {
        title: string;
        message: string;
        type: "alert";
        priority: "urgent";
    };
    system_maintenance: {
        title: string;
        message: string;
        type: "system";
        priority: "low";
    };
};
//# sourceMappingURL=inAppNotificationService.d.ts.map