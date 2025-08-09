"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkOperationService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
/**
 * Bulk Operation Service
 * Handles multi-entity batch processing with transaction support
 */
class BulkOperationService {
    constructor() {
        this.db = admin.firestore();
        this.operationsCollection = this.db.collection('bulkOperations');
    }
    /**
     * Execute bulk operation with transaction support
     */
    async executeBulkOperation(request, userId) {
        const operationId = this.generateOperationId();
        const startTime = Date.now();
        // Create operation record
        const operationStatus = {
            id: operationId,
            status: 'running',
            operation: request.operation,
            entityType: request.entityType,
            totalItems: request.items.length,
            processedItems: 0,
            successCount: 0,
            failureCount: 0,
            startTime: new Date(),
            errors: [],
            warnings: [],
            createdBy: userId
        };
        await this.operationsCollection.doc(operationId).set(operationStatus);
        const result = {
            success: true,
            operationId,
            totalItems: request.items.length,
            successCount: 0,
            failureCount: 0,
            errors: [],
            warnings: [],
            executionTime: 0,
            summary: {}
        };
        try {
            // Process items in batches
            const batchSize = request.options?.batchSize || 50;
            const batches = this.chunkArray(request.items, batchSize);
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                if (!batch || batch.length === 0) {
                    continue;
                }
                try {
                    await this.processBatch(batch, request, result, batchIndex * batchSize);
                }
                catch (error) {
                    if (!request.options?.continueOnError) {
                        throw error;
                    }
                    console.error(`Batch ${batchIndex} failed:`, error);
                }
                // Update progress
                operationStatus.processedItems = Math.min((batchIndex + 1) * batchSize, request.items.length);
                operationStatus.successCount = result.successCount;
                operationStatus.failureCount = result.failureCount;
                operationStatus.errors = result.errors;
                operationStatus.warnings = result.warnings;
                await this.operationsCollection.doc(operationId).update({
                    processedItems: operationStatus.processedItems,
                    successCount: operationStatus.successCount,
                    failureCount: operationStatus.failureCount,
                    errors: operationStatus.errors,
                    warnings: operationStatus.warnings
                });
            }
            // Complete operation
            await this.operationsCollection.doc(operationId).update({
                status: 'completed',
                endTime: new Date(),
                summary: this.generateSummary(request, result)
            });
            result.success = result.failureCount === 0;
            result.executionTime = Date.now() - startTime;
            result.summary = this.generateSummary(request, result);
        }
        catch (error) {
            console.error('Bulk operation failed:', error);
            await this.operationsCollection.doc(operationId).update({
                status: 'failed',
                endTime: new Date()
            });
            result.success = false;
            result.errors.push({
                index: -1,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
        return result;
    }
    /**
     * Process a batch of items
     */
    async processBatch(items, request, result, startIndex) {
        const batch = this.db.batch();
        const operations = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const itemIndex = startIndex + i;
            try {
                switch (request.operation) {
                    case 'create':
                        await this.processCreateOperation(item, request.entityType, batch, itemIndex);
                        break;
                    case 'update':
                        await this.processUpdateOperation(item, request.entityType, batch, itemIndex);
                        break;
                    case 'delete':
                        await this.processDeleteOperation(item, request.entityType, batch, itemIndex);
                        break;
                    case 'status_change':
                        await this.processStatusChangeOperation(item, request.entityType, batch, itemIndex);
                        break;
                    default:
                        throw new Error(`Unsupported operation: ${request.operation}`);
                }
                result.successCount++;
            }
            catch (error) {
                result.failureCount++;
                result.errors.push({
                    index: itemIndex,
                    itemId: item.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    code: error?.code
                });
                if (!request.options?.continueOnError) {
                    throw error;
                }
            }
        }
        // Commit batch - removed private property check
        try {
            await batch.commit();
        }
        catch (error) {
            console.error('Error committing batch:', error);
            throw error;
        }
    }
    /**
     * Process create operation
     */
    async processCreateOperation(item, entityType, batch, itemIndex) {
        const collection = this.getCollectionForEntityType(entityType);
        const docRef = collection.doc();
        const data = {
            ...item,
            id: docRef.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        batch.set(docRef, data);
    }
    /**
     * Process update operation
     */
    async processUpdateOperation(item, entityType, batch, itemIndex) {
        if (!item.id) {
            throw new Error('Item ID is required for update operation');
        }
        const collection = this.getCollectionForEntityType(entityType);
        const docRef = collection.doc(item.id);
        // Check if document exists
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(`${entityType} with ID ${item.id} not found`);
        }
        const updateData = {
            ...item,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // Remove id from update data
        delete updateData.id;
        batch.update(docRef, updateData);
    }
    /**
     * Process delete operation
     */
    async processDeleteOperation(item, entityType, batch, itemIndex) {
        if (!item.id) {
            throw new Error('Item ID is required for delete operation');
        }
        const collection = this.getCollectionForEntityType(entityType);
        const docRef = collection.doc(item.id);
        // Check if document exists
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(`${entityType} with ID ${item.id} not found`);
        }
        batch.delete(docRef);
    }
    /**
     * Process status change operation
     */
    async processStatusChangeOperation(item, entityType, batch, itemIndex) {
        if (!item.id) {
            throw new Error('Item ID is required for status change operation');
        }
        if (!item.status) {
            throw new Error('Status is required for status change operation');
        }
        const collection = this.getCollectionForEntityType(entityType);
        const docRef = collection.doc(item.id);
        // Check if document exists
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error(`${entityType} with ID ${item.id} not found`);
        }
        batch.update(docRef, {
            status: item.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    /**
     * Get Firestore collection for entity type
     */
    getCollectionForEntityType(entityType) {
        switch (entityType) {
            case 'customers':
                return this.db.collection('customers');
            case 'bookings':
                return this.db.collection('bookings');
            case 'services':
                return this.db.collection('services');
            case 'equipment':
                return this.db.collection('equipment');
            case 'users':
                return this.db.collection('users');
            default:
                throw new Error(`Unsupported entity type: ${entityType}`);
        }
    }
    /**
     * Get operation status
     */
    async getOperationStatus(operationId) {
        try {
            const doc = await this.operationsCollection.doc(operationId).get();
            if (!doc.exists) {
                return null;
            }
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startTime: data?.['startTime']?.toDate(),
                endTime: data?.['endTime']?.toDate()
            };
        }
        catch (error) {
            console.error('Error getting operation status:', error);
            return null;
        }
    }
    /**
     * Cancel operation
     */
    async cancelOperation(operationId) {
        try {
            const operationDoc = await this.operationsCollection.doc(operationId).get();
            if (!operationDoc.exists) {
                return { cancelled: false, message: 'Operation not found' };
            }
            const operationData = operationDoc.data();
            if (operationData?.['status'] === 'completed') {
                return { cancelled: false, message: 'Operation already completed' };
            }
            if (operationData?.['status'] === 'cancelled') {
                return { cancelled: true, message: 'Operation already cancelled' };
            }
            await this.operationsCollection.doc(operationId).update({
                status: 'cancelled',
                endTime: new Date()
            });
            return { cancelled: true, message: 'Operation cancelled successfully' };
        }
        catch (error) {
            console.error('Error cancelling operation:', error);
            return { cancelled: false, message: 'Failed to cancel operation' };
        }
    }
    /**
     * Get operation history with filtering and pagination
     */
    async getOperationHistory(filters, page = 1, limit = 20) {
        try {
            let query = this.operationsCollection.orderBy('startTime', 'desc');
            // Apply filters
            if (filters.entityType) {
                query = query.where('entityType', '==', filters.entityType);
            }
            if (filters.operation) {
                query = query.where('operation', '==', filters.operation);
            }
            if (filters.status) {
                query = query.where('status', '==', filters.status);
            }
            if (filters.userId) {
                query = query.where('createdBy', '==', filters.userId);
            }
            // Get total count
            const totalSnapshot = await query.get();
            const totalCount = totalSnapshot.size;
            // Get paginated results
            const offset = (page - 1) * limit;
            const paginatedQuery = query.offset(offset).limit(limit);
            const snapshot = await paginatedQuery.get();
            const operations = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startTime: data['startTime']?.toDate(),
                    endTime: data['endTime']?.toDate()
                };
            });
            return {
                operations,
                totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit)
            };
        }
        catch (error) {
            console.error('Error getting operation history:', error);
            return {
                operations: [],
                totalCount: 0,
                page: 1,
                totalPages: 0
            };
        }
    }
    /**
     * Generate operation ID
     */
    generateOperationId() {
        return `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Chunk array into smaller batches
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    /**
     * Generate operation summary
     */
    generateSummary(request, result) {
        return {
            operation: request.operation,
            entityType: request.entityType,
            totalItems: result.totalItems,
            successCount: result.successCount,
            failureCount: result.failureCount,
            successRate: result.totalItems > 0 ? (result.successCount / result.totalItems) * 100 : 0,
            executionTime: result.executionTime,
            options: request.options || {}
        };
    }
}
exports.BulkOperationService = BulkOperationService;
//# sourceMappingURL=bulkOperationService.js.map