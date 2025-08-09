/**
 * Audit Service - System Activity Logging
 * Sistem aktivite kayıtları ve denetim izleri
 */
export interface AuditLog {
    id: string;
    action: string;
    resource: string;
    resourceId: string;
    userId: string;
    userRole?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
    timestamp: string;
    success: boolean;
    errorMessage?: string;
}
export declare class AuditService {
    private db;
    constructor();
    /**
     * Log audit event
     */
    log(event: {
        action: string;
        resource: string;
        resourceId: string;
        userId: string;
        userRole?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: any;
        success?: boolean;
        errorMessage?: string;
    }): Promise<void>;
    /**
     * Get audit logs for resource
     */
    getLogsForResource(resource: string, resourceId: string): Promise<AuditLog[]>;
    /**
     * Get audit logs for user
     */
    getLogsForUser(userId: string): Promise<AuditLog[]>;
}
export default AuditService;
