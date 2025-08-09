"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkOperationsController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const bulkOperationService_1 = require("../services/bulkOperationService");
const importService_1 = require("../services/importService");
/**
 * Bulk Operations Controller
 * Multi-entity batch processing with transaction support
 */
class BulkOperationsController {
    constructor() {
        this.bulkService = new bulkOperationService_1.BulkOperationService();
        this.importService = new importService_1.ImportService();
    }
    /**
     * Execute bulk operation
     */
    async executeBulkOperation(req, res, next) {
        try {
            const startTime = Date.now();
            const userId = req.user?.uid;
            // Authentication and authorization
            if (!req.user || !userId || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const bulkRequest = req.body;
            // Validate bulk request
            this.validateBulkRequest(bulkRequest);
            // Execute bulk operation
            const result = await this.bulkService.executeBulkOperation(bulkRequest, userId);
            // Add execution time
            result.executionTime = Date.now() - startTime;
            res.json({
                success: true,
                message: `Bulk operation completed: ${result.successCount} successful, ${result.failureCount} failed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk customer operations
     */
    async bulkCustomerOperations(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operation, customerIds, data, options } = req.body;
            const bulkRequest = {
                operation,
                entityType: 'customers',
                items: customerIds.map((id) => ({ id, ...data })),
                options
            };
            // Validate bulk request
            this.validateBulkRequest(bulkRequest);
            const result = await this.bulkService.executeBulkOperation(bulkRequest, req.user.uid);
            res.json({
                success: true,
                message: `Bulk customer ${operation} completed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk booking operations
     */
    async bulkBookingOperations(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operation, bookingIds, data, options } = req.body;
            const bulkRequest = {
                operation,
                entityType: 'bookings',
                items: bookingIds.map((id) => ({ id, ...data })),
                options
            };
            // Validate bulk request
            this.validateBulkRequest(bulkRequest);
            const result = await this.bulkService.executeBulkOperation(bulkRequest, req.user.uid);
            res.json({
                success: true,
                message: `Bulk booking ${operation} completed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk service operations
     */
    async bulkServiceOperations(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operation, serviceIds, data, options } = req.body;
            const bulkRequest = {
                operation,
                entityType: 'services',
                items: serviceIds.map((id) => ({ id, ...data })),
                options
            };
            // Validate bulk request
            this.validateBulkRequest(bulkRequest);
            const result = await this.bulkService.executeBulkOperation(bulkRequest, req.user.uid);
            res.json({
                success: true,
                message: `Bulk service ${operation} completed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk equipment operations
     */
    async bulkEquipmentOperations(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operation, equipmentIds, data, options } = req.body;
            const bulkRequest = {
                operation,
                entityType: 'equipment',
                items: equipmentIds.map((id) => ({ id, ...data })),
                options
            };
            // Validate bulk request
            this.validateBulkRequest(bulkRequest);
            const result = await this.bulkService.executeBulkOperation(bulkRequest, req.user.uid);
            res.json({
                success: true,
                message: `Bulk equipment ${operation} completed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Bulk user operations
     */
    async bulkUserOperations(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operation, userIds, data, options } = req.body;
            const bulkRequest = {
                operation: operation,
                entityType: 'users',
                items: userIds.map((id) => ({ id, ...data })),
                options
            };
            // Validate request
            this.validateBulkRequest(bulkRequest);
            const result = await this.bulkService.executeBulkOperation(bulkRequest, req.user.uid);
            res.json({
                success: true,
                message: `Bulk user ${operation} completed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get bulk operation status
     */
    async getBulkOperationStatus(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operationId } = req.params;
            if (!operationId) {
                throw new errorHandler_1.ApiError('Operation ID is required', 400);
            }
            const status = await this.bulkService.getOperationStatus(operationId);
            if (!status) {
                throw new errorHandler_1.ApiError('Bulk operation not found', 404);
            }
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Cancel bulk operation
     */
    async cancelBulkOperation(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { operationId } = req.params;
            if (!operationId) {
                throw new errorHandler_1.ApiError('Operation ID is required', 400);
            }
            const result = await this.bulkService.cancelOperation(operationId);
            res.json({
                success: true,
                message: 'Bulk operation cancelled successfully',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get bulk operation history
     */
    async getBulkOperationHistory(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for bulk operations', 403);
            }
            const { page = 1, limit = 20, entityType, operation, status, userId } = req.query;
            const filters = {
                entityType: entityType,
                operation: operation,
                status: status,
                userId: userId
            };
            const history = await this.bulkService.getOperationHistory(filters, parseInt(page), parseInt(limit));
            res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Import customers from file
     */
    async importCustomers(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for import operations', 403);
            }
            if (!req.file) {
                throw new errorHandler_1.ApiError('File is required for import', 400);
            }
            const options = {
                format: req.body.format || 'csv',
                skipValidation: req.body.skipValidation === 'true',
                continueOnError: req.body.continueOnError === 'true',
                batchSize: parseInt(req.body.batchSize) || 50,
                updateExisting: req.body.updateExisting === 'true',
                matchingField: req.body.matchingField || 'email',
                mapping: req.body.mapping ? JSON.parse(req.body.mapping) : undefined,
                defaultValues: req.body.defaultValues ? JSON.parse(req.body.defaultValues) : undefined
            };
            const result = await this.importService.importCustomers(req.file.buffer, options);
            res.json({
                success: true,
                message: `Customer import completed: ${result.successCount} successful, ${result.errorCount} failed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Import services from file
     */
    async importServices(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for import operations', 403);
            }
            if (!req.file) {
                throw new errorHandler_1.ApiError('File is required for import', 400);
            }
            const options = {
                format: req.body.format || 'csv',
                skipValidation: req.body.skipValidation === 'true',
                continueOnError: req.body.continueOnError === 'true',
                batchSize: parseInt(req.body.batchSize) || 50,
                updateExisting: req.body.updateExisting === 'true',
                matchingField: req.body.matchingField || 'name',
                mapping: req.body.mapping ? JSON.parse(req.body.mapping) : undefined,
                defaultValues: req.body.defaultValues ? JSON.parse(req.body.defaultValues) : undefined
            };
            const result = await this.importService.importServices(req.file.buffer, options);
            res.json({
                success: true,
                message: `Service import completed: ${result.successCount} successful, ${result.errorCount} failed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Import equipment from file
     */
    async importEquipment(req, res, next) {
        try {
            // Authentication and authorization
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'editor')) {
                throw new errorHandler_1.ApiError('Admin access required for import operations', 403);
            }
            if (!req.file) {
                throw new errorHandler_1.ApiError('File is required for import', 400);
            }
            const options = {
                format: req.body.format || 'csv',
                skipValidation: req.body.skipValidation === 'true',
                continueOnError: req.body.continueOnError === 'true',
                batchSize: parseInt(req.body.batchSize) || 50,
                updateExisting: req.body.updateExisting === 'true',
                matchingField: req.body.matchingField || 'name',
                mapping: req.body.mapping ? JSON.parse(req.body.mapping) : undefined,
                defaultValues: req.body.defaultValues ? JSON.parse(req.body.defaultValues) : undefined
            };
            const result = await this.importService.importEquipment(req.file.buffer, options);
            res.json({
                success: true,
                message: `Equipment import completed: ${result.successCount} successful, ${result.errorCount} failed`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Validate bulk request
     */
    validateBulkRequest(request) {
        if (!request.operation) {
            throw new errorHandler_1.ApiError('Operation type is required', 400);
        }
        if (!request.entityType) {
            throw new errorHandler_1.ApiError('Entity type is required', 400);
        }
        if (!Array.isArray(request.items) || request.items.length === 0) {
            throw new errorHandler_1.ApiError('Items array is required and must not be empty', 400);
        }
        if (request.items.length > 1000) {
            throw new errorHandler_1.ApiError('Maximum 1000 items allowed per bulk operation', 400);
        }
        const validOperations = ['create', 'update', 'delete', 'status_change', 'export', 'import'];
        if (!validOperations.includes(request.operation)) {
            throw new errorHandler_1.ApiError(`Invalid operation. Must be one of: ${validOperations.join(', ')}`, 400);
        }
        const validEntityTypes = ['customers', 'bookings', 'services', 'equipment', 'users'];
        if (!validEntityTypes.includes(request.entityType)) {
            throw new errorHandler_1.ApiError(`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`, 400);
        }
    }
}
exports.BulkOperationsController = BulkOperationsController;
//# sourceMappingURL=bulkOperationsController.js.map