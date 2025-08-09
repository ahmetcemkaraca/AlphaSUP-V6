"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSAnalyticsService = exports.SMSService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const smsService_1 = require("./smsService");
/**
 * Enhanced SMS Service for Admin Operations
 * Provides comprehensive SMS management functionality
 */
class SMSService {
    constructor() {
        this.db = admin.firestore();
        this.templatesCollection = this.db.collection('smsTemplates');
        this.messagesCollection = this.db.collection('smsMessages');
    }
    /**
     * Send SMS with proper logging and tracking
     */
    async sendSMS(options) {
        try {
            const result = await (0, smsService_1.sendSms)(options.to, options.message);
            // Log the SMS to Firestore
            const smsRecord = {
                recipientPhone: options.to,
                content: options.message,
                type: options.type,
                status: result.status ? 'sent' : 'failed',
                priority: 'normal',
                provider: 'vatansms',
                attempts: 1,
                maxAttempts: 3,
                messageLength: options.message.length,
                messageSegments: Math.ceil(options.message.length / 160),
                cost: result.data?.cost || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...(options.metadata && { metadata: options.metadata })
            };
            const docRef = await this.messagesCollection.add(smsRecord);
            return {
                success: result.status,
                messageId: docRef.id,
                cost: result.data?.cost || 0,
                error: result.status ? undefined : result.message
            };
        }
        catch (error) {
            console.error('Error in SMS send:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Send bulk SMS with batch processing
     */
    async sendBulkSMS(options) {
        try {
            const result = await (0, smsService_1.sendBulkSms)(options.phoneNumbers, options.message);
            // Process results and log each message
            const results = [];
            const batchId = `bulk_${Date.now()}`;
            for (const phone of options.phoneNumbers) {
                const smsRecord = {
                    recipientPhone: phone,
                    content: options.message,
                    type: 'promotional',
                    status: result.status ? 'sent' : 'failed',
                    priority: 'normal',
                    provider: 'vatansms',
                    attempts: 1,
                    maxAttempts: 3,
                    messageLength: options.message.length,
                    messageSegments: Math.ceil(options.message.length / 160),
                    cost: (result.data?.cost || 0) / options.phoneNumbers.length,
                    scheduledAt: options.scheduledAt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    metadata: { ...options.metadata, batchId }
                };
                await this.messagesCollection.add(smsRecord);
                results.push({ phone, success: result.status });
            }
            return {
                successCount: result.status ? options.phoneNumbers.length : 0,
                failureCount: result.status ? 0 : options.phoneNumbers.length,
                results
            };
        }
        catch (error) {
            console.error('Error in bulk SMS send:', error);
            return {
                successCount: 0,
                failureCount: options.phoneNumbers.length,
                results: []
            };
        }
    }
    /**
     * Get all SMS templates
     */
    async getAllTemplates() {
        try {
            const snapshot = await this.templatesCollection
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Error getting templates:', error);
            return [];
        }
    }
    /**
     * Save (create/update) SMS template
     */
    async saveTemplate(template) {
        try {
            const templateData = {
                ...template,
                type: template.type || 'promotional',
                language: template.language || 'tr',
                variables: template.variables || [],
                maxLength: template.content.length,
                priority: template.priority || 'normal',
                isActive: template.isActive !== false,
                version: template.version || 1,
                updatedAt: new Date()
            };
            if (template.id) {
                // Update existing template
                await this.templatesCollection.doc(template.id).update(templateData);
                return { id: template.id, ...templateData };
            }
            else {
                // Create new template
                templateData.createdAt = new Date();
                templateData.createdBy = template.updatedBy;
                const docRef = await this.templatesCollection.add(templateData);
                return { id: docRef.id, ...templateData };
            }
        }
        catch (error) {
            console.error('Error saving template:', error);
            throw new Error('Failed to save template');
        }
    }
    /**
     * Delete SMS template
     */
    async deleteTemplate(templateId) {
        try {
            await this.templatesCollection.doc(templateId).delete();
        }
        catch (error) {
            console.error('Error deleting template:', error);
            throw new Error('Failed to delete template');
        }
    }
    /**
     * Get account balance from VatanSMS
     */
    async getAccountBalance() {
        try {
            const userInfo = await (0, smsService_1.getUserInfo)();
            if (userInfo.status && userInfo.data) {
                return {
                    amount: userInfo.data.balance || 0,
                    currency: 'TRY',
                    lowBalanceThreshold: 50 // 50 TL threshold
                };
            }
            return {
                amount: 0,
                currency: 'TRY',
                lowBalanceThreshold: 50
            };
        }
        catch (error) {
            console.error('Error getting account balance:', error);
            return {
                amount: 0,
                currency: 'TRY',
                lowBalanceThreshold: 50
            };
        }
    }
    /**
     * Get account limits
     */
    async getAccountLimits() {
        try {
            // Get today's usage
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayQuery = await this.messagesCollection
                .where('createdAt', '>=', startOfDay)
                .where('createdAt', '<', new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000))
                .get();
            const dailyUsage = todayQuery.size;
            const dailyLimit = 1000; // Default daily limit
            return {
                dailyRemaining: Math.max(0, dailyLimit - dailyUsage),
                monthlyLimit: 30000, // Default monthly limit
                dailyLimit
            };
        }
        catch (error) {
            console.error('Error getting account limits:', error);
            return {
                dailyRemaining: 1000,
                monthlyLimit: 30000,
                dailyLimit: 1000
            };
        }
    }
    /**
     * Configure alert settings
     */
    async configureAlert(config) {
        try {
            const alertsCollection = this.db.collection('smsAlerts');
            await alertsCollection.doc(config.type).set({
                ...config,
                updatedAt: new Date()
            });
        }
        catch (error) {
            console.error('Error configuring alert:', error);
            throw new Error('Failed to configure alert');
        }
    }
}
exports.SMSService = SMSService;
/**
 * SMS Analytics Service for reporting and insights
 */
class SMSAnalyticsService {
    constructor() {
        this.db = admin.firestore();
        this.messagesCollection = this.db.collection('smsMessages');
        this.analyticsCollection = this.db.collection('smsAnalytics');
    }
    /**
     * Get SMS statistics for a date range
     */
    async getSMSStats(startDate, endDate) {
        try {
            const query = await this.messagesCollection
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate)
                .get();
            let totalSent = 0;
            let totalDelivered = 0;
            let totalFailed = 0;
            let totalCost = 0;
            query.docs.forEach(doc => {
                const data = doc.data();
                totalSent++;
                totalCost += data.cost || 0;
                if (data.status === 'delivered' || data.status === 'sent') {
                    totalDelivered++;
                }
                else if (data.status === 'failed') {
                    totalFailed++;
                }
            });
            return {
                totalSent,
                totalDelivered,
                totalFailed,
                totalCost,
                deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
            };
        }
        catch (error) {
            console.error('Error getting SMS stats:', error);
            return {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0,
                totalCost: 0,
                deliveryRate: 0
            };
        }
    }
    /**
     * Get delivery rates for a period
     */
    async getDeliveryRates(startDate, endDate) {
        try {
            const query = await this.messagesCollection
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate)
                .get();
            const stats = {
                overall: { sent: 0, delivered: 0 },
                byType: {},
                byDay: {}
            };
            query.docs.forEach(doc => {
                const data = doc.data();
                const dateKey = data.createdAt.toDate().toISOString().split('T')[0];
                const type = data.type || 'unknown';
                // Overall stats
                stats.overall.sent++;
                if (data.status === 'delivered' || data.status === 'sent') {
                    stats.overall.delivered++;
                }
                // By type stats
                if (!stats.byType[type]) {
                    stats.byType[type] = { sent: 0, delivered: 0 };
                }
                stats.byType[type].sent++;
                if (data.status === 'delivered' || data.status === 'sent') {
                    stats.byType[type].delivered++;
                }
                // By day stats
                if (!stats.byDay[dateKey]) {
                    stats.byDay[dateKey] = { sent: 0, delivered: 0 };
                }
                stats.byDay[dateKey].sent++;
                if (data.status === 'delivered' || data.status === 'sent') {
                    stats.byDay[dateKey].delivered++;
                }
            });
            // Calculate rates
            const overallRate = stats.overall.sent > 0 ?
                (stats.overall.delivered / stats.overall.sent) * 100 : 0;
            const byTypeRates = {};
            Object.keys(stats.byType).forEach(type => {
                const typeStats = stats.byType[type];
                if (typeStats && typeof typeStats.sent === 'number' && typeof typeStats.delivered === 'number') {
                    byTypeRates[type] = typeStats.sent > 0 ? (typeStats.delivered / typeStats.sent) * 100 : 0;
                }
                else {
                    byTypeRates[type] = 0;
                }
            });
            const byDayRates = Object.keys(stats.byDay).map(date => {
                const dayStats = stats.byDay[date];
                if (dayStats && typeof dayStats.sent === 'number' && typeof dayStats.delivered === 'number') {
                    return {
                        date,
                        rate: dayStats.sent > 0 ? (dayStats.delivered / dayStats.sent) * 100 : 0
                    };
                }
                else {
                    return {
                        date,
                        rate: 0
                    };
                }
            }).sort((a, b) => a.date.localeCompare(b.date));
            return {
                overall: overallRate,
                byType: byTypeRates,
                byDay: byDayRates
            };
        }
        catch (error) {
            console.error('Error getting delivery rates:', error);
            return {
                overall: 0,
                byType: {},
                byDay: []
            };
        }
    }
    /**
     * Get recent failures
     */
    async getRecentFailures(limit = 50) {
        try {
            const query = await this.messagesCollection
                .where('status', '==', 'failed')
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return query.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    phone: data.recipientPhone,
                    content: data.content,
                    error: data.lastError || 'Unknown error',
                    createdAt: data.createdAt.toDate()
                };
            });
        }
        catch (error) {
            console.error('Error getting recent failures:', error);
            return [];
        }
    }
    /**
     * Get detailed statistics with filtering and grouping
     */
    async getDetailedStatistics(options) {
        try {
            let query = this.messagesCollection
                .where('createdAt', '>=', options.startDate)
                .where('createdAt', '<=', options.endDate);
            if (options.messageType) {
                query = query.where('type', '==', options.messageType);
            }
            if (options.status) {
                query = query.where('status', '==', options.status);
            }
            const snapshot = await query.get();
            // Group data based on the groupBy parameter
            const grouped = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const date = data.createdAt.toDate();
                let key;
                switch (options.groupBy) {
                    case 'hour':
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
                        break;
                    case 'day':
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        break;
                    case 'week':
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
                        break;
                    case 'month':
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        break;
                    default:
                        key = 'total';
                }
                if (!grouped[key]) {
                    grouped[key] = {
                        period: key,
                        totalSent: 0,
                        totalDelivered: 0,
                        totalFailed: 0,
                        totalCost: 0,
                        byType: {}
                    };
                }
                const group = grouped[key];
                const messageType = data.type || 'unknown';
                group.totalSent++;
                group.totalCost += data.cost || 0;
                if (data.status === 'delivered' || data.status === 'sent') {
                    group.totalDelivered++;
                }
                else if (data.status === 'failed') {
                    group.totalFailed++;
                }
                if (!group.byType[messageType]) {
                    group.byType[messageType] = { sent: 0, delivered: 0, failed: 0, cost: 0 };
                }
                group.byType[messageType].sent++;
                group.byType[messageType].cost += data.cost || 0;
                if (data.status === 'delivered' || data.status === 'sent') {
                    group.byType[messageType].delivered++;
                }
                else if (data.status === 'failed') {
                    group.byType[messageType].failed++;
                }
            });
            // Convert to array and add delivery rates
            const result = Object.values(grouped).map((group) => ({
                ...group,
                deliveryRate: group.totalSent > 0 ? (group.totalDelivered / group.totalSent) * 100 : 0,
                byType: Object.keys(group.byType).reduce((acc, type) => {
                    const typeStats = group.byType[type];
                    acc[type] = {
                        ...typeStats,
                        deliveryRate: typeStats.sent > 0 ? (typeStats.delivered / typeStats.sent) * 100 : 0
                    };
                    return acc;
                }, {})
            }));
            // Sort by period
            result.sort((a, b) => a.period.localeCompare(b.period));
            return result;
        }
        catch (error) {
            console.error('Error getting detailed statistics:', error);
            return [];
        }
    }
    /**
     * Get current month usage
     */
    async getCurrentMonthUsage() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const stats = await this.getSMSStats(startOfMonth, now);
            const monthlyLimit = 30000; // Default monthly limit
            return {
                count: stats.totalSent,
                cost: stats.totalCost,
                percentage: (stats.totalSent / monthlyLimit) * 100,
                limit: monthlyLimit
            };
        }
        catch (error) {
            console.error('Error getting current month usage:', error);
            return {
                count: 0,
                cost: 0,
                percentage: 0,
                limit: 30000
            };
        }
    }
    /**
     * Get delivery reports with pagination
     */
    async getDeliveryReports(filters, page = 1, limit = 50) {
        try {
            let query = this.messagesCollection.orderBy('createdAt', 'desc');
            if (filters.startDate) {
                query = query.where('createdAt', '>=', filters.startDate);
            }
            if (filters.endDate) {
                query = query.where('createdAt', '<=', filters.endDate);
            }
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.phoneNumber) {
                query = query.where('recipientPhone', '==', filters.phoneNumber);
            }
            // Get total count for pagination
            const totalSnapshot = await query.get();
            const totalCount = totalSnapshot.size;
            // Get paginated results
            const offset = (page - 1) * limit;
            const paginatedQuery = query.offset(offset).limit(limit);
            const snapshot = await paginatedQuery.get();
            const reports = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                sentAt: doc.data().sentAt?.toDate(),
                deliveredAt: doc.data().deliveredAt?.toDate(),
                scheduledAt: doc.data().scheduledAt?.toDate()
            }));
            return {
                reports,
                totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit)
            };
        }
        catch (error) {
            console.error('Error getting delivery reports:', error);
            return {
                reports: [],
                totalCount: 0,
                page: 1,
                totalPages: 0
            };
        }
    }
    /**
     * Export SMS data
     */
    async exportSMSData(filters, format) {
        try {
            let query = this.messagesCollection
                .where('createdAt', '>=', filters.startDate)
                .where('createdAt', '<=', filters.endDate)
                .orderBy('createdAt', 'desc');
            if (filters.type === 'successful') {
                query = query.where('status', 'in', ['sent', 'delivered']);
            }
            else if (filters.type === 'failed') {
                query = query.where('status', '==', 'failed');
            }
            const snapshot = await query.get();
            const data = snapshot.docs.map(doc => {
                const smsData = doc.data();
                return {
                    'Message ID': doc.id,
                    'Phone': smsData.recipientPhone,
                    'Content': smsData.content,
                    'Type': smsData.type,
                    'Status': smsData.status,
                    'Cost': smsData.cost || 0,
                    'Attempts': smsData.attempts,
                    'Created At': smsData.createdAt?.toDate()?.toISOString(),
                    'Sent At': smsData.sentAt?.toDate()?.toISOString() || '',
                    'Delivered At': smsData.deliveredAt?.toDate()?.toISOString() || '',
                    'Error': smsData.lastError || ''
                };
            });
            if (format === 'csv') {
                return this.generateCSV(data);
            }
            else {
                return this.generateExcel(data);
            }
        }
        catch (error) {
            console.error('Error exporting SMS data:', error);
            throw new Error('Failed to export SMS data');
        }
    }
    /**
     * Generate CSV from data
     */
    generateCSV(data) {
        if (data.length === 0) {
            return Buffer.from('No data available');
        }
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Escape commas and quotes in CSV
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            }).join(','))
        ].join('\n');
        return Buffer.from(csvContent, 'utf-8');
    }
    /**
     * Generate Excel from data
     */
    generateExcel(data) {
        // This is a simplified Excel generation
        // In a real implementation, you would use a library like 'xlsx'
        const csvContent = this.generateCSV(data);
        return csvContent; // Return CSV for now, can be enhanced with proper Excel library
    }
}
exports.SMSAnalyticsService = SMSAnalyticsService;
//# sourceMappingURL=smsAdminService.js.map