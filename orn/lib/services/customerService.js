"use strict";
/**
 * Customer Service
 * Handles customer-related business logic and data operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
const auditLogService_1 = require("./auditLogService");
class CustomerService {
    constructor() {
        this.auditService = new auditLogService_1.AuditLogService(firebase_1.db);
    }
    /**
     * Get customer by ID
     */
    async getCustomerById(customerId) {
        try {
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                return null;
            }
            return {
                id: customerDoc.id,
                ...customerDoc.data()
            };
        }
        catch (error) {
            throw new errorHandler_1.ApiError(`Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Update customer profile
     */
    async updateCustomerProfile(customerId, updateData, userId) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new errorHandler_1.ApiError('Customer not found', 404);
            }
            const updatePayload = {
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            await customerRef.update(updatePayload);
            // Audit log
            await this.auditService.createAuditLog({
                userId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED,
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: {
                    updatedFields: Object.keys(updateData),
                    updateData: updatePayload
                },
                relationships: {
                    customerId
                }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            throw new errorHandler_1.ApiError(`Failed to update customer profile: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Search customers with filters
     */
    async searchCustomers(params, page = 1, limit = 20) {
        try {
            let query = firebase_1.db.collection('customers');
            // Apply filters
            if (params.membershipTier) {
                query = query.where('membershipTier', '==', params.membershipTier);
            }
            if (params.supExperience) {
                query = query.where('supExperience', '==', params.supExperience);
            }
            if (params.registeredAfter) {
                query = query.where('createdAt', '>=', params.registeredAfter);
            }
            if (params.registeredBefore) {
                query = query.where('createdAt', '<=', params.registeredBefore);
            }
            if (params.isActive !== undefined) {
                // Assume active means has recent bookings
                // This would need more complex logic in a real implementation
            }
            // Get total count
            const totalSnapshot = await query.get();
            const total = totalSnapshot.size;
            // Apply pagination
            const offset = (page - 1) * limit;
            const paginatedQuery = query.offset(offset).limit(limit);
            const snapshot = await paginatedQuery.get();
            const customers = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            // Apply text search filter if provided (client-side filtering for simplicity)
            let filteredCustomers = customers;
            if (params.query) {
                const searchTerm = params.query.toLowerCase();
                filteredCustomers = customers.filter(customer => customer.firstName.toLowerCase().includes(searchTerm) ||
                    customer.lastName.toLowerCase().includes(searchTerm) ||
                    customer.email?.toLowerCase().includes(searchTerm) ||
                    customer.phone?.includes(searchTerm));
            }
            return {
                customers: filteredCustomers,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            throw new errorHandler_1.ApiError(`Failed to search customers: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Get customer statistics
     */
    async getCustomerStatistics() {
        try {
            const customersSnapshot = await firebase_1.db.collection('customers').get();
            const customers = customersSnapshot.docs.map(doc => doc.data());
            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const stats = {
                totalCustomers: customers.length,
                newCustomersThisMonth: customers.filter(c => new Date(c.createdAt) >= thisMonth).length,
                activeCustomers: customers.filter(c => c.totalBookings > 0 && c.lastBookingDate &&
                    new Date(c.lastBookingDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                ).length,
                averageBookingsPerCustomer: customers.reduce((sum, c) => sum + c.totalBookings, 0) / customers.length || 0,
                averageSpentPerCustomer: customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length || 0,
                membershipTierDistribution: {
                    bronze: customers.filter(c => c.membershipTier === 'bronze').length,
                    silver: customers.filter(c => c.membershipTier === 'silver').length,
                    gold: customers.filter(c => c.membershipTier === 'gold').length,
                    platinum: customers.filter(c => c.membershipTier === 'platinum').length
                },
                experienceLevelDistribution: {
                    beginner: customers.filter(c => c.supExperience === 'beginner').length,
                    intermediate: customers.filter(c => c.supExperience === 'intermediate').length,
                    advanced: customers.filter(c => c.supExperience === 'advanced').length,
                    expert: customers.filter(c => c.supExperience === 'expert').length
                }
            };
            return stats;
        }
        catch (error) {
            throw new errorHandler_1.ApiError(`Failed to get customer statistics: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Update customer loyalty points
     */
    async updateLoyaltyPoints(customerId, points, reason, userId) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new errorHandler_1.ApiError('Customer not found', 404);
            }
            const customer = customerDoc.data();
            const newPoints = Math.max(0, customer.loyaltyPoints + points);
            // Update membership tier based on points
            let newTier = 'bronze';
            if (newPoints >= 10000)
                newTier = 'platinum';
            else if (newPoints >= 5000)
                newTier = 'gold';
            else if (newPoints >= 1000)
                newTier = 'silver';
            await customerRef.update({
                loyaltyPoints: newPoints,
                membershipTier: newTier,
                updatedAt: new Date().toISOString()
            });
            // Create loyalty transaction record
            await firebase_1.db.collection('loyaltyTransactions').add({
                customerId,
                points,
                reason,
                timestamp: new Date().toISOString(),
                previousPoints: customer.loyaltyPoints,
                newPoints,
                previousTier: customer.membershipTier,
                newTier
            });
            // Audit log
            await this.auditService.createAuditLog({
                userId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED, // Using existing action
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: {
                    pointsChange: points,
                    reason,
                    previousPoints: customer.loyaltyPoints,
                    newPoints,
                    tierChange: customer.membershipTier !== newTier ? {
                        from: customer.membershipTier,
                        to: newTier
                    } : null,
                    actionType: 'loyalty_points_update'
                },
                relationships: {
                    customerId
                }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            throw new errorHandler_1.ApiError(`Failed to update loyalty points: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Update customer booking statistics
     */
    async updateBookingStatistics(customerId, bookingAmount, userId) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new errorHandler_1.ApiError('Customer not found', 404);
            }
            const customer = customerDoc.data();
            await customerRef.update({
                totalBookings: customer.totalBookings + 1,
                totalSpent: customer.totalSpent + bookingAmount,
                lastBookingDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // Award loyalty points (1 point per 10 TL spent)
            const loyaltyPointsEarned = Math.floor(bookingAmount / 10);
            if (loyaltyPointsEarned > 0) {
                await this.updateLoyaltyPoints(customerId, loyaltyPointsEarned, `Booking completed - ${bookingAmount} TL spent`, userId);
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            throw new errorHandler_1.ApiError(`Failed to update booking statistics: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Verify customer contact information
     */
    async verifyContactInfo(customerId, field, userId) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new errorHandler_1.ApiError('Customer not found', 404);
            }
            const updateField = field === 'email' ? 'emailVerified' : 'phoneVerified';
            await customerRef.update({
                [updateField]: true,
                updatedAt: new Date().toISOString()
            });
            // Audit log
            await this.auditService.createAuditLog({
                userId,
                action: field === 'email' ? auditLogService_1.AuditAction.CUSTOMER_EMAIL_VERIFIED : auditLogService_1.AuditAction.CUSTOMER_PHONE_VERIFIED,
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: {
                    field,
                    verifiedAt: new Date().toISOString()
                },
                relationships: {
                    customerId
                }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            throw new errorHandler_1.ApiError(`Failed to verify ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
    /**
     * Delete customer account
     */
    async deleteCustomerAccount(customerId, userId) {
        try {
            const customerRef = firebase_1.db.collection('customers').doc(customerId);
            const customerDoc = await customerRef.get();
            if (!customerDoc.exists) {
                throw new errorHandler_1.ApiError('Customer not found', 404);
            }
            const customerData = customerDoc.data();
            // Archive customer data before deletion
            await firebase_1.db.collection('deletedCustomers').doc(customerId).set({
                ...customerData,
                deletedAt: new Date().toISOString(),
                deletedBy: userId
            });
            // Delete customer document
            await customerRef.delete();
            // Audit log
            await this.auditService.createAuditLog({
                userId,
                action: auditLogService_1.AuditAction.CUSTOMER_PROFILE_DELETED,
                resource: auditLogService_1.AuditResource.CUSTOMER,
                resourceId: customerId,
                details: {
                    customerEmail: customerData.email,
                    deletedAt: new Date().toISOString(),
                    archived: true
                },
                relationships: {
                    customerId
                }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError)
                throw error;
            throw new errorHandler_1.ApiError(`Failed to delete customer account: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
        }
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customerService.js.map