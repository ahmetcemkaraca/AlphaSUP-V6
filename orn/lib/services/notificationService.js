"use strict";
/**
 * Notification Service for AlphaSUP
 *
 * Handles all types of notifications including SMS, email, and in-app notifications
 * Integrated with VatanSMS for cost-effective Turkish SMS delivery
 *
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.sendCustomSms = exports.sendBulkNotificationSms = exports.sendWeatherAlertSms = exports.sendPaymentConfirmationSms = exports.sendBookingCancellationSms = exports.sendBookingReminderSms = exports.sendBookingConfirmationSms = exports.SMS_TEMPLATES = void 0;
const firebase_1 = require("../config/firebase");
const smsService_1 = require("./smsService");
// Notification Templates
exports.SMS_TEMPLATES = {
    BOOKING_CONFIRMATION: (customerName, bookingId, date, time) => `Merhaba ${customerName}! AlphaSUP rezervasyonunuz onaylandı. 🏄‍♂️\n\nRezervation: ${bookingId}\nTarih: ${date}\nSaat: ${time}\n\nİyi eğlenceler!`,
    BOOKING_REMINDER: (customerName, bookingId, date, time) => `Sayın ${customerName}, AlphaSUP rezervasyonunuz yarın! 🌊\n\nRezervation: ${bookingId}\nTarih: ${date}\nSaat: ${time}\n\nHazırlıklarınızı tamamlayın!`,
    BOOKING_CANCELLATION: (customerName, bookingId) => `Sayın ${customerName}, rezervasyonunuz iptal edildi.\n\nRezervation: ${bookingId}\n\nYeni rezervasyon için: alphasupack.web.app`,
    WEATHER_ALERT: (customerName, bookingId, weatherInfo) => `Sayın ${customerName}, rezervasyonunuz için hava durumu uyarısı! ⛈️\n\nRezervation: ${bookingId}\n${weatherInfo}\n\nDetaylar için iletişime geçin.`,
    PAYMENT_CONFIRMATION: (customerName, amount, bookingId) => `Sayın ${customerName}, ödemeniz alındı! ✅\n\nTutar: ${amount}₺\nRezervation: ${bookingId}\n\nTeşekkürler!`,
    EQUIPMENT_READY: (customerName, bookingId, equipmentList) => `Sayın ${customerName}, ekipmanlarınız hazır! 🏄‍♂️\n\nRezervation: ${bookingId}\nEkipmanlar: ${equipmentList}\n\nGelme zamanınız yaklaştı!`,
    CUSTOM_MESSAGE: (message) => message
};
/**
 * Logs notification to Firestore for audit trail
 */
