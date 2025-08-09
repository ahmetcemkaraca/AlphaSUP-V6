/**
 * Scheduled Functions - SMS Notifications
 * AlphaSUP - Phase 7 SMS Integration
 * Zamanlı SMS bildirimleri için Cloud Functions
 */
/**
 * 🚧 Phase 7 - TODO: Implement booking reminder SMS scheduler
 * Runs every 4 hours to check for bookings that need reminders (cost optimized)
 */
export declare const sendBookingReminders: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement weather alert SMS scheduler
 * Runs twice daily to check weather conditions and send alerts
 */
export declare const sendWeatherAlerts: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement arrival instruction SMS scheduler
 * Runs every 2 hours to send arrival instructions (2 hours before service) - cost optimized
 */
export declare const sendArrivalInstructions: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement daily SMS analytics aggregation
 * Runs daily at midnight to aggregate SMS statistics
 */
export declare const aggregateSMSAnalytics: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * 🚧 Phase 7 - TODO: Implement SMS retry mechanism
 * Runs every 1 hour to retry failed SMS messages - cost optimized
 */
export declare const retrySMSMessages: import("firebase-functions/v2/scheduler").ScheduleFunction;
