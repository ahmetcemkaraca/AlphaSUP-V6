"use strict";
/**
 * Environment Configuration for Firebase Functions
 * Provides secure access to environment variables and configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleMapsApiKey = exports.weatherApiKey = exports.apiRateLimitPerMinute = exports.emailRateLimitPerHour = exports.smsRateLimitPerHour = exports.enableDebugMode = exports.enableAuditLogging = exports.enableEmailNotifications = exports.enableSmsNotifications = exports.appVersion = exports.functionsRegion = exports.nodeEnv = exports.sendGridFromEmail = exports.sendGridApiKey = exports.stripeWebhookSecret = exports.stripeSecretKey = exports.vatanSmsSender = exports.vatanSmsApiKey = exports.vatanSmsApiId = exports.firebaseStorageBucket = exports.firebaseProjectId = void 0;
exports.getDevEnvironment = getDevEnvironment;
exports.validateConfig = validateConfig;
const params_1 = require("firebase-functions/params");
// Firebase Configuration
exports.firebaseProjectId = (0, params_1.defineString)('FIREBASE_PROJECT_ID', { default: 'alphasupack' });
exports.firebaseStorageBucket = (0, params_1.defineString)('FIREBASE_STORAGE_BUCKET', { default: 'alphasupack.firebasestorage.app' });
// VatanSMS Configuration (Secrets for production)
exports.vatanSmsApiId = (0, params_1.defineSecret)('VATANSMS_API_ID');
exports.vatanSmsApiKey = (0, params_1.defineSecret)('VATANSMS_API_KEY');
exports.vatanSmsSender = (0, params_1.defineString)('VATANSMS_SENDER', { default: 'ALPHASUP' });
// Stripe Configuration (Secrets for production)
exports.stripeSecretKey = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
exports.stripeWebhookSecret = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
// Email Configuration (Secrets for production)
exports.sendGridApiKey = (0, params_1.defineSecret)('SENDGRID_API_KEY');
exports.sendGridFromEmail = (0, params_1.defineString)('SENDGRID_FROM_EMAIL', { default: 'noreply@alphasupack.com' });
// Application Configuration
exports.nodeEnv = (0, params_1.defineString)('NODE_ENV', { default: 'development' });
exports.functionsRegion = (0, params_1.defineString)('FUNCTIONS_REGION', { default: 'us-central1' });
exports.appVersion = (0, params_1.defineString)('APP_VERSION', { default: '3.0.0' });
// Feature Flags
exports.enableSmsNotifications = (0, params_1.defineBoolean)('ENABLE_SMS_NOTIFICATIONS', { default: true });
exports.enableEmailNotifications = (0, params_1.defineBoolean)('ENABLE_EMAIL_NOTIFICATIONS', { default: true });
exports.enableAuditLogging = (0, params_1.defineBoolean)('ENABLE_AUDIT_LOGGING', { default: true });
exports.enableDebugMode = (0, params_1.defineBoolean)('ENABLE_DEBUG_MODE', { default: false });
// Rate Limiting
exports.smsRateLimitPerHour = (0, params_1.defineInt)('SMS_RATE_LIMIT_PER_HOUR', { default: 100 });
exports.emailRateLimitPerHour = (0, params_1.defineInt)('EMAIL_RATE_LIMIT_PER_HOUR', { default: 500 });
exports.apiRateLimitPerMinute = (0, params_1.defineInt)('API_RATE_LIMIT_PER_MINUTE', { default: 1000 });
// External APIs (Secrets for production)
exports.weatherApiKey = (0, params_1.defineSecret)('WEATHER_API_KEY');
exports.googleMapsApiKey = (0, params_1.defineSecret)('GOOGLE_MAPS_API_KEY');
/**
 * Development environment helper
 * Returns environment variables with fallbacks for local development
 */
function getDevEnvironment() {
    if (process.env['NODE_ENV'] === 'development') {
        return {
            // Firebase
            firebaseProjectId: process.env['FIREBASE_PROJECT_ID'] || 'alphasupack',
            firebaseStorageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || 'alphasupack.firebasestorage.app',
            // VatanSMS
            vatanSmsApiId: process.env['VATANSMS_API_ID'] || '',
            vatanSmsApiKey: process.env['VATANSMS_API_KEY'] || '',
            vatanSmsSender: process.env['VATANSMS_SENDER'] || 'ALPHASUP',
            // Stripe
            stripeSecretKey: process.env['STRIPE_SECRET_KEY'] || '',
            stripeWebhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] || '',
            // Email
            sendGridApiKey: process.env['SENDGRID_API_KEY'] || '',
            sendGridFromEmail: process.env['SENDGRID_FROM_EMAIL'] || 'noreply@alphasupack.com',
            // Feature flags
            enableSmsNotifications: process.env['ENABLE_SMS_NOTIFICATIONS'] === 'true',
            enableEmailNotifications: process.env['ENABLE_EMAIL_NOTIFICATIONS'] === 'true',
            enableAuditLogging: process.env['ENABLE_AUDIT_LOGGING'] === 'true',
            enableDebugMode: process.env['ENABLE_DEBUG_MODE'] === 'true',
            // Rate limits
            smsRateLimitPerHour: parseInt(process.env['SMS_RATE_LIMIT_PER_HOUR'] || '100'),
            emailRateLimitPerHour: parseInt(process.env['EMAIL_RATE_LIMIT_PER_HOUR'] || '500'),
            apiRateLimitPerMinute: parseInt(process.env['API_RATE_LIMIT_PER_MINUTE'] || '1000'),
            // External APIs
            weatherApiKey: process.env['WEATHER_API_KEY'] || '',
            googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY'] || ''
        };
    }
    return null; // Use Firebase params in production
}
/**
 * Configuration validation
 */
function validateConfig() {
    const isDev = process.env['NODE_ENV'] === 'development';
    const config = isDev ? getDevEnvironment() : null;
    const requiredSecrets = [
        'VATANSMS_API_ID',
        'VATANSMS_API_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET'
    ];
    if (isDev && config) {
        const missing = requiredSecrets.filter(key => {
            const envKey = key.toLowerCase().replace(/_/g, '');
            return !config[envKey];
        });
        if (missing.length > 0) {
            console.warn('⚠️  Missing development environment variables:', missing);
        }
    }
    return true;
}
//# sourceMappingURL=environment.js.map