/**
 * Scheduled Functions - SMS Notifications
 * AlphaSUP - Phase 7 SMS Integration
 * Zamanlı SMS bildirimleri için Cloud Functions
 */
/**
 * 🚧 Phase 7 - TODO: Implement booking reminder SMS scheduler
 * Runs every hour to check for bookings that need reminders
 */
export declare const sendBookingReminders: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement weather alert SMS scheduler
 * Runs twice daily to check weather conditions and send alerts
 */
export declare const sendWeatherAlerts: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement arrival instruction SMS scheduler
 * Runs every 30 minutes to send arrival instructions (2 hours before service)
 */
export declare const sendArrivalInstructions: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement daily SMS analytics aggregation
 * Runs daily at midnight to aggregate SMS statistics
 */
export declare const aggregateSMSAnalytics: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement SMS retry mechanism
 * Runs every 15 minutes to retry failed SMS messages
 */
export declare const retrySMSMessages: import("firebase-functions/v2/scheduler").ScheduleFunction;
