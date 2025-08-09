"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const pdfkit_1 = tslib_1.__importDefault(require("pdfkit"));
const XLSX = tslib_1.__importStar(require("xlsx"));
const errorHandler_1 = require("../middleware/errorHandler");
class ExportService {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Export customers data
     */
    async exportCustomers(options) {
        try {
            const data = await this.getCustomersData(options);
            switch (options.format) {
                case 'csv':
                    return await this.exportToCSV(data, 'customers', options);
                case 'xlsx':
                    return await this.exportToExcel(data, 'customers', options);
                case 'pdf':
                    return await this.exportToPDF(data, 'customers', options);
                case 'json':
                    return await this.exportToJSON(data, 'customers', options);
                default:
                    throw new errorHandler_1.ApiError(`Unsupported export format: ${options.format}`, 400);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Export failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Export bookings data
     */
    async exportBookings(options) {
        try {
            const data = await this.getBookingsData(options);
            switch (options.format) {
                case 'csv':
                    return await this.exportToCSV(data, 'bookings', options);
                case 'xlsx':
                    return await this.exportToExcel(data, 'bookings', options);
                case 'pdf':
                    return await this.exportToPDF(data, 'bookings', options);
                case 'json':
                    return await this.exportToJSON(data, 'bookings', options);
                default:
                    throw new errorHandler_1.ApiError(`Unsupported export format: ${options.format}`, 400);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Export failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Export services data
     */
    async exportServices(options) {
        try {
            const data = await this.getServicesData(options);
            switch (options.format) {
                case 'csv':
                    return await this.exportToCSV(data, 'services', options);
                case 'xlsx':
                    return await this.exportToExcel(data, 'services', options);
                case 'pdf':
                    return await this.exportToPDF(data, 'services', options);
                case 'json':
                    return await this.exportToJSON(data, 'services', options);
                default:
                    throw new errorHandler_1.ApiError(`Unsupported export format: ${options.format}`, 400);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Export failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Export financial report
     */
    async exportFinancialReport(startDate, endDate, options) {
        try {
            const data = await this.getFinancialData(startDate, endDate, options);
            switch (options.format) {
                case 'csv':
                    return await this.exportToCSV(data, 'financial-report', options);
                case 'xlsx':
                    return await this.exportToExcel(data, 'financial-report', options);
                case 'pdf':
                    return await this.exportToPDF(data, 'financial-report', options);
                case 'json':
                    return await this.exportToJSON(data, 'financial-report', options);
                default:
                    throw new errorHandler_1.ApiError(`Unsupported export format: ${options.format}`, 400);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new errorHandler_1.ApiError(`Financial export failed: ${errorMessage}`, 500);
        }
    }
    /**
     * Get customers data for export
     */
    async getCustomersData(options) {
        let query = this.db.collection('customers');
        // Apply filters
        if (options.filters) {
            Object.entries(options.filters).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    // Special handling for document ID filter
                    if (field === 'customerId' || field === 'id') {
                        // For document ID, we'll handle this separately after the query
                        return;
                    }
                    query = query.where(field, '==', value);
                }
            });
        }
        // Apply sorting
        if (options.sort) {
            Object.entries(options.sort).forEach(([field, direction]) => {
                query = query.orderBy(field, direction);
            });
        }
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        let docs;
        // Handle document ID filter specially
        if (options.filters?.['customerId'] || options.filters?.['id']) {
            const docId = options.filters['customerId'] || options.filters['id'];
            const doc = await this.db.collection('customers').doc(docId).get();
            if (doc.exists) {
                docs = [doc];
            }
            else {
                docs = [];
            }
        }
        else {
            const snapshot = await query.get();
            docs = snapshot.docs;
        }
        return docs.map(doc => {
            const data = doc.data();
            if (!data)
                return {};
            const exportData = {
                id: doc.id,
                firstName: data['firstName'] || '',
                lastName: data['lastName'] || '',
                fullName: `${data['firstName'] || ''} ${data['lastName'] || ''}`.trim(),
                email: data['email'] || '',
                phone: data['phone'] || '',
                registrationDate: this.formatDate(data['createdAt']?.toDate()),
                totalBookings: data['totalBookings'] || 0,
                totalSpent: data['totalSpent'] || 0,
                loyaltyPoints: data['loyaltyPoints'] || 0,
                membershipTier: data['membershipTier'] || 'bronze',
                supExperience: data['supExperience'] || '',
                swimmingAbility: data['swimmingAbility'] || '',
                emailVerified: data['emailVerified'] || false,
                phoneVerified: data['phoneVerified'] || false,
                authMethod: data['authMethod'] || '',
                emergencyContactName: data['emergencyContact']?.['name'] || '',
                emergencyContactPhone: data['emergencyContact']?.['phone'] || '',
                emergencyContactRelationship: data['emergencyContact']?.['relationship'] || '',
                language: data['preferences']?.['language'] || 'tr',
                currency: data['preferences']?.['currency'] || 'TRY',
                emailNotifications: data['preferences']?.['communications']?.['email'] || false,
                smsNotifications: data['preferences']?.['communications']?.['sms'] || false,
                pushNotifications: data['preferences']?.['communications']?.['push'] || false,
                lastBookingDate: this.formatDate(data['lastBookingDate']?.toDate()),
                updatedAt: this.formatDate(data['updatedAt']?.toDate())
            };
            // Filter fields if specified
            if (options.fields && options.fields.length > 0) {
                const filteredData = {};
                options.fields.forEach(field => {
                    if (exportData[field] !== undefined) {
                        filteredData[field] = exportData[field];
                    }
                });
                return filteredData;
            }
            return exportData;
        });
    }
    /**
     * Get bookings data for export
     */
    async getBookingsData(options) {
        let query = this.db.collection('bookings');
        // Apply filters
        if (options.filters) {
            Object.entries(options.filters).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    if (field === 'dateRange' && Array.isArray(value) && value.length === 2) {
                        query = query.where('bookingDate', '>=', admin.firestore.Timestamp.fromDate(new Date(value[0])))
                            .where('bookingDate', '<=', admin.firestore.Timestamp.fromDate(new Date(value[1])));
                    }
                    else {
                        query = query.where(field, '==', value);
                    }
                }
            });
        }
        // Apply sorting
        if (options.sort) {
            Object.entries(options.sort).forEach(([field, direction]) => {
                query = query.orderBy(field, direction);
            });
        }
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        const snapshot = await query.get();
        const bookingsData = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            // Get customer name
            let customerName = 'Unknown';
            if (data['customerId']) {
                try {
                    const customerDoc = await this.db.collection('customers').doc(data['customerId']).get();
                    if (customerDoc.exists) {
                        const customerData = customerDoc.data();
                        customerName = `${customerData?.['firstName'] || ''} ${customerData?.['lastName'] || ''}`.trim() || 'Unknown';
                    }
                }
                catch (error) {
                    console.error('Error fetching customer:', error);
                }
            }
            // Get service name
            let serviceName = 'Unknown';
            if (data['serviceId']) {
                try {
                    const serviceDoc = await this.db.collection('services').doc(data['serviceId']).get();
                    if (serviceDoc.exists) {
                        serviceName = serviceDoc.data()?.['name'] || 'Unknown';
                    }
                }
                catch (error) {
                    console.error('Error fetching service:', error);
                }
            }
            const exportData = {
                id: doc.id,
                bookingNumber: data['bookingNumber'] || '',
                customerName,
                serviceName,
                bookingDate: this.formatDate(data['bookingDate']?.toDate()),
                timeSlot: data['timeSlot'] || '',
                participants: data['participants'] || 0,
                totalAmount: data['totalAmount'] || 0,
                status: data['status'] || '',
                paymentStatus: data['paymentStatus'] || '',
                createdAt: this.formatDate(data['createdAt']?.toDate()),
                notes: data['notes'] || ''
            };
            // Filter fields if specified
            if (options.fields && options.fields.length > 0) {
                const filteredData = {};
                options.fields.forEach(field => {
                    if (exportData[field] !== undefined) {
                        filteredData[field] = exportData[field];
                    }
                });
                bookingsData.push(filteredData);
            }
            else {
                bookingsData.push(exportData);
            }
        }
        return bookingsData;
    }
    /**
     * Get services data for export
     */
    async getServicesData(options) {
        let query = this.db.collection('services');
        // Apply filters
        if (options.filters) {
            Object.entries(options.filters).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.where(field, '==', value);
                }
            });
        }
        // Apply sorting
        if (options.sort) {
            Object.entries(options.sort).forEach(([field, direction]) => {
                query = query.orderBy(field, direction);
            });
        }
        // Apply limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const exportData = {
                id: doc.id,
                name: data['name'] || '',
                description: data['description'] || '',
                category: data['category'] || '',
                price: data['price'] || 0,
                duration: data['duration'] || 0,
                capacity: data['capacity'] || 0,
                location: data['location'] || '',
                isActive: data['isActive'] || false,
                totalBookings: data['totalBookings'] || 0,
                totalRevenue: data['totalRevenue'] || 0,
                createdAt: this.formatDate(data['createdAt']?.toDate()),
                updatedAt: this.formatDate(data['updatedAt']?.toDate())
            };
            // Filter fields if specified
            if (options.fields && options.fields.length > 0) {
                const filteredData = {};
                options.fields.forEach(field => {
                    if (exportData[field] !== undefined) {
                        filteredData[field] = exportData[field];
                    }
                });
                return filteredData;
            }
            return exportData;
        });
    }
    /**
     * Get financial data for export
     */
    async getFinancialData(startDate, endDate, options) {
        const query = this.db.collection('bookings')
            .where('bookingDate', '>=', admin.firestore.Timestamp.fromDate(startDate))
            .where('bookingDate', '<=', admin.firestore.Timestamp.fromDate(endDate))
            .where('paymentStatus', '==', 'completed');
        const snapshot = await query.get();
        const financialData = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            financialData.push({
                bookingId: doc.id,
                bookingNumber: data['bookingNumber'] || '',
                date: this.formatDate(data['bookingDate']?.toDate()),
                revenue: data['totalAmount'] || 0,
                serviceName: data['serviceName'] || '',
                customerName: data['customerName'] || '',
                paymentMethod: data['paymentMethod'] || '',
                fees: data['fees'] || 0,
                netRevenue: (data['totalAmount'] || 0) - (data['fees'] || 0)
            });
        }
        return financialData;
    }
    /**
     * Export to CSV format
     */
    async exportToCSV(data, fileName, options) {
        const csv = this.convertToCSV(data, options);
        const filePath = path.join('/tmp', `${fileName}-${Date.now()}.csv`);
        fs.writeFileSync(filePath, csv, 'utf-8');
        const stats = fs.statSync(filePath);
        return {
            success: true,
            fileName: path.basename(filePath),
            filePath,
            format: 'csv',
            recordCount: data.length,
            fileSize: stats.size,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
    }
    /**
     * Export to Excel format
     */
    async exportToExcel(data, fileName, options) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
        const filePath = path.join('/tmp', `${fileName}-${Date.now()}.xlsx`);
        XLSX.writeFile(workbook, filePath);
        const stats = fs.statSync(filePath);
        return {
            success: true,
            fileName: path.basename(filePath),
            filePath,
            format: 'xlsx',
            recordCount: data.length,
            fileSize: stats.size,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
    /**
     * Export to PDF format
     */
    async exportToPDF(data, fileName, options) {
        return new Promise((resolve, reject) => {
            try {
                const filePath = path.join('/tmp', `${fileName}-${Date.now()}.pdf`);
                const doc = new pdfkit_1.default();
                doc.pipe(fs.createWriteStream(filePath));
                // Add title
                doc.fontSize(16).text(`${fileName.toUpperCase()} REPORT`, { align: 'center' });
                doc.moveDown();
                // Add generation date
                doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
                doc.moveDown();
                // Add table headers
                if (data.length > 0) {
                    const headers = Object.keys(data[0]);
                    let y = doc.y;
                    let x = 50;
                    headers.forEach(header => {
                        doc.fontSize(8).text(header.toUpperCase(), x, y, { width: 80 });
                        x += 80;
                    });
                    doc.moveDown();
                    // Add data rows
                    data.forEach(row => {
                        y = doc.y;
                        x = 50;
                        headers.forEach(header => {
                            const value = String(row[header] || '');
                            doc.fontSize(7).text(value, x, y, { width: 80 });
                            x += 80;
                        });
                        doc.moveDown(0.5);
                        // Add new page if needed
                        if (doc.y > 700) {
                            doc.addPage();
                        }
                    });
                }
                doc.end();
                doc.on('end', () => {
                    const stats = fs.statSync(filePath);
                    resolve({
                        success: true,
                        fileName: path.basename(filePath),
                        filePath,
                        format: 'pdf',
                        recordCount: data.length,
                        fileSize: stats.size,
                        generatedAt: new Date(),
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                    });
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Export to JSON format
     */
    async exportToJSON(data, fileName, options) {
        const jsonData = {
            exportInfo: {
                fileName,
                generatedAt: new Date().toISOString(),
                recordCount: data.length,
                options
            },
            data
        };
        const filePath = path.join('/tmp', `${fileName}-${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        const stats = fs.statSync(filePath);
        return {
            success: true,
            fileName: path.basename(filePath),
            filePath,
            format: 'json',
            recordCount: data.length,
            fileSize: stats.size,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
    }
    /**
     * Convert data to CSV format
     */
    convertToCSV(data, options) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        let csv = '';
        // Add headers if requested
        if (options.includeHeaders !== false) {
            csv += headers.join(',') + '\n';
        }
        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined)
                    return '';
                // Escape quotes and wrap in quotes if necessary
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                return stringValue;
            });
            csv += values.join(',') + '\n';
        });
        return csv;
    }
    /**
     * Format date for export
     */
    formatDate(date) {
        if (!date)
            return '';
        return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR');
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=exportService.js.map