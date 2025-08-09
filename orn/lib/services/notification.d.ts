/**
 * Notification Service - SMS, Email, and Push Notifications
 * Bildirim hizmetleri - SMS, e-posta ve push bildirimleri
 * AlphaSUP - Phase 7 SMS Integration Enhanced
 */
import { Payment } from '../types/payment';
export declare enum NotificationType {
    SMS = "sms",
    EMAIL = "email",
    PUSH = "push",
    IN_APP = "in_app"
}
export interface NotificationTemplate {
    id: string;
    name: string;
    type: NotificationType;
    subject?: string;
    content: string;
    variables: string[];
    language: 'tr' | 'en';
}
export declare class NotificationService {
    private db;
    private smsService;
    private templateService;
    private notificationManager;
    constructor();
    /**
     * Phase 7: Initialize SMS services
     */
    private initializeSMSServices;
    /**
     * Send payment receipt notification
     */
    sendPaymentReceiptNotification(customerId: string, bookingId: string, payment: Payment): Promise<void>;
    /**
     * Send payment failed notification
     */
    sendPaymentFailedNotification(customerId: string, bookingId: string, failureReason?: string): Promise<void>;
    /**
     * Send refund notification
     */
    sendRefundNotification(customerId: string, bookingId: string, amount: number): Promise<void>;
    /**
     * Send email notification
     */
    private sendEmailNotification;
    /**
     * Generate payment receipt email content
     */
    private generatePaymentReceiptEmail;
    /**
     * Generate payment failed email content
     */
    private generatePaymentFailedEmail;
    /**
     * Generate refund email content
     */
    private generateRefundEmail;
    /**
     * Phase 7: Send SMS notification via NotificationManager
     */
    sendSMSNotification(type: 'booking_confirmation' | 'payment_confirmation' | 'booking_reminder' | 'weather_alert' | 'booking_cancellation', data: {
        customerId: string;
        customerName: string;
        customerPhone: string;
        bookingId: string;
        [key: string]: any;
    }): Promise<void>;
    /**
     * Phase 7: Get customer SMS preferences
     */
    getCustomerSMSPreferences(customerId: string): Promise<{
        smsEnabled: boolean;
        bookingConfirmations: boolean;
        reminders: boolean;
        weatherAlerts: boolean;
        language: 'tr' | 'en';
    }>;
    /**
     * Phase 7: Update customer SMS preferences
     */
    updateCustomerSMSPreferences(customerId: string, preferences: {
        smsEnabled?: boolean;
        bookingConfirmations?: boolean;
        reminders?: boolean;
        weatherAlerts?: boolean;
        language?: 'tr' | 'en';
    }): Promise<void>;
    /**
     * Format payment method for display
     */
    private formatPaymentMethod;
    /**
     * Save notification log to database
     */
    private saveNotificationLog;
}
export default NotificationService;
