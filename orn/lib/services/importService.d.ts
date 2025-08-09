/**
 * Import Service
 * Multi-format data import with validation and error handling
 */
export interface ImportOptions {
    format: 'csv' | 'xlsx' | 'json';
    skipValidation?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
    updateExisting?: boolean;
    matchingField?: string;
    mapping?: Record<string, string>;
    defaultValues?: Record<string, any>;
}
export interface ImportResult {
    success: boolean;
    operationId: string;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    warnings: Array<{
        row: number;
        message: string;
        data?: any;
    }>;
    errors: Array<{
        row: number;
        error: string;
        data?: any;
    }>;
    duplicates: Array<{
        row: number;
        existingId: string;
        action: 'skipped' | 'updated';
    }>;
    summary: {
        processingTime: number;
        validRecords: number;
        invalidRecords: number;
        newRecords: number;
        updatedRecords: number;
    };
}
export declare class ImportService {
    private db;
    constructor();
    /**
     * Import customers from file
     */
    importCustomers(fileBuffer: Buffer, options: ImportOptions): Promise<ImportResult>;
    /**
     * Import services from file
     */
    importServices(fileBuffer: Buffer, options: ImportOptions): Promise<ImportResult>;
    /**
     * Import equipment from file
     */
    importEquipment(fileBuffer: Buffer, options: ImportOptions): Promise<ImportResult>;
    /**
     * Parse file based on format
     */
    private parseFile;
    /**
     * Parse CSV file
     */
    private parseCSV;
    /**
     * Parse Excel file
     */
    private parseExcel;
    /**
     * Parse JSON file
     */
    private parseJSON;
    /**
     * Process customer records
     */
    private processCustomerRecords;
    /**
     * Process service records
     */
    private processServiceRecords;
    /**
     * Process equipment records
     */
    private processEquipmentRecords;
    /**
     * Apply field mapping
     */
    private applyFieldMapping;
    /**
     * Apply default values
     */
    private applyDefaultValues;
    /**
     * Validate customer record
     */
    private validateCustomerRecord;
    /**
     * Validate service record
     */
    private validateServiceRecord;
    /**
     * Validate equipment record
     */
    private validateEquipmentRecord;
    /**
     * Find existing customer
     */
    private findExistingCustomer;
    /**
     * Find existing service
     */
    private findExistingService;
    /**
     * Find existing equipment
     */
    private findExistingEquipment;
    /**
     * Validate email format
     */
    private isValidEmail;
    /**
     * Validate phone format
     */
    private isValidPhone;
    /**
     * Generate operation ID
     */
    private generateOperationId;
}
//# sourceMappingURL=importService.d.ts.map