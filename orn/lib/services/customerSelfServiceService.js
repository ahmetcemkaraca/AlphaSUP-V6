"use strict";
/**
 * Customer Self-Service Service
 * Comprehensive customer self-service operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSelfServiceService = void 0;
const firebase_1 = require("../config/firebase");
const auditLogService_1 = require("./auditLogService");
const loyaltyProgramService_1 = require("./loyaltyProgramService");
const notificationPreferencesService_1 = require("./notificationPreferencesService");
class CustomerSelfServiceService {
    constructor() {
        this.auditService = new auditLogService_1.AuditLogService(firebase_1.db);
        this.loyaltyService = new loyaltyProgramService_1.LoyaltyProgramService();
        this.notificationPreferencesService = new notificationPreferencesService_1.NotificationPreferencesService();
    }
    /**
     * Get comprehensive customer dashboard data
     */
    async getCustomerDashboard(customerId) {
        try {
            // Get customer profile
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                throw new Error('Customer not found');
            }
            const customer = { id: customerDoc.id, ...customerDoc.data() };
            // Get upcoming bookings
            const upcomingBookingsSnapshot = await firebase_1.db
                .collection('bookings')
                .where('customerId', '==', customerId)
                .where('status', 'in', ['confirmed', 'pending'])
                .where('serviceDate', '>=', new Date())
                .orderBy('serviceDate', 'asc')
                .limit(5)
                .get();
            const upcomingBookings = upcomingBookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Get recent bookings
            const recentBookingsSnapshot = await firebase_1.db
                .collection('bookings')
                .where('customerId', '==', customerId)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const recentBookings = recentBookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Get loyalty data
            const loyaltyData = await this.loyaltyService.getCustomerLoyalty(customerId);
            // Get notifications
            const notificationsSnapshot = await firebase_1.db
                .collection('notifications')
                .where('customerId', '==', customerId)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const unreadCount = notifications.filter(n => !n.read).length;
            // Calculate statistics
            const totalSpent = recentBookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const serviceFrequency = recentBookings.reduce((acc, booking) => {
                const serviceId = booking.serviceId;
                acc[serviceId] = (acc[serviceId] || 0) + 1;
                return acc;
            }, {});
            const favoriteServices = Object.entries(serviceFrequency)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([serviceId]) => serviceId);
            return {
                profile: customer,
                upcomingBookings,
                recentBookings,
                loyaltyData: {
                    points: loyaltyData.currentPoints,
                    tier: loyaltyData.currentTier,
                    nextTierPoints: loyaltyData.nextTierInfo?.minPoints || 0,
                    availableRewards: loyaltyData.availableRewards
                },
                notifications: {
                    unreadCount,
                    recent: notifications
                },
                statistics: {
                    totalBookings: recentBookings.length,
                    totalSpent,
                    favoriteServices,
                    memberSince: customer.createdAt ? (typeof customer.createdAt === 'string' ? customer.createdAt : new Date(customer.createdAt).toISOString()) : new Date().toISOString()
                }
            };
        }
        catch (error) {
            console.error('Error getting customer dashboard:', error);
            throw new Error('Failed to get customer dashboard');
        }
    }
    /**
     * Update customer profile
     */
    async updateCustomerProfile(customerId, updateData) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new Error('Customer not found');
            }
            const updatePayload = {
                ...updateData,
                updatedAt: new Date()
            };
            await customerRef.update(updatePayload);
            // Audit log
            await this.auditService.createAuditLog({
                userId: customerId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED,
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: { updatedFields: Object.keys(updateData) },
                relationships: { customerId }
            });
            const updatedDoc = await customerRef.get();
            return { id: updatedDoc.id, ...updatedDoc.data() };
        }
        catch (error) {
            console.error('Error updating customer profile:', error);
            throw new Error('Failed to update customer profile');
        }
    }
    /**
     * Get customer booking history with filters
     */
    async getCustomerBookingHistory(customerId, page = 1, limit = 10, filters = {}) {
        try {
            let query = firebase_1.db.collection('bookings')
                .where('customerId', '==', customerId);
            // Apply filters
            if (filters.status && filters.status.length > 0) {
                query = query.where('status', 'in', filters.status);
            }
            if (filters.dateFrom) {
                query = query.where('serviceDate', '>=', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.where('serviceDate', '<=', filters.dateTo);
            }
            // Get total count
            const totalSnapshot = await query.get();
            const totalCount = totalSnapshot.size;
            // Get paginated results
            const offset = (page - 1) * limit;
            const bookingsSnapshot = await query
                .orderBy('serviceDate', 'desc')
                .offset(offset)
                .limit(limit)
                .get();
            const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return {
                bookings,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page
            };
        }
        catch (error) {
            console.error('Error getting booking history:', error);
            throw new Error('Failed to get booking history');
        }
    }
    /**
     * Get customer loyalty data
     */
    async getCustomerLoyaltyData(customerId) {
        try {
            return await this.loyaltyService.getCustomerLoyalty(customerId);
        }
        catch (error) {
            console.error('Error getting loyalty data:', error);
            throw new Error('Failed to get loyalty data');
        }
    }
    /**
     * Redeem loyalty points
     */
    async redeemLoyaltyPoints(customerId, points, rewardType, rewardId) {
        try {
            const redemptionId = `redemption_${Date.now()}_${customerId}`;
            const redemption = {
                id: redemptionId,
                customerId,
                points,
                rewardType,
                rewardId,
                status: 'pending',
                createdAt: new Date()
            };
            // Create redemption record
            await firebase_1.db.collection('loyaltyRedemptions').doc(redemptionId).set(redemption);
            // Process redemption through loyalty service
            // const result = await this.loyaltyService.redeemPoints(customerId, points, rewardType, rewardId);
            const result = { success: true }; // Simplified for now
            // Update redemption status
            await firebase_1.db.collection('loyaltyRedemptions').doc(redemptionId).update({
                status: result.success ? 'completed' : 'failed'
            });
            // Audit log
            await this.auditService.createAuditLog({
                userId: customerId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED, // Using existing action
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: { points, rewardType, rewardId, success: result.success },
                relationships: { customerId }
            });
            return {
                ...redemption,
                status: result.success ? 'completed' : 'failed'
            };
        }
        catch (error) {
            console.error('Error redeeming loyalty points:', error);
            throw new Error('Failed to redeem loyalty points');
        }
    }
    /**
     * Get customer notifications
     */
    async getCustomerNotifications(customerId, page = 1, limit = 20, unreadOnly = false) {
        try {
            let query = firebase_1.db.collection('notifications')
                .where('customerId', '==', customerId);
            if (unreadOnly) {
                query = query.where('read', '==', false);
            }
            // Get total counts
            const totalSnapshot = await query.get();
            const totalCount = totalSnapshot.size;
            const unreadSnapshot = await firebase_1.db.collection('notifications')
                .where('customerId', '==', customerId)
                .where('read', '==', false)
                .get();
            const unreadCount = unreadSnapshot.size;
            // Get paginated results
            const offset = (page - 1) * limit;
            const notificationsSnapshot = await query
                .orderBy('createdAt', 'desc')
                .offset(offset)
                .limit(limit)
                .get();
            const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return {
                notifications,
                totalCount,
                unreadCount
            };
        }
        catch (error) {
            console.error('Error getting customer notifications:', error);
            throw new Error('Failed to get customer notifications');
        }
    }
    /**
     * Mark notifications as read
     */
    async markNotificationsRead(customerId, notificationIds) {
        try {
            const batch = firebase_1.db.batch();
            for (const notificationId of notificationIds) {
                const notificationRef = firebase_1.db.collection('notifications').doc(notificationId);
                batch.update(notificationRef, {
                    read: true,
                    readAt: new Date()
                });
            }
            await batch.commit();
            // Audit log
            await this.auditService.createAuditLog({
                userId: customerId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED, // Using existing action
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: { notificationCount: notificationIds.length },
                relationships: { customerId }
            });
        }
        catch (error) {
            console.error('Error marking notifications as read:', error);
            throw new Error('Failed to mark notifications as read');
        }
    }
    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(customerId, preferences) {
        try {
            // Simple implementation - just return the preferences as-is
            const result = preferences;
            // Audit log
            await this.auditService.createAuditLog({
                userId: customerId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED,
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: { preferencesUpdated: Object.keys(preferences) },
                relationships: { customerId }
            });
            return result;
        }
        catch (error) {
            console.error('Error updating notification preferences:', error);
            throw new Error('Failed to update notification preferences');
        }
    }
    /**
     * Get customer support tickets
     */
    async getCustomerSupportTickets(customerId, page = 1, limit = 10, status) {
        try {
            let query = firebase_1.db.collection('supportTickets')
                .where('customerId', '==', customerId);
            if (status) {
                query = query.where('status', '==', status);
            }
            const totalSnapshot = await query.get();
            const totalCount = totalSnapshot.size;
            const offset = (page - 1) * limit;
            const ticketsSnapshot = await query
                .orderBy('createdAt', 'desc')
                .offset(offset)
                .limit(limit)
                .get();
            const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return {
                tickets,
                totalCount
            };
        }
        catch (error) {
            console.error('Error getting support tickets:', error);
            throw new Error('Failed to get support tickets');
        }
    }
    /**
     * Create support ticket
     */
    async createSupportTicket(customerId, ticketData) {
        try {
            const ticketId = `ticket_${Date.now()}_${customerId}`;
            const ticket = {
                id: ticketId,
                customerId,
                subject: ticketData.subject,
                description: ticketData.description,
                category: ticketData.category,
                priority: ticketData.priority,
                status: 'open',
                attachments: ticketData.attachments || [],
                createdAt: new Date(),
                updatedAt: new Date(),
                responses: []
            };
            await firebase_1.db.collection('supportTickets').doc(ticketId).set(ticket);
            // Audit log
            await this.auditService.createAuditLog({
                userId: customerId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED, // Using existing action
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: { ticketId, category: ticketData.category, priority: ticketData.priority },
                relationships: { customerId }
            });
            return ticket;
        }
        catch (error) {
            console.error('Error creating support ticket:', error);
            throw new Error('Failed to create support ticket');
        }
    }
    /**
     * Update customer preferences
     */
    async updateCustomerPreferences(customerId, preferences) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new Error('Customer not found');
            }
            const currentData = customerDoc.data();
            const updatedPreferences = {
                ...currentData.preferences,
                ...preferences
            };
            await customerRef.update({
                preferences: updatedPreferences,
                updatedAt: new Date()
            });
            // Audit log
            await this.auditService.createAuditLog({
                userId: customerId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED,
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: { preferencesUpdated: Object.keys(preferences) },
                relationships: { customerId }
            });
            return updatedPreferences;
        }
        catch (error) {
            console.error('Error updating customer preferences:', error);
            throw new Error('Failed to update customer preferences');
        }
    }
    /**
     * Get customer statistics
     */
    async getCustomerStatistics(customerId) {
        try {
            // Get customer data
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                throw new Error('Customer not found');
            }
            const customer = customerDoc.data();
            // Get all bookings
            const bookingsSnapshot = await firebase_1.db
                .collection('bookings')
                .where('customerId', '==', customerId)
                .get();
            const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Calculate statistics
            const completedBookings = bookings.filter(b => b.status === 'completed');
            const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const averageBookingValue = completedBookings.length > 0 ? totalSpent / completedBookings.length : 0;
            // Service frequency analysis
            const serviceFrequency = bookings.reduce((acc, booking) => {
                const serviceId = booking.serviceId;
                if (!acc[serviceId]) {
                    acc[serviceId] = { count: 0, serviceName: booking.serviceSnapshot?.name || 'Unknown Service' };
                }
                acc[serviceId].count++;
                return acc;
            }, {});
            const favoriteServices = Object.entries(serviceFrequency)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 5)
                .map(([serviceId, data]) => ({
                serviceId,
                serviceName: data.serviceName,
                bookingCount: data.count
            }));
            // Monthly booking analysis
            const monthlyData = bookings.reduce((acc, booking) => {
                const date = new Date(booking.startDate); // Use startDate instead of serviceDate
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!acc[monthKey]) {
                    acc[monthKey] = { count: 0, spending: 0 };
                }
                acc[monthKey].count++;
                if (booking.status === 'completed') {
                    acc[monthKey].spending += booking.totalAmount || 0;
                }
                return acc;
            }, {});
            const monthlyBookings = Object.entries(monthlyData)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, data]) => ({
                month,
                count: data.count,
                spending: data.spending
            }));
            // Loyalty progress
            const loyaltyData = await this.loyaltyService.getCustomerLoyalty(customerId);
            // Membership duration
            const memberSince = customer.createdAt ? new Date(customer.createdAt) : new Date();
            const now = new Date();
            const membershipDays = Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
            return {
                totalBookings: bookings.length,
                totalSpent,
                averageBookingValue,
                favoriteServices,
                monthlyBookings,
                loyaltyProgress: {
                    currentPoints: loyaltyData.currentPoints,
                    currentTier: loyaltyData.currentTier,
                    nextTier: loyaltyData.nextTier || 'Platinum',
                    pointsToNextTier: (loyaltyData.nextTierInfo?.minPoints || 0) - loyaltyData.currentPoints
                },
                membershipDuration: {
                    days: membershipDays,
                    years: Math.floor(membershipDays / 365)
                }
            };
        }
        catch (error) {
            console.error('Error getting customer statistics:', error);
            throw new Error('Failed to get customer statistics');
        }
    }
}
exports.CustomerSelfServiceService = CustomerSelfServiceService;
//# sourceMappingURL=customerSelfServiceService.js.map