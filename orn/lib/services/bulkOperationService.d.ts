import { BulkOperationHistoryFilters, BulkOperationRequest, BulkOperationResult, BulkOperationStatusRecord } from '../../../shared/src/types/bulk';
/**
 * Bulk Operation Service
 * Handles multi-entity batch processing with transaction support
 */
export declare class BulkOperationService {
    private db;
    private operationsCollection;
    constructor();
    /**
     * Execute bulk operation with transaction support
     */
    executeBulkOperation(request: BulkOperationRequest, userId: string): Promise<BulkOperationResult>;
    /**
     * Process a batch of items
     */
    private processBatch;
    /**
     * Process create operation
     */
    private processCreateOperation;
    /**
     * Process update operation
     */
    private processUpdateOperation;
    /**
     * Process delete operation
     */
    private processDeleteOperation;
    /**
     * Process status change operation
     */
    private processStatusChangeOperation;
    /**
     * Get Firestore collection for entity type
     */
    private getCollectionForEntityType;
    /**
     * Get operation status
     */
    getOperationStatus(operationId: string): Promise<BulkOperationStatusRecord | null>;
    /**
     * Cancel operation
     */
    cancelOperation(operationId: string): Promise<{
        cancelled: boolean;
        message: string;
    }>;
    /**
     * Get operation history with filtering and pagination
     */
    getOperationHistory(filters: BulkOperationHistoryFilters, page?: number, limit?: number): Promise<{
        operations: BulkOperationStatusRecord[];
        totalCount: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Generate operation ID
     */
    private generateOperationId;
    /**
     * Chunk array into smaller batches
     */
    private chunkArray;
    /**
     * Generate operation summary
     */
    private generateSummary;
}
//# sourceMappingURL=bulkOperationService.d.ts.map