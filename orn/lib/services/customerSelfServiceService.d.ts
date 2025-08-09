/**
 * Customer Self-Service Service
 * Comprehensive customer self-service operations
 */
interface Booking {
    id: string;
    customerId: string;
    serviceId: string;
    date: string;
    status: string;
    totalAmount: number;
    participantCount: number;
    [key: string]: any;
}
import { Customer, CustomerProfileUpdate } from '../../../shared/src/types/customer';
interface CustomerNotification {
    id: string;
    customerId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    readAt?: Date;
    createdAt: Date;
    data?: any;
}
import { BookingSearchCriteria } from '../../../shared/src/index.js';
interface CustomerDashboard {
    profile: Customer;
    upcomingBookings: Booking[];
    recentBookings: Booking[];
    loyaltyData: {
        points: number;
        tier: string;
        nextTierPoints: number;
        availableRewards: any[];
    };
    notifications: {
        unreadCount: number;
        recent: CustomerNotification[];
    };
    statistics: {
        totalBookings: number;
        totalSpent: number;
        favoriteServices: string[];
        memberSince: string;
    };
}
interface CustomerNotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
    bookingReminders: boolean;
    promotions: boolean;
    systemUpdates: boolean;
}
interface SupportTicket {
    id: string;
    customerId: string;
    subject: string;
    description: string;
    category: 'booking' | 'payment' | 'technical' | 'general';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    attachments?: string[];
    createdAt: Date;
    updatedAt: Date;
    responses?: Array<{
        id: string;
        message: string;
        author: string;
        isCustomer: boolean;
        createdAt: Date;
    }>;
}
interface LoyaltyRedemption {
    id: string;
    customerId: string;
    points: number;
    rewardType: string;
    rewardId: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
}
interface CustomerStatistics {
    totalBookings: number;
    totalSpent: number;
    averageBookingValue: number;
    favoriteServices: Array<{
        serviceId: string;
        serviceName: string;
        bookingCount: number;
    }>;
    monthlyBookings: Array<{
        month: string;
        count: number;
        spending: number;
    }>;
    loyaltyProgress: {
        currentPoints: number;
        currentTier: string;
        nextTier: string;
        pointsToNextTier: number;
    };
    membershipDuration: {
        days: number;
        years: number;
    };
}
export declare class CustomerSelfServiceService {
    private auditService;
    private loyaltyService;
    private notificationPreferencesService;
    constructor();
    /**
     * Get comprehensive customer dashboard data
     */
    getCustomerDashboard(customerId: string): Promise<CustomerDashboard>;
    /**
     * Update customer profile
     */
    updateCustomerProfile(customerId: string, updateData: CustomerProfileUpdate): Promise<Customer>;
    /**
     * Get customer booking history with filters
     */
    getCustomerBookingHistory(customerId: string, page?: number, limit?: number, filters?: BookingSearchCriteria): Promise<{
        bookings: Booking[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
    }>;
    /**
     * Get customer loyalty data
     */
    getCustomerLoyaltyData(customerId: string): Promise<any>;
    /**
     * Redeem loyalty points
     */
    redeemLoyaltyPoints(customerId: string, points: number, rewardType: string, rewardId: string): Promise<LoyaltyRedemption>;
    /**
     * Get customer notifications
     */
    getCustomerNotifications(customerId: string, page?: number, limit?: number, unreadOnly?: boolean): Promise<{
        notifications: CustomerNotification[];
        totalCount: number;
        unreadCount: number;
    }>;
    /**
     * Mark notifications as read
     */
    markNotificationsRead(customerId: string, notificationIds: string[]): Promise<void>;
    /**
     * Update notification preferences
     */
    updateNotificationPreferences(customerId: string, preferences: CustomerNotificationPreferences): Promise<CustomerNotificationPreferences>;
    /**
     * Get customer support tickets
     */
    getCustomerSupportTickets(customerId: string, page?: number, limit?: number, status?: string): Promise<{
        tickets: SupportTicket[];
        totalCount: number;
    }>;
    /**
     * Create support ticket
     */
    createSupportTicket(customerId: string, ticketData: {
        subject: string;
        description: string;
        category: SupportTicket['category'];
        priority: SupportTicket['priority'];
        attachments?: string[];
    }): Promise<SupportTicket>;
    /**
     * Update customer preferences
     */
    updateCustomerPreferences(customerId: string, preferences: Partial<Customer['preferences']>): Promise<Customer['preferences']>;
    /**
     * Get customer statistics
     */
    getCustomerStatistics(customerId: string): Promise<CustomerStatistics>;
}
export {};
//# sourceMappingURL=customerSelfServiceService.d.ts.map