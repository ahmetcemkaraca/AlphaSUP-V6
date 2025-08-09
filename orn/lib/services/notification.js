"use strict";
/**
 * Notification Service - SMS, Email, and Push Notifications
 * Bildirim hizmetleri - SMS, e-posta ve push bildirimleri
 * AlphaSUP - Phase 7 SMS Integration Enhanced
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = exports.NotificationType = void 0;
const firebase_admin_1 = require("firebase-admin");
const uuid_1 = require("uuid");
class SMSTemplateService {
    render(templateKey, variables) {
        // naive templating for logs
        return `template:${templateKey} ${JSON.stringify(variables)}`;
    }
}
class SMSService {
    constructor(cfg) {
        this.cfg = cfg;
    }
    async send(to, body) {
        console.log('[SMS] sending', { provider: this.cfg.provider, to, body });
        return { success: true, messageId: `mock-${Date.now()}` };
    }
}
class NotificationManager {
    constructor(sms, templates) {
        this.sms = sms;
        this.templates = templates;
    }
    async sendBookingConfirmation(payload) {
        const body = this.templates.render('booking_confirmation', payload);
        return this.sms.send(payload.customerPhone, body);
    }
    async sendPaymentConfirmation(payload) {
        const body = this.templates.render('payment_confirmation', payload);
        return this.sms.send(payload.customerPhone, body);
    }
    async sendBookingReminder(payload) {
        const body = this.templates.render('booking_reminder', payload);
        return this.sms.send(payload.customerPhone, body);
    }
    async sendWeatherAlert(payload) {
        const body = this.templates.render('weather_alert', payload);
        return this.sms.send(payload.customerPhone, body);
    }
    async sendCancellationNotification(payload) {
        const body = this.templates.render('booking_cancellation', payload);
        return this.sms.send(payload.customerPhone, body);
    }
}
// Notification types
var NotificationType;
(function (NotificationType) {
    NotificationType["SMS"] = "sms";
    NotificationType["EMAIL"] = "email";
    NotificationType["PUSH"] = "push";
    NotificationType["IN_APP"] = "in_app";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class NotificationService {
    constructor() {
        this.db = (0, firebase_admin_1.firestore)();
        // Phase 7: Initialize SMS services
        this.initializeSMSServices();
    }
    /**
     * Phase 7: Initialize SMS services
     */
    initializeSMSServices() {
        console.log('🚧 [Notification Service] SMS servislerini başlatıyor - Phase 7 Implementation');
        // SMS konfigürasyonu
        const smsConfig = {
            provider: 'twilio',
            twilio: {
                accountSid: process.env.TWILIO_ACCOUNT_SID || '',
                authToken: process.env.TWILIO_AUTH_TOKEN || '',
                fromNumber: process.env.TWILIO_FROM_NUMBER || '',
            },
            defaultLanguage: 'tr',
            maxRetries: 3,
            retryDelay: 5000,
            rateLimit: {
                perMinute: 10,
                perHour: 100,
                perDay: 1000,
            },
        };
        this.smsService = new SMSService(smsConfig);
        this.templateService = new SMSTemplateService();
        this.notificationManager = new NotificationManager(this.smsService, this.templateService);
    }
    /**
     * Send payment receipt notification
     */
    async sendPaymentReceiptNotification(customerId, bookingId, payment) {
        try {
            // Get customer details
            const customerDoc = await this.db
                .collection('customers')
                .doc(customerId)
                .get();
            const customer = customerDoc.data();
            if (!customer) {
                throw new Error('Customer not found');
            }
            // Send email receipt
            if (customer.email) {
                await this.sendEmailNotification(customer.email, 'Ödeme Makbuzu - AlphaSUP', this.generatePaymentReceiptEmail(payment, customer, bookingId));
            }
            // Send SMS notification if phone number exists
            if (customer.phone) {
                // Phase 7: Updated SMS call
                await this.sendSMSNotification('payment_confirmation', {
                    customerId,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    customerPhone: customer.phone,
                    bookingId,
                    amount: payment.amount.toString(),
                    currency: payment.currency.toUpperCase(),
                });
            }
            console.log(`Payment receipt sent to customer: ${customerId}`);
        }
        catch (error) {
            console.error('Failed to send payment receipt:', error);
            throw error;
        }
    }
    /**
     * Send payment failed notification
     */
    async sendPaymentFailedNotification(customerId, bookingId, failureReason) {
        try {
            const customerDoc = await this.db
                .collection('customers')
                .doc(customerId)
                .get();
            const customer = customerDoc.data();
            if (!customer) {
                throw new Error('Customer not found');
            }
            // Send email notification
            if (customer.email) {
                await this.sendEmailNotification(customer.email, 'Ödeme Başarısız - AlphaSUP', this.generatePaymentFailedEmail(customer, bookingId, failureReason));
            }
            // Send SMS notification
            if (customer.phone) {
                // Phase 7: For payment failure, we'll use a simple log for now
                // TODO: Add payment_failure type to SMS notification system
                console.log('🚧 [SMS] Ödeme başarısız SMS - Phase 7 Implementation', {
                    phone: customer.phone,
                    bookingId,
                    reason: failureReason,
                });
                // Temporarily use booking_cancellation type as fallback
                await this.sendSMSNotification('booking_cancellation', {
                    customerId,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    customerPhone: customer.phone,
                    bookingId,
                    refundDays: 'N/A',
                    contactPhone: '+90 555 123 4567',
                });
            }
            console.log(`Payment failed notification sent to customer: ${customerId}`);
        }
        catch (error) {
            console.error('Failed to send payment failed notification:', error);
            throw error;
        }
    }
    /**
     * Send refund notification
     */
    async sendRefundNotification(customerId, bookingId, amount) {
        try {
            const customerDoc = await this.db
                .collection('customers')
                .doc(customerId)
                .get();
            const customer = customerDoc.data();
            if (!customer) {
                throw new Error('Customer not found');
            }
            // Send email notification
            if (customer.email) {
                await this.sendEmailNotification(customer.email, 'İade İşlemi - AlphaSUP', this.generateRefundEmail(customer, bookingId, amount));
            }
            // Send SMS notification
            if (customer.phone) {
                // Phase 7: Use booking cancellation for refund notifications
                await this.sendSMSNotification('booking_cancellation', {
                    customerId,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                    customerPhone: customer.phone,
                    bookingId,
                    refundDays: '3-7',
                    contactPhone: '+90 555 123 4567',
                });
            }
            console.log(`Refund notification sent to customer: ${customerId}`);
        }
        catch (error) {
            console.error('Failed to send refund notification:', error);
            throw error;
        }
    }
    /**
     * Send email notification
     */
    async sendEmailNotification(email, subject, content) {
        try {
            // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
            // For now, log the email content
            console.log('Email notification:', {
                to: email,
                subject,
                content,
                timestamp: new Date().toISOString(),
            });
            // Save notification to database
            await this.saveNotificationLog({
                type: NotificationType.EMAIL,
                recipient: email,
                subject,
                content,
                status: 'sent',
            });
        }
        catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }
    /**
     * Generate payment receipt email content
     */
    generatePaymentReceiptEmail(payment, customer, bookingId) {
        return `
            <html>
            <body>
                <h2>Ödeme Makbuzu - AlphaSUP</h2>
                <p>Sayın ${customer.firstName} ${customer.lastName},</p>
                <p>Ödemeniz başarıyla alınmıştır.</p>
                
                <h3>Rezervasyon Detayları:</h3>
                <ul>
                    <li>Rezervasyon No: ${bookingId}</li>
                    <li>Ödenen Tutar: ${payment.amount} ${payment.currency.toUpperCase()}</li>
                    <li>Ödeme Yöntemi: ${this.formatPaymentMethod(payment.paymentMethod)}</li>
                    <li>İşlem Tarihi: ${new Date(payment.createdAt).toLocaleString('tr-TR')}</li>
                </ul>
                
                <p>Rezervasyonunuz onaylanmıştır. SUP deneyiminiz için sabırsızlanıyoruz!</p>
                
                <p>İyi günler,<br>AlphaSUP Ekibi</p>
            </body>
            </html>
        `;
    }
    /**
     * Generate payment failed email content
     */
    generatePaymentFailedEmail(customer, bookingId, failureReason) {
        return `
            <html>
            <body>
                <h2>Ödeme Başarısız - AlphaSUP</h2>
                <p>Sayın ${customer.firstName} ${customer.lastName},</p>
                <p>Maalesef ${bookingId} numaralı rezervasyonunuz için ödeme işlemi başarısız olmuştur.</p>
                
                ${failureReason ? `<p>Hata nedeni: ${failureReason}</p>` : ''}
                
                <p>Lütfen ödeme bilgilerinizi kontrol ederek tekrar deneyin.</p>
                <p>Sorun devam ederse, müşteri hizmetlerimizle iletişime geçebilirsiniz.</p>
                
                <p>İyi günler,<br>AlphaSUP Ekibi</p>
            </body>
            </html>
        `;
    }
    /**
     * Generate refund email content
     */
    generateRefundEmail(customer, bookingId, amount) {
        return `
            <html>
            <body>
                <h2>İade İşlemi - AlphaSUP</h2>
                <p>Sayın ${customer.firstName} ${customer.lastName},</p>
                <p>${bookingId} numaralı rezervasyonunuz için ${amount} TL iade işlemi başlatılmıştır.</p>
                
                <p>İade tutarı 3-7 iş günü içinde hesabınıza geri yatırılacaktır.</p>
                
                <p>İyi günler,<br>AlphaSUP Ekibi</p>
            </body>
            </html>
        `;
    }
    /**
     * Phase 7: Send SMS notification via NotificationManager
     */
    async sendSMSNotification(type, data) {
        console.log('🚧 [Notification Service] SMS bildirimi gönderiliyor - Phase 7 Implementation', {
            type,
            customerId: data.customerId,
            phone: data.customerPhone,
        });
        try {
            let result;
            switch (type) {
                case 'booking_confirmation':
                    result = await this.notificationManager.sendBookingConfirmation({
                        customerId: data.customerId,
                        customerName: data.customerName,
                        customerPhone: data.customerPhone,
                        bookingId: data.bookingId,
                        serviceDate: data.serviceDate || 'TBD',
                        serviceTime: data.serviceTime || 'TBD',
                        location: data.location || 'AlphaSUP Center',
                    });
                    break;
                case 'payment_confirmation':
                    result = await this.notificationManager.sendPaymentConfirmation({
                        customerId: data.customerId,
                        customerName: data.customerName,
                        customerPhone: data.customerPhone,
                        bookingId: data.bookingId,
                        amount: data.amount || '0',
                        currency: data.currency || 'TRY',
                    });
                    break;
                case 'booking_reminder':
                    result = await this.notificationManager.sendBookingReminder({
                        customerId: data.customerId,
                        customerName: data.customerName,
                        customerPhone: data.customerPhone,
                        bookingId: data.bookingId,
                        serviceTime: data.serviceTime || 'TBD',
                        location: data.location || 'AlphaSUP Center',
                        items: data.items || 'Yüzme kıyafeti, güneş kremi',
                        phone: data.contactPhone || '+90 555 123 4567',
                    });
                    break;
                case 'weather_alert':
                    result = await this.notificationManager.sendWeatherAlert({
                        customerId: data.customerId,
                        customerName: data.customerName,
                        customerPhone: data.customerPhone,
                        bookingId: data.bookingId,
                        serviceDate: data.serviceDate || 'TBD',
                        weatherCondition: data.weatherCondition || 'Kötü hava',
                        phone: data.contactPhone || '+90 555 123 4567',
                    });
                    break;
                case 'booking_cancellation':
                    result = await this.notificationManager.sendCancellationNotification({
                        customerId: data.customerId,
                        customerName: data.customerName,
                        customerPhone: data.customerPhone,
                        bookingId: data.bookingId,
                        refundDays: data.refundDays || '3-7',
                        phone: data.contactPhone || '+90 555 123 4567',
                    });
                    break;
                default:
                    throw new Error(`Desteklenmeyen SMS bildirim türü: ${type}`);
            }
            // SMS gönderim logunu kaydet
            await this.saveNotificationLog({
                type: NotificationType.SMS,
                recipient: data.customerPhone,
                content: `SMS ${type} sent`,
                status: result.success ? 'sent' : 'failed',
            });
            console.log('SMS bildirim sonucu:', result);
        }
        catch (error) {
            console.error('SMS bildirim hatası:', error);
            // Hata logunu kaydet
            await this.saveNotificationLog({
                type: NotificationType.SMS,
                recipient: data.customerPhone,
                content: `SMS ${type} failed`,
                status: 'error',
            });
            throw error;
        }
    }
    /**
     * Phase 7: Get customer SMS preferences
     */
    async getCustomerSMSPreferences(customerId) {
        console.log('🚧 [Notification Service] SMS tercihleri getiriliyor - Phase 7 Implementation', { customerId });
        try {
            // TODO: Firestore'dan tercihleri çek
            const preferencesDoc = await this.db
                .collection('customer_notification_preferences')
                .doc(customerId)
                .get();
            if (preferencesDoc.exists) {
                const data = preferencesDoc.data();
                return {
                    smsEnabled: data?.smsEnabled !== false,
                    bookingConfirmations: data?.bookingConfirmations !== false,
                    reminders: data?.reminders !== false,
                    weatherAlerts: data?.weatherAlerts !== false,
                    language: data?.language || 'tr',
                };
            }
            // Varsayılan tercihler
            return {
                smsEnabled: true,
                bookingConfirmations: true,
                reminders: true,
                weatherAlerts: true,
                language: 'tr',
            };
        }
        catch (error) {
            console.error('SMS tercihleri getirme hatası:', error);
            // Hata durumunda varsayılan değerleri döndür
            return {
                smsEnabled: true,
                bookingConfirmations: true,
                reminders: true,
                weatherAlerts: true,
                language: 'tr',
            };
        }
    }
    /**
     * Phase 7: Update customer SMS preferences
     */
    async updateCustomerSMSPreferences(customerId, preferences) {
        console.log('🚧 [Notification Service] SMS tercihleri güncelleniyor - Phase 7 Implementation', {
            customerId,
            preferences,
        });
        try {
            const updateData = {
                ...preferences,
                updatedAt: new Date().toISOString(),
                customerId,
            };
            await this.db
                .collection('customer_notification_preferences')
                .doc(customerId)
                .set(updateData, { merge: true });
            console.log('SMS tercihleri başarıyla güncellendi');
        }
        catch (error) {
            console.error('SMS tercihleri güncelleme hatası:', error);
            throw error;
        }
    }
    /**
     * Format payment method for display
     */
    formatPaymentMethod(paymentMethod) {
        switch (paymentMethod.type) {
            case 'card':
            default:
                return `${paymentMethod.card?.brand?.toUpperCase() || 'CARD'} **** ${paymentMethod.card?.last4 || '••••'}`;
        }
    }
    /**
     * Save notification log to database
     */
    async saveNotificationLog(log) {
        try {
            const notificationLog = {
                id: (0, uuid_1.v4)(),
                ...log,
                timestamp: new Date().toISOString(),
            };
            await this.db
                .collection('notification_logs')
                .doc(notificationLog.id)
                .set(notificationLog);
        }
        catch (error) {
            console.error('Failed to save notification log:', error);
            // Don't throw error - logging failure shouldn't break notification
        }
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
//# sourceMappingURL=notification.js.map