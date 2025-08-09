"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIREBASE_EMAIL_CONFIG = exports.EMAIL_TEMPLATES = exports.EmailFallbackService = void 0;
class EmailFallbackService {
    constructor(config, fallbackOptions) {
        this.config = config;
        this.fallbackOptions = fallbackOptions;
    }
    /**
     * Send email with fallback to other providers
     */
    async sendEmail(to, templateType, variables, options) {
        try {
            // Primary email sending
            const result = await this.sendViaPrimaryProvider(to, templateType, variables, options);
            if (result.success) {
                return result;
            }
            // Fallback system activation
            if (this.fallbackOptions.enableFallback) {
                return await this.activateFallbackSystem(to, templateType, variables, options);
            }
            return result;
        }
        catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                provider: this.config.provider,
                error: String(error)
            };
        }
    }
    /**
     * Primary provider email sending
     */
    async sendViaPrimaryProvider(to, templateType, variables, options) {
        switch (this.config.provider) {
            case 'sendgrid':
                return await this.sendViaSendGrid(to, templateType, variables, options);
            case 'mailgun':
                // TODO: Implement mailgun integration
                return { success: false, provider: 'mailgun', error: 'Mailgun integration not implemented' };
            case 'aws-ses':
                // TODO: Implement AWS SES integration
                return { success: false, provider: 'aws-ses', error: 'AWS SES integration not implemented' };
            case 'smtp':
                // TODO: Implement SMTP integration
                return { success: false, provider: 'smtp', error: 'SMTP integration not implemented' };
            case 'local':
                // TODO: Implement local integration
                return { success: false, provider: 'local', error: 'Local integration not implemented' };
            default:
                throw new Error(`Unsupported email provider: ${this.config.provider}`);
        }
    }
    /**
     * SendGrid integration via Firebase Extension
     */
    async sendViaSendGrid(to, templateType, variables, options) {
        // Firebase Extension: SendGrid Email
        // Extension ID: firebase/sendgrid-email
        const template = this.config.templates[templateType];
        const emailData = {
            to: [to],
            from: {
                email: this.config.fromEmail,
                name: this.config.fromName
            },
            templateId: template?.id,
            subject: template?.subject,
            htmlContent: template?.htmlContent,
            textContent: template?.textContent,
            dynamicTemplateData: {
                ...variables,
                company_name: 'AlphaSUP',
                website_url: 'https://alphasupack.web.app'
            }
        };
        // Firebase Firestore collection trigger for SendGrid extension
        // Extension will automatically process emails from 'emails' collection
        const emailRef = await this.addToEmailQueue(emailData, 'sendgrid');
        return {
            success: true,
            provider: 'sendgrid',
            messageId: emailRef.id
        };
    }
    /**
     * Mailchimp Transactional (Mandrill) integration
     */
    // Mailchimp integration removed, not supported by EmailProvider type
    /**
     * Firebase Email Extension (generic)
     */
    async sendViaSMTP(to, templateType, variables, options) {
        // SMTP integration placeholder
        return { success: false, provider: 'smtp', error: 'SMTP integration not implemented' };
    }
    /**
     * Fallback system activation
     */
    async activateFallbackSystem(to, templateType, variables, options) {
        console.warn(`[EmailFallbackService] Activating email fallback system for ${to}`);
        // Try fallback providers in order
        for (const provider of this.fallbackOptions.providers) {
            try {
                await this.delay(this.fallbackOptions.fallbackDelay * 60 * 1000);
                const fallbackConfig = { ...this.config, provider };
                const fallbackService = new EmailFallbackService(fallbackConfig, {
                    ...this.fallbackOptions,
                    enableFallback: false // Prevent infinite fallback
                });
                const result = await fallbackService.sendViaPrimaryProvider(to, templateType, variables, options);
                if (result.success) {
                    return result;
                }
            }
            catch (error) {
                console.warn(`[EmailFallbackService] Fallback provider ${provider} failed:`, error);
                continue;
            }
        }
        return {
            success: false,
            provider: this.config.provider,
            error: 'All email providers failed'
        };
    }
    /**
     * Add email to Firestore queue for Firebase Extension processing
     */
    async addToEmailQueue(emailData, provider) {
        const admin = require('firebase-admin');
        const db = admin.firestore();
        return await db.collection('emails').add({
            ...emailData,
            provider,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            retries: 0
        });
    }
    /**
     * Render email template with variables
     */
    renderTemplate(templateType, variables) {
        const template = this.config.templates[templateType];
        if (!template) {
            return `<h1>AlphaSUP Notification</h1><p>Template not found: ${templateType}</p>`;
        }
        let html = template.htmlContent || '';
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, String(value));
        });
        return html;
    }
    /**
     * Render text version of email template
     */
    renderTextTemplate(templateType, variables) {
        const template = this.config.templates[templateType];
        if (!template) {
            return `AlphaSUP Notification - Template not found: ${templateType}`;
        }
        let text = template.textContent || this.htmlToText(template.htmlContent || '') || '';
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            text = text.replace(regex, String(value));
        });
        return text;
    }
    /**
     * Convert HTML to plain text
     */
    htmlToText(html) {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }
    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.EmailFallbackService = EmailFallbackService;
