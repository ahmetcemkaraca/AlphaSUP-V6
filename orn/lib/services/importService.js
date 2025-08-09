"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const tslib_1 = require("tslib");
const csv_parser_1 = tslib_1.__importDefault(require("csv-parser"));
const admin = tslib_1.__importStar(require("firebase-admin"));
const stream_1 = require("stream");
const XLSX = tslib_1.__importStar(require("xlsx"));
const errorHandler_1 = require("../middleware/errorHandler");
class ImportService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Import customers from file
     */
    async importCustomers(fileBuffer, options) {
        try {
            const startTime = Date.now();
            const operationId = this.generateOperationId();
            // Parse file data
            const records = await this.parseFile(fileBuffer, options.format);
            // Validate and process records
            const result = await this.processCustomerRecords(records, options, operationId);
            // Add processing time
            result.summary.processingTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Import failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Import services from file
     */
    async importServices(fileBuffer, options) {
        try {
            const startTime = Date.now();
            const operationId = this.generateOperationId();
            const records = await this.parseFile(fileBuffer, options.format);
            const result = await this.processServiceRecords(records, options, operationId);
            result.summary.processingTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Import failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Import equipment from file
     */
    async importEquipment(fileBuffer, options) {
        try {
            const startTime = Date.now();
            const operationId = this.generateOperationId();
            const records = await this.parseFile(fileBuffer, options.format);
            const result = await this.processEquipmentRecords(records, options, operationId);
            result.summary.processingTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Import failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Parse file based on format
     */
    async parseFile(fileBuffer, format) {
        switch (format) {
            case 'csv':
                return this.parseCSV(fileBuffer);
            case 'xlsx':
                return this.parseExcel(fileBuffer);
            case 'json':
                return this.parseJSON(fileBuffer);
            default:
                throw new errorHandler_1.ApiError(`Unsupported import format: ${format}`, 400);
        }
    }
    /**
     * Parse CSV file
     */
    async parseCSV(fileBuffer) {
        return new Promise((resolve, reject) => {
            const records = [];
            const stream = stream_1.Readable.from(fileBuffer.toString());
            stream
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => records.push(data))
                .on('end', () => resolve(records))
                .on('error', (error) => reject(error));
        });
    }
    /**
     * Parse Excel file
     */
    parseExcel(fileBuffer) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new errorHandler_1.ApiError('No worksheet found in Excel file', 400);
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            throw new errorHandler_1.ApiError('Unable to read worksheet from Excel file', 400);
        }
        return XLSX.utils.sheet_to_json(worksheet);
    }
    /**
     * Parse JSON file
     */
    parseJSON(fileBuffer) {
        const jsonData = JSON.parse(fileBuffer.toString());
        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
            return jsonData;
        }
        else if (jsonData.data && Array.isArray(jsonData.data)) {
            return jsonData.data;
        }
        else {
            throw new errorHandler_1.ApiError('Invalid JSON structure. Expected array or object with data property.', 400);
        }
    }
    /**
     * Process customer records
     */
    async processCustomerRecords(records, options, operationId) {
        const result = {
            success: true,
            operationId,
            totalRecords: records.length,
            successCount: 0,
            errorCount: 0,
            skippedCount: 0,
            warnings: [],
            errors: [],
            duplicates: [],
            summary: {
                processingTime: 0,
                validRecords: 0,
                invalidRecords: 0,
                newRecords: 0,
                updatedRecords: 0
            }
        };
        const batchSize = options.batchSize || 50;
        const batch = this.db.batch();
        let batchCount = 0;
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNumber = i + 1;
            try {
                // Apply field mapping
                const mappedRecord = this.applyFieldMapping(record, options.mapping);
                // Apply default values
                const processedRecord = this.applyDefaultValues(mappedRecord, options.defaultValues);
                // Validate customer record
                const validationResult = this.validateCustomerRecord(processedRecord, rowNumber);
                if (!validationResult.isValid) {
                    if (options.skipValidation) {
                        result.warnings.push({
                            row: rowNumber,
                            message: `Validation warnings: ${validationResult.errors.join(', ')}`,
                            data: processedRecord
                        });
                    }
                    else {
                        result.errors.push({
                            row: rowNumber,
                            error: `Validation failed: ${validationResult.errors.join(', ')}`,
                            data: processedRecord
                        });
                        result.errorCount++;
                        result.summary.invalidRecords++;
                        if (!options.continueOnError) {
                            break;
                        }
                        continue;
                    }
                }
                // Check for existing customer
                const existingCustomer = await this.findExistingCustomer(processedRecord, options.matchingField || 'email');
                if (existingCustomer) {
                    if (options.updateExisting) {
                        // Update existing customer
                        const customerRef = this.db.collection('customers').doc(existingCustomer.id);
                        batch.update(customerRef, {
                            ...processedRecord,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        result.duplicates.push({
                            row: rowNumber,
                            existingId: existingCustomer.id,
                            action: 'updated'
                        });
                        result.summary.updatedRecords++;
                    }
                    else {
                        result.duplicates.push({
                            row: rowNumber,
                            existingId: existingCustomer.id,
                            action: 'skipped'
                        });
                        result.skippedCount++;
                        continue;
                    }
                }
                else {
                    // Create new customer
                    const customerRef = this.db.collection('customers').doc();
                    batch.create(customerRef, {
                        ...processedRecord,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    result.summary.newRecords++;
                }
                result.successCount++;
                result.summary.validRecords++;
                batchCount++;
                // Commit batch if size limit reached
                if (batchCount >= batchSize) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                result.errors.push({
                    row: rowNumber,
                    error: errorMessage,
                    data: record
                });
                result.errorCount++;
                if (!options.continueOnError) {
                    break;
                }
            }
        }
        // Commit remaining batch
        if (batchCount > 0) {
            await batch.commit();
        }
        // Update success status
        result.success = result.errorCount === 0 || (options.continueOnError ?? false);
        return result;
    }
    /**
     * Process service records
     */
    async processServiceRecords(records, options, operationId) {
        const result = {
            success: true,
            operationId,
            totalRecords: records.length,
            successCount: 0,
            errorCount: 0,
            skippedCount: 0,
            warnings: [],
            errors: [],
            duplicates: [],
            summary: {
                processingTime: 0,
                validRecords: 0,
                invalidRecords: 0,
                newRecords: 0,
                updatedRecords: 0
            }
        };
        const batchSize = options.batchSize || 50;
        const batch = this.db.batch();
        let batchCount = 0;
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNumber = i + 1;
            try {
                const mappedRecord = this.applyFieldMapping(record, options.mapping);
                const processedRecord = this.applyDefaultValues(mappedRecord, options.defaultValues);
                const validationResult = this.validateServiceRecord(processedRecord, rowNumber);
                if (!validationResult.isValid && !options.skipValidation) {
                    result.errors.push({
                        row: rowNumber,
                        error: `Validation failed: ${validationResult.errors.join(', ')}`,
                        data: processedRecord
                    });
                    result.errorCount++;
                    result.summary.invalidRecords++;
                    if (!options.continueOnError)
                        break;
                    continue;
                }
                const existingService = await this.findExistingService(processedRecord, options.matchingField || 'name');
                if (existingService) {
                    if (options.updateExisting) {
                        const serviceRef = this.db.collection('services').doc(existingService.id);
                        batch.update(serviceRef, {
                            ...processedRecord,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        result.duplicates.push({
                            row: rowNumber,
                            existingId: existingService.id,
                            action: 'updated'
                        });
                        result.summary.updatedRecords++;
                    }
                    else {
                        result.duplicates.push({
                            row: rowNumber,
                            existingId: existingService.id,
                            action: 'skipped'
                        });
                        result.skippedCount++;
                        continue;
                    }
                }
                else {
                    const serviceRef = this.db.collection('services').doc();
                    batch.create(serviceRef, {
                        ...processedRecord,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    result.summary.newRecords++;
                }
                result.successCount++;
                result.summary.validRecords++;
                batchCount++;
                if (batchCount >= batchSize) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                result.errors.push({
                    row: rowNumber,
                    error: errorMessage,
                    data: record
                });
                result.errorCount++;
                if (!options.continueOnError)
                    break;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        result.success = result.errorCount === 0 || (options.continueOnError ?? false);
        return result;
    }
    /**
     * Process equipment records
     */
    async processEquipmentRecords(records, options, operationId) {
        const result = {
            success: true,
            operationId,
            totalRecords: records.length,
            successCount: 0,
            errorCount: 0,
            skippedCount: 0,
            warnings: [],
            errors: [],
            duplicates: [],
            summary: {
                processingTime: 0,
                validRecords: 0,
                invalidRecords: 0,
                newRecords: 0,
                updatedRecords: 0
            }
        };
        const batchSize = options.batchSize || 50;
        const batch = this.db.batch();
        let batchCount = 0;
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNumber = i + 1;
            try {
                const mappedRecord = this.applyFieldMapping(record, options.mapping);
                const processedRecord = this.applyDefaultValues(mappedRecord, options.defaultValues);
                const validationResult = this.validateEquipmentRecord(processedRecord, rowNumber);
                if (!validationResult.isValid && !options.skipValidation) {
                    result.errors.push({
                        row: rowNumber,
                        error: `Validation failed: ${validationResult.errors.join(', ')}`,
                        data: processedRecord
                    });
                    result.errorCount++;
                    result.summary.invalidRecords++;
                    if (!options.continueOnError)
                        break;
                    continue;
                }
                const existingEquipment = await this.findExistingEquipment(processedRecord, options.matchingField || 'name');
                if (existingEquipment) {
                    if (options.updateExisting) {
                        const equipmentRef = this.db.collection('equipment').doc(existingEquipment.id);
                        batch.update(equipmentRef, {
                            ...processedRecord,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        result.duplicates.push({
                            row: rowNumber,
                            existingId: existingEquipment.id,
                            action: 'updated'
                        });
                        result.summary.updatedRecords++;
                    }
                    else {
                        result.duplicates.push({
                            row: rowNumber,
                            existingId: existingEquipment.id,
                            action: 'skipped'
                        });
                        result.skippedCount++;
                        continue;
                    }
                }
                else {
                    const equipmentRef = this.db.collection('equipment').doc();
                    batch.create(equipmentRef, {
                        ...processedRecord,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    result.summary.newRecords++;
                }
                result.successCount++;
                result.summary.validRecords++;
                batchCount++;
                if (batchCount >= batchSize) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                result.errors.push({
                    row: rowNumber,
                    error: errorMessage,
                    data: record
                });
                result.errorCount++;
                if (!options.continueOnError)
                    break;
            }
        }
        if (batchCount > 0) {
            await batch.commit();
        }
        result.success = result.errorCount === 0 || (options.continueOnError ?? false);
        return result;
    }
    /**
     * Apply field mapping
     */
    applyFieldMapping(record, mapping) {
        if (!mapping)
            return record;
        const mappedRecord = {};
        Object.entries(record).forEach(([key, value]) => {
            const mappedKey = mapping[key] || key;
            mappedRecord[mappedKey] = value;
        });
        return mappedRecord;
    }
    /**
     * Apply default values
     */
    applyDefaultValues(record, defaultValues) {
        if (!defaultValues)
            return record;
        return { ...defaultValues, ...record };
    }
    /**
     * Validate customer record
     */
    validateCustomerRecord(record, rowNumber) {
        const errors = [];
        if (!record.email) {
            errors.push('Email is required');
        }
        else if (!this.isValidEmail(record.email)) {
            errors.push('Invalid email format');
        }
        if (!record.name) {
            errors.push('Name is required');
        }
        if (record.phone && !this.isValidPhone(record.phone)) {
            errors.push('Invalid phone format');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate service record
     */
    validateServiceRecord(record, rowNumber) {
        const errors = [];
        if (!record.name) {
            errors.push('Service name is required');
        }
        if (!record.price || isNaN(parseFloat(record.price))) {
            errors.push('Valid price is required');
        }
        if (!record.duration || isNaN(parseInt(record.duration))) {
            errors.push('Valid duration is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Validate equipment record
     */
    validateEquipmentRecord(record, rowNumber) {
        const errors = [];
        if (!record.name) {
            errors.push('Equipment name is required');
        }
        if (!record.type) {
            errors.push('Equipment type is required');
        }
        if (record.quantity && isNaN(parseInt(record.quantity))) {
            errors.push('Valid quantity is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Find existing customer
     */
    async findExistingCustomer(record, matchingField) {
        const value = record[matchingField];
        if (!value)
            return null;
        const snapshot = await this.db.collection('customers')
            .where(matchingField, '==', value)
            .limit(1)
            .get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        if (!doc)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    /**
     * Find existing service
     */
    async findExistingService(record, matchingField) {
        const value = record[matchingField];
        if (!value)
            return null;
        const snapshot = await this.db.collection('services')
            .where(matchingField, '==', value)
            .limit(1)
            .get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        if (!doc)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    /**
     * Find existing equipment
     */
    async findExistingEquipment(record, matchingField) {
        const value = record[matchingField];
        if (!value)
            return null;
        const snapshot = await this.db.collection('equipment')
            .where(matchingField, '==', value)
            .limit(1)
            .get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        if (!doc)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate phone format
     */
    isValidPhone(phone) {
        const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }
    /**
     * Generate operation ID
     */
    generateOperationId() {
        return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=importService.js.map