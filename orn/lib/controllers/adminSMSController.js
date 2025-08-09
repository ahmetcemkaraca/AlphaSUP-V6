"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSMSController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const smsAdminService_1 = require("../services/smsAdminService");
/**
 * Admin SMS Management Dashboard Controller
 * Comprehensive SMS system administration
 */
class AdminSMSController {
    constructor() {
        this.smsService = new smsAdminService_1.SMSService();
        this.analyticsService = new smsAdminService_1.SMSAnalyticsService();
    }
    /**
     * Get SMS dashboard overview
     */
    async getDashboardOverview(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const [todayStats, monthStats, accountBalance, deliveryRates, recentFailures] = await Promise.all([
                this.analyticsService.getSMSStats(startOfDay, today),
                this.analyticsService.getSMSStats(startOfMonth, today),
                this.smsService.getAccountBalance(),
                this.analyticsService.getDeliveryRates(startOfMonth, today),
                this.analyticsService.getRecentFailures(50)
            ]);
            res.json({
                success: true,
                data: {
                    overview: {
                        today: todayStats,
                        thisMonth: monthStats,
                        accountBalance,
                        deliveryRates
                    },
                    recentFailures
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get SMS statistics with filtering
     */
    async getSMSStatistics(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { startDate, endDate, messageType, status, groupBy = 'day' } = req.query;
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            const statistics = await this.analyticsService.getDetailedStatistics({
                startDate: start,
                endDate: end,
                messageType: messageType,
                status: status,
                groupBy: groupBy
            });
            res.json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Send test SMS
     */
    async sendTestSMS(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { phoneNumber, message, templateType } = req.body;
            if (!phoneNumber || !message) {
                throw new errorHandler_1.ApiError('Phone number and message are required', 400);
            }
            const result = await this.smsService.sendSMS({
                to: phoneNumber,
                message,
                type: templateType || 'test',
                metadata: {
                    sentByAdmin: req.user.uid,
                    testMessage: true
                }
            });
            res.json({
                success: true,
                message: 'Test SMS sent successfully',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Send bulk SMS
     */
    async sendBulkSMS(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { phoneNumbers, message, templateType, scheduledAt } = req.body;
            if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
                throw new errorHandler_1.ApiError('Phone numbers array is required', 400);
            }
            if (!message) {
                throw new errorHandler_1.ApiError('Message is required', 400);
            }
            const bulkOptions = {
                phoneNumbers,
                message,
                templateType: templateType || 'bulk',
                metadata: {
                    sentByAdmin: req.user.uid,
                    bulkCampaign: true
                }
            };
            if (scheduledAt) {
                bulkOptions.scheduledAt = new Date(scheduledAt);
            }
            const results = await this.smsService.sendBulkSMS(bulkOptions);
            res.json({
                success: true,
                message: `Bulk SMS campaign initiated: ${results.successCount} successful, ${results.failureCount} failed`,
                data: results
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get SMS templates
     */
    async getSMSTemplates(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const templates = await this.smsService.getAllTemplates();
            res.json({
                success: true,
                data: templates
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create/Update SMS template
     */
    async saveSMSTemplate(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { templateId, name, content, variables, isActive } = req.body;
            if (!name || !content) {
                throw new errorHandler_1.ApiError('Template name and content are required', 400);
            }
            const template = await this.smsService.saveTemplate({
                id: templateId,
                name,
                content,
                variables: variables || [],
                isActive: isActive !== false,
                updatedBy: req.user.uid,
                updatedAt: new Date()
            });
            res.json({
                success: true,
                message: templateId ? 'Template updated successfully' : 'Template created successfully',
                data: template
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete SMS template
     */
    async deleteSMSTemplate(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { templateId } = req.params;
            if (!templateId) {
                throw new errorHandler_1.ApiError('Template ID is required', 400);
            }
            await this.smsService.deleteTemplate(templateId);
            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get account balance and usage
     */
    async getAccountInfo(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const [balance, usage, limits] = await Promise.all([
                this.smsService.getAccountBalance(),
                this.analyticsService.getCurrentMonthUsage(),
                this.smsService.getAccountLimits()
            ]);
            res.json({
                success: true,
                data: {
                    balance,
                    usage,
                    limits,
                    alerts: this.generateBalanceAlerts(balance, usage, limits)
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get SMS delivery reports
     */
    async getDeliveryReports(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { startDate, endDate, status, phoneNumber, page = 1, limit = 50 } = req.query;
            const filters = {};
            if (startDate) {
                filters.startDate = new Date(startDate);
            }
            if (endDate) {
                filters.endDate = new Date(endDate);
            }
            if (status) {
                filters.status = status;
            }
            if (phoneNumber) {
                filters.phoneNumber = phoneNumber;
            }
            const reports = await this.analyticsService.getDeliveryReports(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: reports
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Export SMS data
     */
    async exportSMSData(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { startDate, endDate, format = 'csv', type = 'all' } = req.query;
            const filters = {
                startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: endDate ? new Date(endDate) : new Date(),
                type: type
            };
            const exportData = await this.analyticsService.exportSMSData(filters, format);
            res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="sms_report_${Date.now()}.${format}"`);
            res.send(exportData);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Set SMS alerts and notifications
     */
    async setSMSAlerts(req, res, next) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const { alertType, threshold, enabled, recipients } = req.body;
            await this.smsService.configureAlert({
                type: alertType,
                threshold,
                enabled,
                recipients: recipients || [req.user.email || 'admin@alphasup.com'],
                updatedBy: req.user.uid
            });
            res.json({
                success: true,
                message: 'SMS alert configuration updated successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate balance alerts
     */
    generateBalanceAlerts(balance, usage, limits) {
        const alerts = [];
        // Low balance alert
        if (balance.amount < balance.lowBalanceThreshold) {
            alerts.push({
                type: 'low_balance',
                severity: 'warning',
                message: `SMS balance is low: ${balance.amount} ${balance.currency} remaining`
            });
        }
        // High usage alert
        if (usage.percentage > 80) {
            alerts.push({
                type: 'high_usage',
                severity: 'info',
                message: `Monthly SMS usage is at ${usage.percentage}% of limit`
            });
        }
        // Rate limit approaching
        if (limits.dailyRemaining < 100) {
            alerts.push({
                type: 'rate_limit',
                severity: 'warning',
                message: `Daily SMS limit approaching: ${limits.dailyRemaining} SMS remaining`
            });
        }
        return alerts;
    }
}
exports.AdminSMSController = AdminSMSController;
//# sourceMappingURL=adminSMSController.js.map