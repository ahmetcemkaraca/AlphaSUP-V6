/**
 * Enhanced Audit Log Service for Functions
 * Provides advanced audit logging with optimized storage and cross-collection relationships
 */
import { Firestore } from 'firebase-admin/firestore';
export declare enum AuditAction {
    CUSTOMER_PROFILE_CREATED = "CUSTOMER_PROFILE_CREATED",
    CUSTOMER_PROFILE_UPDATED = "CUSTOMER_PROFILE_UPDATED",
    CUSTOMER_PROFILE_DELETED = "CUSTOMER_PROFILE_DELETED",
    CUSTOMER_LOGIN = "CUSTOMER_LOGIN",
    CUSTOMER_LOGOUT = "CUSTOMER_LOGOUT",
    CUSTOMER_PHONE_VERIFIED = "CUSTOMER_PHONE_VERIFIED",
    CUSTOMER_EMAIL_VERIFIED = "CUSTOMER_EMAIL_VERIFIED",
    CUSTOMER_DATA_EXPORTED = "CUSTOMER_DATA_EXPORTED",
    ADMIN_LOGIN = "ADMIN_LOGIN",
    ADMIN_LOGOUT = "ADMIN_LOGOUT",
    ADMIN_SERVICE_CREATED = "ADMIN_SERVICE_CREATED",
    ADMIN_SERVICE_UPDATED = "ADMIN_SERVICE_UPDATED",
    ADMIN_SERVICE_DELETED = "ADMIN_SERVICE_DELETED",
    ADMIN_BOOKING_UPDATED = "ADMIN_BOOKING_UPDATED",
    ADMIN_CUSTOMER_UPDATED = "ADMIN_CUSTOMER_UPDATED",
    ADMIN_SETTINGS_UPDATED = "ADMIN_SETTINGS_UPDATED",
    BOOKING_CREATED = "BOOKING_CREATED",
    BOOKING_UPDATED = "BOOKING_UPDATED",
    BOOKING_CANCELLED = "BOOKING_CANCELLED",
    BOOKING_COMPLETED = "BOOKING_COMPLETED",
    PAYMENT_INITIATED = "PAYMENT_INITIATED",
    PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
    SERVICE_VIEWED = "SERVICE_VIEWED",
    SERVICE_BOOKED = "SERVICE_BOOKED",
    SYSTEM_ERROR = "SYSTEM_ERROR",
    SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE"
}
export declare enum AuditResource {
    CUSTOMER = "customer",
    ADMIN = "admin",
    SERVICE = "service",
    BOOKING = "booking",
    PAYMENT = "payment",
    AVAILABILITY = "availability",
    NOTIFICATION = "notification",
    SYSTEM = "system"
}
export declare enum AuditSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    USER = "user",
    CUSTOMER = "customer"
}
export interface AuditLog {
    id: string;
    userId?: string;
    userRole?: UserRole;
    userEmail?: string;
    sessionId?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    timestamp: number;
    ip?: string;
    userAgent?: string;
    location?: {
        country?: string;
        city?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    details?: {
        before?: any;
        after?: any;
        metadata?: Record<string, any>;
    };
    request?: {
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: any;
    };
    response?: {
        status: number;
        duration?: number;
        error?: {
            code: string;
            message: string;
        };
    };
    severity: AuditSeverity;
    risk_score?: number;
    flags?: string[];
    relationships?: {
        customerId?: string;
        bookingId?: string;
        serviceId?: string;
        paymentId?: string;
        adminId?: string;
    };
    tags?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export declare class AuditLogService {
    private db;
    private sequenceCounters;
    constructor(db: Firestore);
    /**
     * Remove undefined fields from object to prevent Firestore errors
     */
    private removeUndefinedFields;
    /**
     * Generate unique audit log ID with unix timestamp + 7-digit sequence
     * Format: {unix_timestamp}_{7_digit_sequence}
     * Example: 1722276000_0000001
     */
    private generateAuditId;
    /**
     * Create optimized audit log entry
     * Uses efficient storage patterns and relationship mapping
     */
    createAuditLog(logData: {
        userId?: string;
        userRole?: UserRole;
        userEmail?: string;
        action: AuditAction;
        resource: AuditResource;
        resourceId?: string;
        details?: any;
        request?: {
            method: string;
            url: string;
            headers?: Record<string, string>;
            body?: any;
        };
        response?: {
            status: number;
            duration?: number;
            error?: any;
        };
        ip?: string;
        userAgent?: string;
        sessionId?: string;
        severity?: AuditSeverity;
        relationships?: {
            customerId?: string;
            bookingId?: string;
            serviceId?: string;
            paymentId?: string;
            adminId?: string;
        };
        tags?: string[];
    }): Promise<string>;
    /**
     * Create relationship indexes for cross-collection queries
     */
    private createRelationshipIndexes;
    /**
     * Update daily summary for analytics and reporting
     */
    private updateDailySummary;
    /**
     * Calculate risk score based on action and context
     */
    private calculateRiskScore;
    /**
     * Determine severity based on action and risk score
     */
    private determineSeverity;
}
export declare const createAuditLog: (logData: any) => Promise<string>;
//# sourceMappingURL=auditLogService.d.ts.map