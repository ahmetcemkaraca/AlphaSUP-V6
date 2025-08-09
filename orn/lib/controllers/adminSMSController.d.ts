import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/src/types/auth';
/**
 * Admin SMS Management Dashboard Controller
 * Comprehensive SMS system administration
 */
export declare class AdminSMSController {
    private smsService;
    private analyticsService;
    constructor();
    /**
     * Get SMS dashboard overview
     */
    getDashboardOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get SMS statistics with filtering
     */
    getSMSStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Send test SMS
     */
    sendTestSMS(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Send bulk SMS
     */
    sendBulkSMS(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get SMS templates
     */
    getSMSTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Create/Update SMS template
     */
    saveSMSTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Delete SMS template
     */
    deleteSMSTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get account balance and usage
     */
    getAccountInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get SMS delivery reports
     */
    getDeliveryReports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Export SMS data
     */
    exportSMSData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Set SMS alerts and notifications
     */
    setSMSAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Generate balance alerts
     */
    private generateBalanceAlerts;
}
//# sourceMappingURL=adminSMSController.d.ts.map