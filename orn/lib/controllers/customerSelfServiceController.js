"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSelfServiceController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const customerSelfServiceService_1 = require("../services/customerSelfServiceService");
/**
 * Customer Self-Service Controller
 * Empowering customers with self-service capabilities
 */
class CustomerSelfServiceController {
    constructor() {
        this.selfServiceService = new customerSelfServiceService_1.CustomerSelfServiceService();
    }
    /**
     * Get customer profile and dashboard data
     */
    async getCustomerDashboard(req, res, next) {
        try {
            const customerId = req.user?.uid;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const dashboard = await this.selfServiceService.getCustomerDashboard(customerId);
            res.json({
                success: true,
                data: dashboard
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update customer profile
     */
    async updateCustomerProfile(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const updateData = req.body;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const updatedProfile = await this.selfServiceService.updateCustomerProfile(customerId, updateData);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer booking history with filters
     */
    async getBookingHistory(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const { page = 1, limit = 10, status, dateFrom, dateTo, serviceType } = req.query;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const filters = {
                customerId,
                dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom']) : undefined,
                dateTo: req.query['dateTo'] ? new Date(req.query['dateTo']) : undefined,
                limit: parseInt(limit) || 10,
                offset: (parseInt(page) - 1) * parseInt(limit) || 0
            };
            const bookings = await this.selfServiceService.getCustomerBookingHistory(customerId, parseInt(page), parseInt(limit), filters);
            res.json({
                success: true,
                data: bookings
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer loyalty program details
     */
    async getLoyaltyProgram(req, res, next) {
        try {
            const customerId = req.user?.uid;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const loyaltyData = await this.selfServiceService.getCustomerLoyaltyData(customerId);
            res.json({
                success: true,
                data: loyaltyData
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Redeem loyalty points
     */
    async redeemLoyaltyPoints(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const { points, rewardType, rewardId } = req.body;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const redemption = await this.selfServiceService.redeemLoyaltyPoints(customerId, points, rewardType, rewardId);
            // Send notification - TODO: Implement notification service
            // await this.notificationService.sendLoyaltyRedemptionNotification(customerId, redemption);
            res.json({
                success: true,
                message: 'Points redeemed successfully',
                data: redemption
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer notifications
     */
    async getCustomerNotifications(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const { page = 1, limit = 20, unreadOnly = false } = req.query;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const notifications = await this.selfServiceService.getCustomerNotifications(customerId, parseInt(page), parseInt(limit), unreadOnly === 'true');
            res.json({
                success: true,
                data: notifications
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Mark notifications as read
     */
    async markNotificationsRead(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const { notificationIds } = req.body;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            await this.selfServiceService.markNotificationsRead(customerId, notificationIds);
            res.json({
                success: true,
                message: 'Notifications marked as read'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const preferences = req.body;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const updatedPreferences = await this.selfServiceService.updateNotificationPreferences(customerId, preferences);
            res.json({
                success: true,
                message: 'Notification preferences updated',
                data: updatedPreferences
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer support tickets
     */
    async getSupportTickets(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const { page = 1, limit = 10, status } = req.query;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const tickets = await this.selfServiceService.getCustomerSupportTickets(customerId, parseInt(page), parseInt(limit), status);
            res.json({
                success: true,
                data: tickets
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create support ticket
     */
    async createSupportTicket(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const ticketData = req.body;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const ticket = await this.selfServiceService.createSupportTicket(customerId, ticketData);
            // Send notification to admin - TODO: Implement notification service
            // await this.notificationService.sendNewSupportTicketNotification(ticket);
            res.json({
                success: true,
                message: 'Support ticket created successfully',
                data: ticket
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update customer preferences
     */
    async updateCustomerPreferences(req, res, next) {
        try {
            const customerId = req.user?.uid;
            const preferences = req.body;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const updatedPreferences = await this.selfServiceService.updateCustomerPreferences(customerId, preferences);
            res.json({
                success: true,
                message: 'Preferences updated successfully',
                data: updatedPreferences
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer statistics
     */
    async getCustomerStatistics(req, res, next) {
        try {
            const customerId = req.user?.uid;
            if (!customerId) {
                throw new errorHandler_1.ApiError('Customer authentication required', 401);
            }
            const statistics = await this.selfServiceService.getCustomerStatistics(customerId);
            res.json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerSelfServiceController = CustomerSelfServiceController;
//# sourceMappingURL=customerSelfServiceController.js.map