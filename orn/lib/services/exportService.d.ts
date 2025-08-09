/**
 * Export Service
 * Multi-format data export with advanced formatting
 */
export interface ExportOptions {
    format: 'csv' | 'xlsx' | 'pdf' | 'json';
    fields?: string[];
    filters?: Record<string, any>;
    sort?: Record<string, 'asc' | 'desc'>;
    limit?: number;
    includeHeaders?: boolean;
    dateFormat?: string;
    locale?: string;
    template?: string;
}
export interface ExportResult {
    success: boolean;
    fileName: string;
    fileUrl?: string;
    filePath?: string;
    format: string;
    recordCount: number;
    fileSize: number;
    generatedAt: Date;
    expiresAt?: Date;
}
export declare class ExportService {
    private db;
    constructor();
    /**
     * Export customers data
     */
    exportCustomers(options: ExportOptions): Promise<ExportResult>;
    /**
     * Export bookings data
     */
    exportBookings(options: ExportOptions): Promise<ExportResult>;
    /**
     * Export services data
     */
    exportServices(options: ExportOptions): Promise<ExportResult>;
    /**
     * Export financial report
     */
    exportFinancialReport(startDate: Date, endDate: Date, options: ExportOptions): Promise<ExportResult>;
    /**
     * Get customers data for export
     */
    private getCustomersData;
    /**
     * Get bookings data for export
     */
    private getBookingsData;
    /**
     * Get services data for export
     */
    private getServicesData;
    /**
     * Get financial data for export
     */
    private getFinancialData;
    /**
     * Export to CSV format
     */
    private exportToCSV;
    /**
     * Export to Excel format
     */
    private exportToExcel;
    /**
     * Export to PDF format
     */
    private exportToPDF;
    /**
     * Export to JSON format
     */
    private exportToJSON;
    /**
     * Convert data to CSV format
     */
    private convertToCSV;
    /**
     * Format date for export
     */
    private formatDate;
}
//# sourceMappingURL=exportService.d.ts.map