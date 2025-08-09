/**
 * Notification Service for AlphaSUP
 *
 * Handles all types of notifications including SMS, email, and in-app notifications
 * Integrated with VatanSMS for cost-effective Turkish SMS delivery
 *
 * @version 3.0.0
 */
export declare const SMS_TEMPLATES: {
    BOOKING_CONFIRMATION: (customerName: string, bookingId: string, date: string, time: string) => string;
    BOOKING_REMINDER: (customerName: string, bookingId: string, date: string, time: string) => string;
    BOOKING_CANCELLATION: (customerName: string, bookingId: string) => string;
    WEATHER_ALERT: (customerName: string, bookingId: string, weatherInfo: string) => string;
    PAYMENT_CONFIRMATION: (customerName: string, amount: string, bookingId: string) => string;
    EQUIPMENT_READY: (customerName: string, bookingId: string, equipmentList: string) => string;
    CUSTOM_MESSAGE: (message: string) => string;
};
/**
 * Sends booking confirmation SMS
 */
export declare const sendBookingConfirmationSms: (customerPhone: string, customerName: string, bookingId: string, customerId?: string) => Promise<void>;
/**
 * Sends booking reminder SMS
 */
export declare const sendBookingReminderSms: (customerPhone: string, customerName: string, bookingId: string, customerId?: string) => Promise<void>;
/**
 * Sends booking cancellation SMS
 */
export declare const sendBookingCancellationSms: (customerPhone: string, customerName: string, bookingId: string, customerId?: string) => Promise<void>;
/**
 * Sends payment confirmation SMS
 */
export declare const sendPaymentConfirmationSms: (customerPhone: string, customerName: string, amount: number, bookingId: string, customerId?: string) => Promise<void>;
/**
 * Sends weather alert SMS
 */
export declare const sendWeatherAlertSms: (customerPhone: string, customerName: string, bookingId: string, weatherInfo: string, customerId?: string) => Promise<void>;
/**
 * Sends bulk SMS to multiple customers
 */
export declare const sendBulkNotificationSms: (recipients: Array<{
    phone: string;
    name: string;
    customerId?: string;
}>, templateType: keyof typeof SMS_TEMPLATES, templateData?: any) => Promise<void>;
/**
 * Sends custom SMS message
 */
export declare const sendCustomSms: (customerPhone: string, message: string, customerId?: string, bookingId?: string) => Promise<void>;
/**
 * NotificationService Class
 * Wrapper class for notification functions to provide object-oriented interface
 */
export declare class NotificationService {
    constructor();
    /**
     * Send points earned notification
     */
    sendPointsEarnedNotification(customerId: string, points: number): Promise<void>;
    /**
     * Send reward redeemed notification
     */
    sendRewardRedeemedNotification(customerId: string, reward: any, redemptionId: string): Promise<void>;
    /**
     * Send tier upgrade notification
     */
    sendTierUpgradeNotification(customerId: string, newTier: any): Promise<void>;
    /**
     * Send general notification
     */
    sendNotification(customerId: string, message: string, type?: string): Promise<void>;
}
//# sourceMappingURL=notificationService.d.ts.map