// Email template definitions
exports.EMAIL_TEMPLATES = {
    booking_confirmation: {
        id: 'booking_confirmation',
        name: 'Rezervasyon Onayı',
        subject: 'AlphaSUP Rezervasyon Onayı - {{booking_id}}',
        htmlContent: `
            <h2>Rezervasyon Onaylandı! 🎉</h2>
            <p>Merhaba {{customer_name}},</p>
            <p>{{service_name}} rezervasyonunuz onaylandı.</p>
            <p><strong>Tarih:</strong> {{booking_date}}</p>
            <p><strong>Saat:</strong> {{booking_time}}</p>
            <p><strong>Lokasyon:</strong> {{location}}</p>
            <p><strong>Toplam Ücret:</strong> {{total_amount}} ₺</p>
            <p>Rezervasyon No: {{booking_id}}</p>
            <p>Görüşmek üzere!<br>AlphaSUP Ekibi</p>
        `,
        textContent: `
            Rezervasyon Onaylandı!
            
            Merhaba {{customer_name}},
            {{service_name}} rezervasyonunuz onaylandı.
            
            Tarih: {{booking_date}}
            Saat: {{booking_time}}
            Lokasyon: {{location}}
            Toplam Ücret: {{total_amount}} ₺
            Rezervasyon No: {{booking_id}}
            
            Görüşmek üzere!
            AlphaSUP Ekibi
        `,
        variables: [
            'customer_name', 'service_name', 'booking_date', 'booking_time', 'location', 'total_amount', 'booking_id'
        ],
        provider: 'sendgrid',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    booking_reminder: {
        id: 'booking_reminder',
        name: 'Rezervasyon Hatırlatması',
        subject: 'AlphaSUP Rezervasyon Hatırlatması - Yarın {{booking_time}}',
        htmlContent: `
            <h2>Rezervasyon Hatırlatması 🏄‍♂️</h2>
            <p>Merhaba {{customer_name}},</p>
            <p>Yarın {{service_name}} rezervasyonunuz var.</p>
            <p><strong>Tarih:</strong> {{booking_date}}</p>
            <p><strong>Saat:</strong> {{booking_time}}</p>
            <p><strong>Lokasyon:</strong> {{location}}</p>
            <p><strong>Hava Durumu:</strong> {{weather_condition}}</p>
            <p>Yanınızda getirmeniz gerekenler: {{equipment_list}}</p>
            <p>Rezervasyon No: {{booking_id}}</p>
            <p>İyi eğlenceler!<br>AlphaSUP Ekibi</p>
        `,
        textContent: `
            Rezervasyon Hatırlatması
            
            Merhaba {{customer_name}},
            Yarın {{service_name}} rezervasyonunuz var.
            
            Tarih: {{booking_date}}
            Saat: {{booking_time}}
            Lokasyon: {{location}}
            Hava Durumu: {{weather_condition}}
            Yanınızda getirmeniz gerekenler: {{equipment_list}}
            
            Rezervasyon No: {{booking_id}}
            
            İyi eğlenceler!
            AlphaSUP Ekibi
        `,
        variables: [
            'customer_name', 'service_name', 'booking_date', 'booking_time', 'location', 'weather_condition', 'equipment_list', 'booking_id'
        ],
        provider: 'sendgrid',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    cancellation_notification: {
        id: 'cancellation_notification',
        name: 'Rezervasyon İptali',
        subject: 'AlphaSUP Rezervasyon İptali - {{booking_id}}',
        htmlContent: `
            <h2>Rezervasyon İptal Edildi</h2>
            <p>Merhaba {{customer_name}},</p>
            <p>{{service_name}} rezervasyonunuz iptal edildi.</p>
            <p><strong>İptal Edilen Rezervasyon:</strong></p>
            <p>Tarih: {{booking_date}}</p>
            <p>Saat:</strong> {{booking_time}}</p>
            <p>Rezervasyon No: {{booking_id}}</p>
            {{#if refund_amount}}
            <p><strong>İade Tutarı:</strong> {{refund_amount}} ₺</p>
            <p>İade işlemi 3-5 iş günü içinde hesabınıza yansıyacaktır.</p>
            {{/if}}
            <p>Başka bir tarihe rezervasyon yapmak için sitemizi ziyaret edebilirsiniz.</p>
            <p>AlphaSUP Ekibi</p>
        `,
        textContent: `
            Rezervasyon İptal Edildi
            
            Merhaba {{customer_name}},
            {{service_name}} rezervasyonunuz iptal edildi.
            
            İptal Edilen Rezervasyon:
            Tarih: {{booking_date}}
            Saat: {{booking_time}}
            Rezervasyon No: {{booking_id}}
            
            {{#if refund_amount}}
            İade Tutarı: {{refund_amount}} ₺
            İade işlemi 3-5 iş günü içinde hesabınıza yansıyacaktır.
            {{/if}}
            
            Başka bir tarihe rezervasyon yapmak için sitemizi ziyaret edebilirsiniz.
            
            AlphaSUP Ekibi
        `,
        variables: [
            'customer_name', 'service_name', 'booking_date', 'booking_time', 'booking_id', 'refund_amount'
        ],
        provider: 'sendgrid',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
};
// Export configuration for Firebase Extensions
exports.FIREBASE_EMAIL_CONFIG = {
    // SendGrid Extension Configuration
    sendgrid: {
        extension_id: 'firebase/sendgrid-email',
        collection: 'emails',
        config: {
            SENDGRID_API_KEY: '{SENDGRID_API_KEY}', // Set via Firebase Console
            DEFAULT_FROM: 'noreply@alphasupack.com',
            DEFAULT_REPLY_TO: 'info@alphasupack.com'
        }
    },
    // Mailchimp Extension Configuration
    mailchimp: {
        extension_id: 'mailchimp/mailchimp-firebase-sync',
        collection: 'emails',
        config: {
            MAILCHIMP_API_KEY: '{MAILCHIMP_API_KEY}', // Set via Firebase Console
            DEFAULT_FROM_EMAIL: 'noreply@alphasupack.com',
            DEFAULT_FROM_NAME: 'AlphaSUP'
        }
    },
    // Generic Firebase Email Extension
    firebase_email: {
        extension_id: 'firebase/firestore-send-email',
        collection: 'mail',
        config: {
            SMTP_CONNECTION_URI: '{SMTP_CONNECTION_URI}', // Set via Firebase Console
            DEFAULT_FROM: 'noreply@alphasupack.com',
            DEFAULT_REPLY_TO: 'info@alphasupack.com'
        }
    }
};
//# sourceMappingURL=emailFallbackService.js.map