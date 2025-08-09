/**
 * VatanSMS Service
 *
 * A wrapper for VatanSMS Turkish SMS provider.
 * Cost-effective SMS solution for Turkish numbers.
 *
 * @version 3.0.0
 */
/**
 * Check if VatanSMS is properly configured with all required credentials
 * @returns boolean indicating if SMS is configured
 */
export declare const isVatanSMSConfigured: () => boolean;
/**
 * Check if SMS functionality is enabled (both configured and not explicitly disabled)
 * @returns boolean indicating if SMS should be used
 */
export declare const isSMSEnabled: () => boolean;
interface VatanSMSResponse {
    status: boolean;
    message: string;
    data?: {
        id: number;
        report_id: number;
        cost: number;
    };
}
interface SMSOptions {
    messageType?: 'normal' | 'turkce';
    messageContentType?: 'bilgi' | 'ticari';
    sendTime?: string;
}
/**
 * Sends a single SMS to one recipient (1-to-1)
 * @param to The recipient's phone number (Turkish format: 5XXXXXXXXX)
 * @param message The message content
 * @param options Additional SMS options
 * @returns Promise with VatanSMS response
 */
export declare const sendSms: (to: string, message: string, options?: SMSOptions) => Promise<VatanSMSResponse>;
/**
 * Sends bulk SMS to multiple recipients (1-to-N)
 * @param phones Array of phone numbers
 * @param message The message content
 * @param options Additional SMS options
 * @returns Promise with VatanSMS response
 */
export declare const sendBulkSms: (phones: string[], message: string, options?: SMSOptions) => Promise<VatanSMSResponse>;
/**
 * Sends personalized SMS to multiple recipients (N-to-N)
 * @param messages Array of {phone, message} objects
 * @param options Additional SMS options
 * @returns Promise with VatanSMS response
 */
export declare const sendPersonalizedSms: (messages: Array<{
    phone: string;
    message: string;
}>, options?: SMSOptions) => Promise<VatanSMSResponse>;
/**
 * Gets SMS delivery report by report ID
 * @param reportId Report ID returned from SMS send
 * @param page Page number for pagination (optional)
 * @param pageSize Items per page (optional, 1-100)
 * @returns Promise with delivery report
 */
export declare const getSmsReport: (reportId: number, page?: number, pageSize?: number) => Promise<any>;
/**
 * Gets SMS reports between date range
 * @param startDate Start date (Y-m-d H:i:s format)
 * @param endDate End date (Y-m-d H:i:s format)
 * @returns Promise with reports
 */
export declare const getSmsReportsByDate: (startDate: string, endDate: string) => Promise<any>;
/**
 * Cancels scheduled SMS
 * @param reportId Report ID of the scheduled SMS
 * @returns Promise with cancellation result
 */
export declare const cancelScheduledSms: (reportId: number) => Promise<any>;
/**
 * Gets user account information and balance
 * @returns Promise with user information
 */
export declare const getUserInfo: () => Promise<any>;
/**
 * Gets available sender names
 * @returns Promise with sender names
 */
export declare const getSenderNames: () => Promise<any>;
export {};
//# sourceMappingURL=smsService.d.ts.map