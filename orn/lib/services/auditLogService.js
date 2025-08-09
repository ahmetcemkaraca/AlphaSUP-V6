"use strict";
/**
 * Enhanced Audit Log Service for Functions
 * Provides advanced audit logging with optimized storage and cross-collection relationships
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = exports.AuditLogService = exports.UserRole = exports.AuditSeverity = exports.AuditResource = exports.AuditAction = void 0;
const firestore_1 = require("firebase-admin/firestore");
// Enum definitions (duplicated for functions workspace)
var AuditAction;
(function (AuditAction) {
    // Customer actions
    AuditAction["CUSTOMER_PROFILE_CREATED"] = "CUSTOMER_PROFILE_CREATED";
    AuditAction["CUSTOMER_PROFILE_UPDATED"] = "CUSTOMER_PROFILE_UPDATED";
    AuditAction["CUSTOMER_PROFILE_DELETED"] = "CUSTOMER_PROFILE_DELETED";
    AuditAction["CUSTOMER_LOGIN"] = "CUSTOMER_LOGIN";
    AuditAction["CUSTOMER_LOGOUT"] = "CUSTOMER_LOGOUT";
    AuditAction["CUSTOMER_PHONE_VERIFIED"] = "CUSTOMER_PHONE_VERIFIED";
    AuditAction["CUSTOMER_EMAIL_VERIFIED"] = "CUSTOMER_EMAIL_VERIFIED";
    AuditAction["CUSTOMER_DATA_EXPORTED"] = "CUSTOMER_DATA_EXPORTED";
    // Admin actions
    AuditAction["ADMIN_LOGIN"] = "ADMIN_LOGIN";
    AuditAction["ADMIN_LOGOUT"] = "ADMIN_LOGOUT";
    AuditAction["ADMIN_SERVICE_CREATED"] = "ADMIN_SERVICE_CREATED";
    AuditAction["ADMIN_SERVICE_UPDATED"] = "ADMIN_SERVICE_UPDATED";
    AuditAction["ADMIN_SERVICE_DELETED"] = "ADMIN_SERVICE_DELETED";
    AuditAction["ADMIN_BOOKING_UPDATED"] = "ADMIN_BOOKING_UPDATED";
    AuditAction["ADMIN_CUSTOMER_UPDATED"] = "ADMIN_CUSTOMER_UPDATED";
    AuditAction["ADMIN_SETTINGS_UPDATED"] = "ADMIN_SETTINGS_UPDATED";
    // Booking actions
    AuditAction["BOOKING_CREATED"] = "BOOKING_CREATED";
    AuditAction["BOOKING_UPDATED"] = "BOOKING_UPDATED";
    AuditAction["BOOKING_CANCELLED"] = "BOOKING_CANCELLED";
    AuditAction["BOOKING_COMPLETED"] = "BOOKING_COMPLETED";
    // Payment actions
    AuditAction["PAYMENT_INITIATED"] = "PAYMENT_INITIATED";
    AuditAction["PAYMENT_COMPLETED"] = "PAYMENT_COMPLETED";
    AuditAction["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    AuditAction["PAYMENT_REFUNDED"] = "PAYMENT_REFUNDED";
    // Service actions
    AuditAction["SERVICE_VIEWED"] = "SERVICE_VIEWED";
    AuditAction["SERVICE_BOOKED"] = "SERVICE_BOOKED";
    // System actions
    AuditAction["SYSTEM_ERROR"] = "SYSTEM_ERROR";
    AuditAction["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditResource;
(function (AuditResource) {
    AuditResource["CUSTOMER"] = "customer";
    AuditResource["ADMIN"] = "admin";
    AuditResource["SERVICE"] = "service";
    AuditResource["BOOKING"] = "booking";
    AuditResource["PAYMENT"] = "payment";
    AuditResource["AVAILABILITY"] = "availability";
    AuditResource["NOTIFICATION"] = "notification";
    AuditResource["SYSTEM"] = "system";
})(AuditResource || (exports.AuditResource = AuditResource = {}));
var AuditSeverity;
(function (AuditSeverity) {
    AuditSeverity["LOW"] = "low";
    AuditSeverity["MEDIUM"] = "medium";
    AuditSeverity["HIGH"] = "high";
    AuditSeverity["CRITICAL"] = "critical";
})(AuditSeverity || (exports.AuditSeverity = AuditSeverity = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["USER"] = "user";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
class AuditLogService {
    constructor(db) {
        this.sequenceCounters = new Map();
        this.db = db;
    }
    /**
     * Remove undefined fields from object to prevent Firestore errors
     */
    removeUndefinedFields(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const cleaned = this.removeUndefinedFields(value);
                    if (Object.keys(cleaned).length > 0) {
                        result[key] = cleaned;
                    }
                }
                else {
                    result[key] = value;
                }
            }
        }
        return result;
    }
    /**
     * Generate unique audit log ID with unix timestamp + 7-digit sequence
     * Format: {unix_timestamp}_{7_digit_sequence}
     * Example: 1722276000_0000001
     */
    async generateAuditId() {
        const now = Math.floor(Date.now() / 1000); // Unix timestamp
        // Get current sequence for this timestamp
        let sequence = this.sequenceCounters.get(now) || 0;
        sequence += 1;
        this.sequenceCounters.set(now, sequence);
        // Clean old sequences (older than 1 hour)
        const oneHourAgo = now - 3600;
        const timestampsToDelete = [];
        this.sequenceCounters.forEach((value, timestamp) => {
            if (timestamp < oneHourAgo) {
                timestampsToDelete.push(timestamp);
            }
        });
        timestampsToDelete.forEach(timestamp => {
            this.sequenceCounters.delete(timestamp);
        });
        // Format sequence as 7-digit string
        const paddedSequence = sequence.toString().padStart(7, '0');
        return `${now}_${paddedSequence}`;
    }
    /**
     * Create optimized audit log entry
     * Uses efficient storage patterns and relationship mapping
     */
    async createAuditLog(logData) {
        try {
            const auditId = await this.generateAuditId();
            const timestamp = Math.floor(Date.now() / 1000);
            // Calculate risk score based on action and context
            const riskScore = this.calculateRiskScore(logData);
            // Determine severity if not provided
            const severity = logData.severity || this.determineSeverity(logData.action, riskScore);
            // Create optimized audit log entry (filter undefined values)
            const auditLogEntry = this.removeUndefinedFields({
                id: auditId,
                userId: logData.userId,
                userRole: logData.userRole,
                userEmail: logData.userEmail,
                action: logData.action,
                resource: logData.resource,
                resourceId: logData.resourceId,
                timestamp,
                ip: logData.ip,
                userAgent: logData.userAgent,
                sessionId: logData.sessionId,
                details: logData.details,
                request: logData.request,
                response: logData.response,
                severity,
                risk_score: riskScore,
                relationships: logData.relationships,
                tags: logData.tags || [],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // Add security flags if needed
            if (riskScore > 70) {
                auditLogEntry.flags = auditLogEntry.flags || [];
                auditLogEntry.flags.push('high_risk');
            }
            // Store in main audit logs collection
            await this.db.collection('auditLogs').doc(auditId).set(auditLogEntry);
            // Create efficient indexes for quick lookups
            await this.createRelationshipIndexes(auditLogEntry);
            // Create daily summary for analytics
            await this.updateDailySummary(auditLogEntry);
            return auditId;
        }
        catch (error) {
            console.error('Error creating audit log:', error);
            throw error;
        }
    }
    /**
     * Create relationship indexes for cross-collection queries
     */
    async createRelationshipIndexes(auditLog) {
        const batch = this.db.batch();
        // User activity index
        if (auditLog.userId) {
            const userActivityRef = this.db
                .collection('auditIndexes')
                .doc('userActivities')
                .collection(auditLog.userId)
                .doc(auditLog.id);
            batch.set(userActivityRef, {
                auditId: auditLog.id,
                action: auditLog.action,
                resource: auditLog.resource,
                timestamp: auditLog.timestamp,
                severity: auditLog.severity,
                riskScore: auditLog.risk_score
            });
        }
        // Resource activity index
        if (auditLog.resourceId) {
            const resourceActivityRef = this.db
                .collection('auditIndexes')
                .doc('resourceActivities')
                .collection(auditLog.resource)
                .doc(`${auditLog.resourceId}_${auditLog.id}`);
            batch.set(resourceActivityRef, {
                auditId: auditLog.id,
                resourceId: auditLog.resourceId,
                action: auditLog.action,
                userId: auditLog.userId,
                timestamp: auditLog.timestamp
            });
        }
        // Relationship indexes
        if (auditLog.relationships) {
            const relationships = auditLog.relationships;
            Object.entries(relationships).forEach(([relType, relId]) => {
                if (relId) {
                    const relationshipRef = this.db
                        .collection('auditIndexes')
                        .doc('relationships')
                        .collection(relType)
                        .doc(`${relId}_${auditLog.id}`);
                    batch.set(relationshipRef, {
                        auditId: auditLog.id,
                        [relType]: relId,
                        action: auditLog.action,
                        timestamp: auditLog.timestamp
                    });
                }
            });
        }
        await batch.commit();
    }
    /**
     * Update daily summary for analytics and reporting
     */
    async updateDailySummary(auditLog) {
        const dateKey = new Date(auditLog.timestamp * 1000).toISOString().split('T')[0];
        if (!dateKey) {
            console.error('Failed to generate dateKey for audit log summary');
            return;
        }
        const summaryRef = this.db.collection('auditSummaries').doc(dateKey);
        await summaryRef.set({
            date: dateKey,
            totalLogs: firestore_1.FieldValue.increment(1),
            [`actionCounts.${auditLog.action}`]: firestore_1.FieldValue.increment(1),
            [`resourceCounts.${auditLog.resource}`]: firestore_1.FieldValue.increment(1),
            [`severityCounts.${auditLog.severity}`]: firestore_1.FieldValue.increment(1),
            [`userCounts.${auditLog.userId || 'anonymous'}`]: firestore_1.FieldValue.increment(1),
            totalRiskScore: firestore_1.FieldValue.increment(auditLog.risk_score || 0),
            lastUpdated: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    /**
     * Calculate risk score based on action and context
     */
    calculateRiskScore(logData) {
        let score = 0;
        // Base score by action type
        const actionRisks = {
            [AuditAction.CUSTOMER_PROFILE_DELETED]: 80,
            [AuditAction.ADMIN_SERVICE_DELETED]: 70,
            [AuditAction.PAYMENT_FAILED]: 60,
            [AuditAction.ADMIN_SETTINGS_UPDATED]: 50,
            [AuditAction.CUSTOMER_LOGIN]: 10,
            [AuditAction.SERVICE_VIEWED]: 5
        };
        score += actionRisks[logData.action] || 20;
        // Adjust score based on response status
        if (logData.response?.status >= 400) {
            score += 20;
        }
        // Adjust score based on time of day (higher risk during off-hours)
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
            score += 10;
        }
        // Adjust score based on user role
        if (logData.userRole === UserRole.ADMIN) {
            score += 15;
        }
        return Math.min(score, 100);
    }
    /**
     * Determine severity based on action and risk score
     */
    determineSeverity(action, riskScore) {
        if (riskScore >= 80)
            return AuditSeverity.CRITICAL;
        if (riskScore >= 60)
            return AuditSeverity.HIGH;
        if (riskScore >= 30)
            return AuditSeverity.MEDIUM;
        return AuditSeverity.LOW;
    }
}
exports.AuditLogService = AuditLogService;
// Export convenience functions
const auditLogService = new AuditLogService((0, firestore_1.getFirestore)());
const createAuditLog = (logData) => auditLogService.createAuditLog(logData);
exports.createAuditLog = createAuditLog;
//# sourceMappingURL=auditLogService.js.map