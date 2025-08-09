import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../../../shared/src/types/auth';
/**
 * Bulk Operations Controller
 * Multi-entity batch processing with transaction support
 */
export declare class BulkOperationsController {
    private bulkService;
    private importService;
    constructor();
    /**
     * Execute bulk operation
     */
    executeBulkOperation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk customer operations
     */
    bulkCustomerOperations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk booking operations
     */
    bulkBookingOperations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk service operations
     */
    bulkServiceOperations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk equipment operations
     */
    bulkEquipmentOperations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Bulk user operations
     */
    bulkUserOperations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get bulk operation status
     */
    getBulkOperationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Cancel bulk operation
     */
    cancelBulkOperation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get bulk operation history
     */
    getBulkOperationHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Import customers from file
     */
    importCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Import services from file
     */
    importServices(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Import equipment from file
     */
    importEquipment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Validate bulk request
     */
    private validateBulkRequest;
}
//# sourceMappingURL=bulkOperationsController.d.ts.map