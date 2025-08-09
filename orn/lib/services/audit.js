"use strict";
/**
 * Audit Service - System Activity Logging
 * Sistem aktivite kayıtları ve denetim izleri
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const firebase_admin_1 = require("firebase-admin");
const uuid_1 = require("uuid");
class AuditService {
    constructor() {
        this.db = (0, firebase_admin_1.firestore)();
    }
    /**
     * Log audit event
     */
    async log(event) {
        try {
            const auditLogData = {
                id: (0, uuid_1.v4)(),
                action: event.action,
                resource: event.resource,
                resourceId: event.resourceId,
                userId: event.userId,
                userRole: event.userRole || 'unknown',
                ipAddress: event.ipAddress || 'unknown',
                userAgent: event.userAgent || 'unknown',
                metadata: event.metadata,
                timestamp: new Date().toISOString(),
                success: event.success ?? true,
                ...(event.errorMessage && { errorMessage: event.errorMessage }),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await this.db
                .collection('audit_logs')
                .doc(auditLogData.id)
                .set(auditLogData);
        }
        catch (error) {
            console.error('Failed to log audit event:', error);
            // Don't throw error - audit logging failure shouldn't break the main operation
        }
    }
    /**
     * Get audit logs for resource
     */
    async getLogsForResource(resource, resourceId) {
        try {
            const snapshot = await this.db
                .collection('audit_logs')
                .where('resource', '==', resource)
                .where('resourceId', '==', resourceId)
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Failed to get audit logs:', error);
            return [];
        }
    }
    /**
     * Get audit logs for user
     */
    async getLogsForUser(userId) {
        try {
            const snapshot = await this.db
                .collection('audit_logs')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();
            return snapshot.docs.map(doc => doc.data());
        }
        catch (error) {
            console.error('Failed to get user audit logs:', error);
            return [];
        }
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
//# sourceMappingURL=audit.js.map