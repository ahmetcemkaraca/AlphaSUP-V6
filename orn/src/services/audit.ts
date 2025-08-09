/**
 * Audit Service - System Activity Logging
 * Sistem aktivite kayıtları ve denetim izleri
 */

import { firestore } from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Audit log interface
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

export class AuditService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = firestore();
  }

  /**
   * Log audit event
   */
  async log(event: {
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
  }): Promise<void> {
    try {
      const auditLogData = {
        id: uuidv4(),
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
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Get audit logs for resource
   */
  async getLogsForResource(
    resource: string,
    resourceId: string
  ): Promise<AuditLog[]> {
    try {
      const snapshot = await this.db
        .collection('audit_logs')
        .where('resource', '==', resource)
        .where('resourceId', '==', resourceId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      return snapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for user
   */
  async getLogsForUser(userId: string): Promise<AuditLog[]> {
    try {
      const snapshot = await this.db
        .collection('audit_logs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      return snapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
      console.error('Failed to get user audit logs:', error);
      return [];
    }
  }
}

export default AuditService;
