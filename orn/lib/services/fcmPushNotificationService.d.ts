import { BatchResponse } from 'firebase-admin/messaging';
/**
 * Firebase Cloud Messaging (FCM) Push Notifications
 * Cross-platform push notification system
 */
export interface FCMNotification {
    title: string;
    body: string;
    imageUrl?: string;
    icon?: string;
    badge?: string;
    sound?: string;
    clickAction?: string;
    tag?: string;
}
export interface FCMData {
    [key: string]: string;
}
export interface PushNotificationPayload {
    tokens: string | string[];
    notification?: FCMNotification;
    data?: FCMData;
    webpush?: {
        notification?: {
            title?: string;
            body?: string;
            icon?: string;
            badge?: string;
            image?: string;
            vibrate?: number[];
            timestamp?: number;
            requireInteraction?: boolean;
            actions?: Array<{
                action: string;
                title: string;
                icon?: string;
            }>;
        };
        fcmOptions?: {
            link?: string;
            analyticsLabel?: string;
        };
    };
    android?: {
        priority?: 'normal' | 'high';
        ttl?: number;
        notification?: {
            title?: string;
            body?: string;
            icon?: string;
            color?: string;
            sound?: string;
            tag?: string;
            clickAction?: string;
            channelId?: string;
        };
    };
    apns?: {
        payload?: {
            aps?: {
                alert?: {
                    title?: string;
                    body?: string;
                };
                badge?: number;
                sound?: string;
                category?: string;
                threadId?: string;
            };
        };
        fcmOptions?: {
            analyticsLabel?: string;
            imageUrl?: string;
        };
    };
}
export interface DeviceToken {
    userId: string;
    token: string;
    platform: 'web' | 'android' | 'ios';
    deviceInfo?: {
        userAgent?: string;
        deviceModel?: string;
        osVersion?: string;
        appVersion?: string;
    };
    isActive: boolean;
    lastUsed: Date;
    createdAt: Date;
}
export declare class FCMPushNotificationService {
    private messaging;
    constructor();
    /**
     * Send push notification to single device
     */
    sendToDevice(token: string, payload: Omit<PushNotificationPayload, 'tokens'>): Promise<string>;
    /**
     * Send push notification to multiple devices
     */
    sendToMultipleDevices(tokens: string[], payload: Omit<PushNotificationPayload, 'tokens'>): Promise<BatchResponse>;
    /**
     * Send push notification to user (all devices)
     */
    sendToUser(userId: string, payload: Omit<PushNotificationPayload, 'tokens'>): Promise<BatchResponse>;
    /**
     * Send push notification to topic
     */
    sendToTopic(topic: string, payload: Omit<PushNotificationPayload, 'tokens'>): Promise<string>;
    /**
     * Subscribe user to topic
     */
    subscribeToTopic(tokens: string[], topic: string): Promise<void>;
    /**
     * Unsubscribe user from topic
     */
    unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;
    /**
     * Register device token for user
     */
    registerDeviceToken(userId: string, token: string, platform: 'web' | 'android' | 'ios', deviceInfo?: any): Promise<void>;
    /**
     * Get user's device tokens
     */
    getUserTokens(userId: string): Promise<DeviceToken[]>;
    /**
     * Mark token as invalid
     */
    markTokenAsInvalid(token: string): Promise<void>;
    /**
     * Remove invalid tokens
     */
    removeInvalidTokens(tokens: string[]): Promise<void>;
    /**
     * Update token last used timestamp
     */
    updateTokenLastUsed(token: string): Promise<void>;
    /**
     * Cleanup old/inactive tokens
     */
    cleanupOldTokens(daysOld?: number): Promise<number>;
}
export declare const PUSH_NOTIFICATION_TEMPLATES: {
    booking_confirmation: {
        notification: {
            title: string;
            body: string;
            icon: string;
            badge: string;
        };
        webpush: {
            notification: {
                requireInteraction: boolean;
                actions: {
                    action: string;
                    title: string;
                }[];
            };
            fcmOptions: {
                link: string;
            };
        };
    };
    booking_reminder: {
        notification: {
            title: string;
            body: string;
            icon: string;
            badge: string;
        };
        webpush: {
            notification: {
                requireInteraction: boolean;
                vibrate: number[];
                actions: {
                    action: string;
                    title: string;
                }[];
            };
        };
    };
    payment_success: {
        notification: {
            title: string;
            body: string;
            icon: string;
            badge: string;
        };
        webpush: {
            notification: {
                actions: {
                    action: string;
                    title: string;
                }[];
            };
        };
    };
    weather_alert: {
        notification: {
            title: string;
            body: string;
            icon: string;
            badge: string;
        };
        webpush: {
            notification: {
                requireInteraction: boolean;
                vibrate: number[];
                actions: {
                    action: string;
                    title: string;
                }[];
            };
        };
    };
};
export declare const FCM_TOPICS: {
    ALL_USERS: string;
    PREMIUM_USERS: string;
    BOOKING_REMINDERS: string;
    WEATHER_ALERTS: string;
    PROMOTIONS: string;
    SYSTEM_NOTIFICATIONS: string;
};
//# sourceMappingURL=fcmPushNotificationService.d.ts.map