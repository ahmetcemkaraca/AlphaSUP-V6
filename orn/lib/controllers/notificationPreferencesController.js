"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferencesController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const notificationPreferencesService_1 = require("../services/notificationPreferencesService");
/**
 * Customer Notification Preferences Controller
 * Opt-in/opt-out management for all notification types
 */
class NotificationPreferencesController {
    constructor() {
        this.preferencesService = new notificationPreferencesService_1.NotificationPreferencesService();
    }
    /**
     * Get user notification preferences
     */
    async getPreferences(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            const preferences = await this.preferencesService.getUserPreferences(userId);
            res.json({
                success: true,
                message: 'Notification preferences retrieved successfully',
                data: preferences
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update user notification preferences
     */
    async updatePreferences(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            const updates = req.body;
            if (!updates || typeof updates !== 'object') {
                throw new errorHandler_1.ApiError('Invalid preferences data', 400);
            }
            const updatedPreferences = await this.preferencesService.updateUserPreferences(userId, updates);
            res.json({
                success: true,
                message: 'Notification preferences updated successfully',
                data: updatedPreferences
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk update preferences (admin only)
     */
    async bulkUpdatePreferences(req, res, next) {
        try {
            const { userIds, preferences } = req.body;
            if (!req.user?.isAdmin) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            if (!Array.isArray(userIds) || !preferences) {
                throw new errorHandler_1.ApiError('Invalid bulk update data', 400);
            }
            const results = await this.preferencesService.bulkUpdatePreferences(userIds, preferences);
            res.json({
                success: true,
                message: 'Bulk update completed',
                data: results
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get user's notification history - Not implemented in service
     */
    async getNotificationHistory(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            // Placeholder response since method not implemented
            res.json({
                success: true,
                message: 'Notification history not yet implemented',
                data: {
                    notifications: [],
                    total: 0,
                    page: 1,
                    limit: 50
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get notification statistics (admin only)
     */
    async getNotificationStats(req, res, next) {
        try {
            if (!req.user?.isAdmin) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            const stats = await this.preferencesService.getNotificationStatistics();
            res.json({
                success: true,
                message: 'Notification statistics retrieved successfully',
                data: stats
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Export notification preferences (admin only) - Not implemented
     */
    async exportPreferences(req, res, next) {
        try {
            if (!req.user?.isAdmin) {
                throw new errorHandler_1.ApiError('Admin access required', 403);
            }
            res.json({
                success: false,
                message: 'Export functionality not yet implemented'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Test notification delivery - Not implemented
     */
    async testNotification(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            res.json({
                success: false,
                message: 'Test notification functionality not yet implemented'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update GDPR consent - Not implemented
     */
    async updateGDPRConsent(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            res.json({
                success: false,
                message: 'GDPR consent update not yet implemented'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get GDPR consent status - Not implemented
     */
    async getGDPRConsent(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            res.json({
                success: false,
                message: 'GDPR consent retrieval not yet implemented'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Unsubscribe from all notifications
     */
    async unsubscribeAll(req, res, next) {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                throw new errorHandler_1.ApiError('Unauthorized', 401);
            }
            await this.preferencesService.unsubscribeFromAll(userId);
            res.json({
                success: true,
                message: 'Successfully unsubscribed from all notifications'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NotificationPreferencesController = NotificationPreferencesController;
//# sourceMappingURL=notificationPreferencesController.js.map