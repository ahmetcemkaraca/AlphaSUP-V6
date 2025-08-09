"use strict";
/**
 * VatanSMS Service
 *
 * A wrapper for VatanSMS Turkish SMS provider.
 * Cost-effective SMS solution for Turkish numbers.
 *
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSenderNames = exports.getUserInfo = exports.cancelScheduledSms = exports.getSmsReportsByDate = exports.getSmsReport = exports.sendPersonalizedSms = exports.sendBulkSms = exports.sendSms = exports.isSMSEnabled = exports.isVatanSMSConfigured = void 0;
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
/**
 * Check if VatanSMS is properly configured with all required credentials
 * @returns boolean indicating if SMS is configured
 */
const isVatanSMSConfigured = () => {
    const config = getVatanSMSConfig();
    return !!(config.apiId && config.apiKey);
};
exports.isVatanSMSConfigured = isVatanSMSConfigured;
/**
 * Check if SMS functionality is enabled (both configured and not explicitly disabled)
 * @returns boolean indicating if SMS should be used
 */
const isSMSEnabled = () => {
    // Check if SMS is explicitly disabled
    const smsEnabled = process.env['SMS_ENABLED'];
    if (smsEnabled && smsEnabled.toLowerCase() === 'false') {
        return false;
    }
    // If no explicit setting, default to true if configured
    return (0, exports.isVatanSMSConfigured)();
};
exports.isSMSEnabled = isSMSEnabled;
// Initialize VatanSMS config from environment variables
const getVatanSMSConfig = () => {
    return {
        apiId: process.env['VATANSMS_API_ID'] || '',
        apiKey: process.env['VATANSMS_API_KEY'] || '',
        sender: process.env['VATANSMS_SENDER'] || 'ALPHASUP',
        baseUrl: 'https://api.vatansms.net/api/v1'
    };
};
/**
 * Sends a single SMS to one recipient (1-to-1)
 * @param to The recipient's phone number (Turkish format: 5XXXXXXXXX)
 * @param message The message content
 * @param options Additional SMS options
 * @returns Promise with VatanSMS response
 */
