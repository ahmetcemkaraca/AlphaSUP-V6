/**
 * Scheduled Functions for AlphaSUP
 *
 * Contains time-based tasks such as booking reminders and weather alerts
 * Integrated with VatanSMS for cost-effective SMS delivery
 * Optimized for low-cost operations with smart scheduling
 * Configurable SMS reminder timing via environment variables
 */
import * as functions from 'firebase-functions';
/**
 * Sends booking reminders to customers (configurable timing).
 * Runs twice daily at 9 AM and 6 PM to optimize costs and avoid peak hours
 * Supports configurable reminder timing via environment variables
 */
export declare const sendBookingReminders: functions.CloudFunction<unknown>;
/**
 * Sends weather alerts if conditions are unsafe for upcoming bookings.
 * Runs once daily at 7 PM for next day's bookings
 */
export declare const sendWeatherAlerts: functions.CloudFunction<unknown>;
/**
 * Cleans up old notification logs to save storage costs
 * Runs weekly on Sundays at 2 AM
 */
export declare const cleanupNotificationLogs: functions.CloudFunction<unknown>;
/**
 * Daily SMS cost tracking and alerts
 * Runs daily at 11 PM to track SMS costs
 */
export declare const trackDailySMSCosts: functions.CloudFunction<unknown>;
//# sourceMappingURL=index.d.ts.map