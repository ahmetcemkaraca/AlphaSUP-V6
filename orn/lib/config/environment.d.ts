/**
 * Environment Configuration for Firebase Functions
 * Provides secure access to environment variables and configuration
 */
export declare const firebaseProjectId: import("firebase-functions/lib/params/types").StringParam;
export declare const firebaseStorageBucket: import("firebase-functions/lib/params/types").StringParam;
export declare const vatanSmsApiId: import("firebase-functions/lib/params/types").SecretParam;
export declare const vatanSmsApiKey: import("firebase-functions/lib/params/types").SecretParam;
export declare const vatanSmsSender: import("firebase-functions/lib/params/types").StringParam;
export declare const stripeSecretKey: import("firebase-functions/lib/params/types").SecretParam;
export declare const stripeWebhookSecret: import("firebase-functions/lib/params/types").SecretParam;
export declare const sendGridApiKey: import("firebase-functions/lib/params/types").SecretParam;
export declare const sendGridFromEmail: import("firebase-functions/lib/params/types").StringParam;
export declare const nodeEnv: import("firebase-functions/lib/params/types").StringParam;
export declare const functionsRegion: import("firebase-functions/lib/params/types").StringParam;
export declare const appVersion: import("firebase-functions/lib/params/types").StringParam;
export declare const enableSmsNotifications: import("firebase-functions/lib/params/types").BooleanParam;
export declare const enableEmailNotifications: import("firebase-functions/lib/params/types").BooleanParam;
export declare const enableAuditLogging: import("firebase-functions/lib/params/types").BooleanParam;
export declare const enableDebugMode: import("firebase-functions/lib/params/types").BooleanParam;
export declare const smsRateLimitPerHour: import("firebase-functions/lib/params/types").IntParam;
export declare const emailRateLimitPerHour: import("firebase-functions/lib/params/types").IntParam;
export declare const apiRateLimitPerMinute: import("firebase-functions/lib/params/types").IntParam;
export declare const weatherApiKey: import("firebase-functions/lib/params/types").SecretParam;
export declare const googleMapsApiKey: import("firebase-functions/lib/params/types").SecretParam;
/**
 * Development environment helper
 * Returns environment variables with fallbacks for local development
 */
export declare function getDevEnvironment(): {
    firebaseProjectId: string;
    firebaseStorageBucket: string;
    vatanSmsApiId: string;
    vatanSmsApiKey: string;
    vatanSmsSender: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    sendGridApiKey: string;
    sendGridFromEmail: string;
    enableSmsNotifications: boolean;
    enableEmailNotifications: boolean;
    enableAuditLogging: boolean;
    enableDebugMode: boolean;
    smsRateLimitPerHour: number;
    emailRateLimitPerHour: number;
    apiRateLimitPerMinute: number;
    weatherApiKey: string;
    googleMapsApiKey: string;
} | null;
/**
 * Configuration validation
 */
export declare function validateConfig(): boolean;
//# sourceMappingURL=environment.d.ts.map