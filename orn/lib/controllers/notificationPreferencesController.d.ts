import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/src/index.js';
/**
 * Customer Notification Preferences Controller
 * Opt-in/opt-out management for all notification types
 */
export declare class NotificationPreferencesController {
    private preferencesService;
    constructor();
    /**
     * Get user notification preferences
     */
    getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update user notification preferences
     */
    updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk update preferences (admin only)
     */
    bulkUpdatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get user's notification history - Not implemented in service
     */
    getNotificationHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get notification statistics (admin only)
     */
    getNotificationStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Export notification preferences (admin only) - Not implemented
     */
    exportPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Test notification delivery - Not implemented
     */
    testNotification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Update GDPR consent - Not implemented
     */
    updateGDPRConsent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get GDPR consent status - Not implemented
     */
    getGDPRConsent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Unsubscribe from all notifications
     */
    unsubscribeAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=notificationPreferencesController.d.ts.map