const logNotification = async (log) => {
    try {
        await firebase_1.db.collection('notifications').add({
            ...log,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error logging notification:', error);
    }
};
/**
 * Sends booking confirmation SMS
 */
const sendBookingConfirmationSms = async (customerPhone, customerName, bookingId, customerId) => {
    try {
        // Check if SMS is enabled before attempting to send
        if (!(0, smsService_1.isSMSEnabled)()) {
            console.log('📱 SMS not enabled - skipping booking confirmation SMS');
            // Still log the notification for admin tracking (with status 'failed')
            await logNotification({
                customerId,
                bookingId,
                type: 'booking_confirmation',
                phone: customerPhone,
                message: 'SMS disabled - notification not sent',
                status: 'failed',
                provider: 'vatansms',
                sentAt: new Date().toISOString(),
                error: 'SMS service not configured or disabled'
            });
            return;
        }
        // Get booking details
        const bookingDoc = await firebase_1.db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
            throw new Error(`Booking ${bookingId} not found`);
        }
        const booking = bookingDoc.data();
        const date = new Date(booking['startDate']).toLocaleDateString('tr-TR');
        const time = new Date(booking['startDate']).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const message = exports.SMS_TEMPLATES.BOOKING_CONFIRMATION(customerName, bookingId, date, time);
        const response = await (0, smsService_1.sendSms)(customerPhone, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification
        await logNotification({
            customerId,
            bookingId,
            type: 'booking_confirmation',
            phone: customerPhone,
            message,
            status: response.status ? 'sent' : 'failed',
            provider: 'vatansms',
            reportId: response.data?.report_id,
            cost: response.data?.cost,
            sentAt: new Date().toISOString()
        });
        console.log('✅ Booking confirmation SMS sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending booking confirmation SMS:', error);
        // Log failed notification
        await logNotification({
            customerId,
            bookingId,
            type: 'booking_confirmation',
            phone: customerPhone,
            message: exports.SMS_TEMPLATES.BOOKING_CONFIRMATION(customerName, bookingId, 'N/A', 'N/A'),
            status: 'failed',
            provider: 'vatansms',
            sentAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Don't throw error to prevent booking creation from failing due to SMS issues
        console.log('🔄 SMS error handled gracefully - booking creation continues');
    }
};
exports.sendBookingConfirmationSms = sendBookingConfirmationSms;
/**
 * Sends booking reminder SMS
 */
const sendBookingReminderSms = async (customerPhone, customerName, bookingId, customerId) => {
    try {
        // Check if SMS is enabled before attempting to send
        if (!(0, smsService_1.isSMSEnabled)()) {
            console.log('📱 SMS not enabled - skipping booking reminder SMS');
            // Still log the notification for admin tracking
            await logNotification({
                customerId,
                bookingId,
                type: 'booking_reminder',
                phone: customerPhone,
                message: 'SMS disabled - notification not sent',
                status: 'failed',
                provider: 'vatansms',
                sentAt: new Date().toISOString(),
                error: 'SMS service not configured or disabled'
            });
            return;
        }
        // Get booking details
        const bookingDoc = await firebase_1.db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
            throw new Error(`Booking ${bookingId} not found`);
        }
        const booking = bookingDoc.data();
        const date = new Date(booking['startDate']).toLocaleDateString('tr-TR');
        const time = new Date(booking['startDate']).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const message = exports.SMS_TEMPLATES.BOOKING_REMINDER(customerName, bookingId, date, time);
        const response = await (0, smsService_1.sendSms)(customerPhone, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification
        await logNotification({
            customerId,
            bookingId,
            type: 'booking_reminder',
            phone: customerPhone,
            message,
            status: response.status ? 'sent' : 'failed',
            provider: 'vatansms',
            reportId: response.data?.report_id,
            cost: response.data?.cost,
            sentAt: new Date().toISOString()
        });
        // Update booking to mark reminder as sent
        await firebase_1.db.collection('bookings').doc(bookingId).update({
            reminderSent: true,
            reminderSentAt: new Date().toISOString()
        });
        console.log('✅ Booking reminder SMS sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending booking reminder SMS:', error);
        throw error;
    }
};
exports.sendBookingReminderSms = sendBookingReminderSms;
/**
 * Sends booking cancellation SMS
 */
const sendBookingCancellationSms = async (customerPhone, customerName, bookingId, customerId) => {
    try {
        const message = exports.SMS_TEMPLATES.BOOKING_CANCELLATION(customerName, bookingId);
        const response = await (0, smsService_1.sendSms)(customerPhone, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification
        await logNotification({
            customerId,
            bookingId,
            type: 'booking_cancellation',
            phone: customerPhone,
            message,
            status: response.status ? 'sent' : 'failed',
            provider: 'vatansms',
            reportId: response.data?.report_id,
            cost: response.data?.cost,
            sentAt: new Date().toISOString()
        });
        console.log('✅ Booking cancellation SMS sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending booking cancellation SMS:', error);
        throw error;
    }
};
exports.sendBookingCancellationSms = sendBookingCancellationSms;
/**
 * Sends payment confirmation SMS
 */
const sendPaymentConfirmationSms = async (customerPhone, customerName, amount, bookingId, customerId) => {
    try {
        const formattedAmount = amount.toLocaleString('tr-TR');
        const message = exports.SMS_TEMPLATES.PAYMENT_CONFIRMATION(customerName, formattedAmount, bookingId);
        const response = await (0, smsService_1.sendSms)(customerPhone, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification
        await logNotification({
            customerId,
            bookingId,
            type: 'payment_confirmation',
            phone: customerPhone,
            message,
            status: response.status ? 'sent' : 'failed',
            provider: 'vatansms',
            reportId: response.data?.report_id,
            cost: response.data?.cost,
            sentAt: new Date().toISOString()
        });
        console.log('✅ Payment confirmation SMS sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending payment confirmation SMS:', error);
        throw error;
    }
};
exports.sendPaymentConfirmationSms = sendPaymentConfirmationSms;
/**
 * Sends weather alert SMS
 */
const sendWeatherAlertSms = async (customerPhone, customerName, bookingId, weatherInfo, customerId) => {
    try {
        const message = exports.SMS_TEMPLATES.WEATHER_ALERT(customerName, bookingId, weatherInfo);
        const response = await (0, smsService_1.sendSms)(customerPhone, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification
        await logNotification({
            customerId,
            bookingId,
            type: 'weather_alert',
            phone: customerPhone,
            message,
            status: response.status ? 'sent' : 'failed',
            provider: 'vatansms',
            reportId: response.data?.report_id,
            cost: response.data?.cost,
            sentAt: new Date().toISOString()
        });
        console.log('✅ Weather alert SMS sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending weather alert SMS:', error);
        throw error;
    }
};
exports.sendWeatherAlertSms = sendWeatherAlertSms;
/**
 * Sends bulk SMS to multiple customers
 */
const sendBulkNotificationSms = async (recipients, templateType, templateData = {}) => {
    try {
        const phones = recipients.map(recipient => recipient.phone);
        const message = typeof exports.SMS_TEMPLATES[templateType] === 'function'
            ? exports.SMS_TEMPLATES[templateType](...Object.values(templateData))
            : exports.SMS_TEMPLATES[templateType];
        const response = await (0, smsService_1.sendBulkSms)(phones, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification for each recipient
        for (const recipient of recipients) {
            await logNotification({
                customerId: recipient.customerId,
                type: `bulk_${templateType}`,
                phone: recipient.phone,
                message,
                status: response.status ? 'sent' : 'failed',
                provider: 'vatansms',
                reportId: response.data?.report_id,
                cost: response.data?.cost ? response.data.cost / recipients.length : undefined,
                sentAt: new Date().toISOString()
            });
        }
        console.log(`✅ Bulk SMS sent to ${recipients.length} recipients`);
    }
    catch (error) {
        console.error('❌ Error sending bulk SMS:', error);
        throw error;
    }
};
exports.sendBulkNotificationSms = sendBulkNotificationSms;
/**
 * Sends custom SMS message
 */
const sendCustomSms = async (customerPhone, message, customerId, bookingId) => {
    try {
        const response = await (0, smsService_1.sendSms)(customerPhone, message, {
            messageType: 'turkce',
            messageContentType: 'bilgi'
        });
        // Log notification
        await logNotification({
            customerId,
            bookingId,
            type: 'custom_message',
            phone: customerPhone,
            message,
            status: response.status ? 'sent' : 'failed',
            provider: 'vatansms',
            reportId: response.data?.report_id,
            cost: response.data?.cost,
            sentAt: new Date().toISOString()
        });
        console.log('✅ Custom SMS sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending custom SMS:', error);
        throw error;
    }
};
exports.sendCustomSms = sendCustomSms;
/**
 * NotificationService Class
 * Wrapper class for notification functions to provide object-oriented interface
 */
class NotificationService {
    constructor() {
        // Constructor - no initialization needed
    }
    /**
     * Send points earned notification
     */
    async sendPointsEarnedNotification(customerId, points) {
        try {
            // Get customer info
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                console.log('Customer not found for points notification');
                return;
            }
            const customer = customerDoc.data();
            if (!customer?.['phone']) {
                console.log('Customer phone not available for points notification');
                return;
            }
            const message = `Tebrikler ${customer['firstName'] || 'Değerli Müşterimiz'}! 🎉\n\n${points} puan kazandınız!\n\nPuanlarınızı incelemek için: alphasupack.web.app/hesabim`;
            await (0, exports.sendCustomSms)(customer['phone'], message, customerId);
        }
        catch (error) {
            console.error('Error sending points earned notification:', error);
            // Don't throw error to prevent main operation from failing
        }
    }
    /**
     * Send reward redeemed notification
     */
    async sendRewardRedeemedNotification(customerId, reward, redemptionId) {
        try {
            // Get customer info
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                console.log('Customer not found for reward notification');
                return;
            }
            const customer = customerDoc.data();
            if (!customer?.['phone']) {
                console.log('Customer phone not available for reward notification');
                return;
            }
            const message = `Tebrikler ${customer['firstName'] || 'Değerli Müşterimiz'}! 🎁\n\n"${reward.title}" ödülünüz hazır!\n\nReferans: ${redemptionId}\n\nDetaylar için: alphasupack.web.app/hesabim`;
            await (0, exports.sendCustomSms)(customer['phone'], message, customerId);
        }
        catch (error) {
            console.error('Error sending reward redeemed notification:', error);
            // Don't throw error to prevent main operation from failing
        }
    }
    /**
     * Send tier upgrade notification
     */
    async sendTierUpgradeNotification(customerId, newTier) {
        try {
            // Get customer info
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                console.log('Customer not found for tier upgrade notification');
                return;
            }
            const customer = customerDoc.data();
            if (!customer?.['phone']) {
                console.log('Customer phone not available for tier upgrade notification');
                return;
            }
            const message = `Tebrikler ${customer['firstName'] || 'Değerli Müşterimiz'}! 🌟\n\nYeni seviyeniz: ${newTier.name}\n\nYeni avantajlarınızı keşfedin: alphasupack.web.app/hesabim`;
            await (0, exports.sendCustomSms)(customer['phone'], message, customerId);
        }
        catch (error) {
            console.error('Error sending tier upgrade notification:', error);
            // Don't throw error to prevent main operation from failing
        }
    }
    /**
     * Send general notification
     */
    async sendNotification(customerId, message, type = 'general') {
        try {
            // Get customer info
            const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
            if (!customerDoc.exists) {
                console.log('Customer not found for notification');
                return;
            }
            const customer = customerDoc.data();
            if (!customer?.['phone']) {
                console.log('Customer phone not available for notification');
                return;
            }
            await (0, exports.sendCustomSms)(customer['phone'], message, customerId);
        }
        catch (error) {
            console.error('Error sending notification:', error);
            // Don't throw error to prevent main operation from failing
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map