import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/src/types/auth';
/**
 * Customer Self-Service Controller
 * Empowering customers with self-service capabilities
 */
export declare class CustomerSelfServiceController {
    private selfServiceService;
    constructor();
    /**
     * Get customer profile and dashboard data
     */
    getCustomerDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update customer profile
     */
    updateCustomerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer booking history with filters
     */
    getBookingHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer loyalty program details
     */
    getLoyaltyProgram(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Redeem loyalty points
     */
    redeemLoyaltyPoints(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer notifications
     */
    getCustomerNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Mark notifications as read
     */
    markNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update notification preferences
     */
    updateNotificationPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer support tickets
     */
    getSupportTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create support ticket
     */
    createSupportTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update customer preferences
     */
    updateCustomerPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get customer statistics
     */
    getCustomerStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=customerSelfServiceController.d.ts.map