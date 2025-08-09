import { NotificationType, SMSTemplate } from '../../../shared/src/types/notification';
/**
 * Enhanced SMS Service for Admin Operations
 * Provides comprehensive SMS management functionality
 */
export declare class SMSService {
    private db;
    private templatesCollection;
    private messagesCollection;
    constructor();
    /**
     * Send SMS with proper logging and tracking
     */
    sendSMS(options: {
        to: string;
        message: string;
        type: NotificationType | 'test';
        metadata?: Record<string, any>;
    }): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
        cost?: number;
    }>;
    /**
     * Send bulk SMS with batch processing
     */
    sendBulkSMS(options: {
        phoneNumbers: string[];
        message: string;
        templateType?: string;
        scheduledAt?: Date;
        metadata?: Record<string, any>;
    }): Promise<{
        successCount: number;
        failureCount: number;
        results: any[];
    }>;
    /**
     * Get all SMS templates
     */
    getAllTemplates(): Promise<SMSTemplate[]>;
    /**
     * Save (create/update) SMS template
     */
    saveTemplate(template: Partial<SMSTemplate> & {
        id?: string;
        name: string;
        content: string;
        updatedBy: string;
    }): Promise<SMSTemplate>;
    /**
     * Delete SMS template
     */
    deleteTemplate(templateId: string): Promise<void>;
    /**
     * Get account balance from VatanSMS
     */
    getAccountBalance(): Promise<{
        amount: number;
        currency: string;
        lowBalanceThreshold: number;
    }>;
    /**
     * Get account limits
     */
    getAccountLimits(): Promise<{
        dailyRemaining: number;
        monthlyLimit: number;
        dailyLimit: number;
    }>;
    /**
     * Configure alert settings
     */
    configureAlert(config: {
        type: string;
        threshold: number;
        enabled: boolean;
        recipients: string[];
        updatedBy: string;
    }): Promise<void>;
}
/**
 * SMS Analytics Service for reporting and insights
 */
export declare class SMSAnalyticsService {
    private db;
    private messagesCollection;
    private analyticsCollection;
    constructor();
    /**
     * Get SMS statistics for a date range
     */
    getSMSStats(startDate: Date, endDate: Date): Promise<{
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        totalCost: number;
        deliveryRate: number;
    }>;
    /**
     * Get delivery rates for a period
     */
    getDeliveryRates(startDate: Date, endDate: Date): Promise<{
        overall: number;
        byType: Record<string, number>;
        byDay: Array<{
            date: string;
            rate: number;
        }>;
    }>;
    /**
     * Get recent failures
     */
    getRecentFailures(limit?: number): Promise<Array<{
        id: string;
        phone: string;
        content: string;
        error: string;
        createdAt: Date;
    }>>;
    /**
     * Get detailed statistics with filtering and grouping
     */
    getDetailedStatistics(options: {
        startDate: Date;
        endDate: Date;
        messageType?: string;
        status?: string;
        groupBy: 'hour' | 'day' | 'week' | 'month';
    }): Promise<any>;
    /**
     * Get current month usage
     */
    getCurrentMonthUsage(): Promise<{
        count: number;
        cost: number;
        percentage: number;
        limit: number;
    }>;
    /**
     * Get delivery reports with pagination
     */
    getDeliveryReports(filters: {
        startDate?: Date;
        endDate?: Date;
        status?: string;
        phoneNumber?: string;
    }, page?: number, limit?: number): Promise<{
        reports: any[];
        totalCount: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Export SMS data
     */
    exportSMSData(filters: {
        startDate: Date;
        endDate: Date;
        type: 'all' | 'successful' | 'failed';
    }, format: 'csv' | 'xlsx'): Promise<Buffer>;
    /**
     * Generate CSV from data
     */
    private generateCSV;
    /**
     * Generate Excel from data
     */
    private generateExcel;
}
//# sourceMappingURL=smsAdminService.d.ts.map