const sendSms = async (to, message, options = {}) => {
    try {
        // Check if SMS is enabled and configured
        if (!(0, exports.isSMSEnabled)()) {
            console.log('📱 SMS not configured or disabled - skipping SMS send');
            return {
                status: true,
                message: 'SMS disabled - simulation mode',
                data: {
                    id: Date.now(),
                    report_id: Date.now(),
                    cost: 0
                }
            };
        }
        const config = getVatanSMSConfig();
        // Clean phone number (remove +90, spaces, etc.)
        const cleanPhone = to.replace(/\D/g, '').replace(/^90/, '');
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey,
            sender: config.sender,
            message_type: options.messageType || 'turkce',
            message_content_type: options.messageContentType || 'bilgi',
            message: message,
            phones: [cleanPhone],
            ...(options.sendTime && { send_time: options.sendTime })
        };
        console.log(`📱 VatanSMS: Sending SMS to ${cleanPhone}`);
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/1toN`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        console.log('✅ VatanSMS: SMS sent successfully', {
            reportId: response.data.data?.report_id,
            cost: response.data.data?.cost
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error sending SMS:', error);
        // Return a simulated success response instead of throwing error
        // This prevents booking creation from failing due to SMS errors
        console.log('🔄 SMS failed - continuing with business logic');
        return {
            status: false,
            message: 'SMS failed but operation continued',
            data: {
                id: Date.now(),
                report_id: Date.now(),
                cost: 0
            }
        };
    }
};
exports.sendSms = sendSms;
/**
 * Sends bulk SMS to multiple recipients (1-to-N)
 * @param phones Array of phone numbers
 * @param message The message content
 * @param options Additional SMS options
 * @returns Promise with VatanSMS response
 */
const sendBulkSms = async (phones, message, options = {}) => {
    try {
        // Check if SMS is enabled and configured
        if (!(0, exports.isSMSEnabled)()) {
            console.log(`📱 SMS not configured or disabled - skipping bulk SMS to ${phones.length} numbers`);
            return {
                status: true,
                message: 'SMS disabled - simulation mode',
                data: {
                    id: Date.now(),
                    report_id: Date.now(),
                    cost: 0
                }
            };
        }
        const config = getVatanSMSConfig();
        // Clean all phone numbers
        const cleanPhones = phones.map(phone => phone.replace(/\D/g, '').replace(/^90/, ''));
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey,
            sender: config.sender,
            message_type: options.messageType || 'turkce',
            message_content_type: options.messageContentType || 'bilgi',
            message: message,
            phones: cleanPhones,
            ...(options.sendTime && { send_time: options.sendTime })
        };
        console.log(`📱 VatanSMS: Sending bulk SMS to ${cleanPhones.length} recipients`);
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/1toN`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        console.log('✅ VatanSMS: Bulk SMS sent successfully', {
            reportId: response.data.data?.report_id,
            cost: response.data.data?.cost
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error sending bulk SMS:', error);
        // Return simulated success for graceful degradation
        console.log('🔄 Bulk SMS failed - continuing with business logic');
        return {
            status: false,
            message: 'Bulk SMS failed but operation continued',
            data: {
                id: Date.now(),
                report_id: Date.now(),
                cost: 0
            }
        };
    }
};
exports.sendBulkSms = sendBulkSms;
/**
 * Sends personalized SMS to multiple recipients (N-to-N)
 * @param messages Array of {phone, message} objects
 * @param options Additional SMS options
 * @returns Promise with VatanSMS response
 */
const sendPersonalizedSms = async (messages, options = {}) => {
    try {
        // Check if SMS is enabled and configured
        if (!(0, exports.isSMSEnabled)()) {
            console.log(`📱 SMS not configured or disabled - skipping personalized SMS to ${messages.length} recipients`);
            return {
                status: true,
                message: 'SMS disabled - simulation mode',
                data: {
                    id: Date.now(),
                    report_id: Date.now(),
                    cost: 0
                }
            };
        }
        const config = getVatanSMSConfig();
        // Clean phone numbers and prepare data
        const phonesData = messages.map(item => ({
            phone: item.phone.replace(/\D/g, '').replace(/^90/, ''),
            message: item.message
        }));
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey,
            sender: config.sender,
            message_type: options.messageType || 'turkce',
            message_content_type: options.messageContentType || 'bilgi',
            phones: phonesData,
            ...(options.sendTime && { send_time: options.sendTime })
        };
        console.log(`📱 VatanSMS: Sending personalized SMS to ${phonesData.length} recipients`);
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/NtoN`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        console.log('✅ VatanSMS: Personalized SMS sent successfully', {
            reportId: response.data.data?.report_id,
            cost: response.data.data?.cost
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error sending personalized SMS:', error);
        // Return simulated success for graceful degradation
        console.log('🔄 Personalized SMS failed - continuing with business logic');
        return {
            status: false,
            message: 'Personalized SMS failed but operation continued',
            data: {
                id: Date.now(),
                report_id: Date.now(),
                cost: 0
            }
        };
    }
};
exports.sendPersonalizedSms = sendPersonalizedSms;
/**
 * Gets SMS delivery report by report ID
 * @param reportId Report ID returned from SMS send
 * @param page Page number for pagination (optional)
 * @param pageSize Items per page (optional, 1-100)
 * @returns Promise with delivery report
 */
const getSmsReport = async (reportId, page, pageSize) => {
    try {
        const config = getVatanSMSConfig();
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey,
            report_id: reportId
        };
        let url = `${config.baseUrl}/report/detail`;
        if (page && pageSize) {
            url += `?page=${page}&pageSize=${pageSize}`;
        }
        const response = await (0, axios_1.default)({
            method: 'post',
            url: url,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error getting SMS report:', error);
        throw error;
    }
};
exports.getSmsReport = getSmsReport;
/**
 * Gets SMS reports between date range
 * @param startDate Start date (Y-m-d H:i:s format)
 * @param endDate End date (Y-m-d H:i:s format)
 * @returns Promise with reports
 */
const getSmsReportsByDate = async (startDate, endDate) => {
    try {
        const config = getVatanSMSConfig();
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey,
            start_date: startDate,
            end_date: endDate
        };
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/report/between`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error getting SMS reports by date:', error);
        throw error;
    }
};
exports.getSmsReportsByDate = getSmsReportsByDate;
/**
 * Cancels scheduled SMS
 * @param reportId Report ID of the scheduled SMS
 * @returns Promise with cancellation result
 */
const cancelScheduledSms = async (reportId) => {
    try {
        const config = getVatanSMSConfig();
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey,
            id: reportId
        };
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/cancel/future-sms`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        console.log('✅ VatanSMS: Scheduled SMS cancelled successfully');
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error cancelling scheduled SMS:', error);
        throw error;
    }
};
exports.cancelScheduledSms = cancelScheduledSms;
/**
 * Gets user account information and balance
 * @returns Promise with user information
 */
const getUserInfo = async () => {
    try {
        const config = getVatanSMSConfig();
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey
        };
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/user/information`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error getting user info:', error);
        throw error;
    }
};
exports.getUserInfo = getUserInfo;
/**
 * Gets available sender names
 * @returns Promise with sender names
 */
const getSenderNames = async () => {
    try {
        const config = getVatanSMSConfig();
        const requestData = {
            api_id: config.apiId,
            api_key: config.apiKey
        };
        const response = await (0, axios_1.default)({
            method: 'post',
            url: `${config.baseUrl}/senders`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: requestData
        });
        return response.data;
    }
    catch (error) {
        console.error('❌ VatanSMS: Error getting sender names:', error);
        throw error;
    }
};
exports.getSenderNames = getSenderNames;
//# sourceMappingURL=smsService.js.map