import { EmailProvider, EmailSendResponse, EmailTemplate } from '../../../shared/src/types/notification';
/**
 * Email Notifications Fallback System
 * Firebase Extensions (SendGrid, Mailchimp) integration
 */
export interface EmailConfig {
    provider: EmailProvider;
    apiKey?: string;
    fromEmail: string;
    fromName: string;
    templates: Record<string, EmailTemplate>;
}
export interface EmailFallbackOptions {
    enableFallback: boolean;
    fallbackDelay: number;
    maxRetries: number;
    providers: EmailProvider[];
}
export declare class EmailFallbackService {
    private config;
    private fallbackOptions;
    constructor(config: EmailConfig, fallbackOptions: EmailFallbackOptions);
    /**
     * Send email with fallback to other providers
     */
    sendEmail(to: string, templateType: string, variables: Record<string, any>, options?: {
        priority?: 'high' | 'normal' | 'low';
        scheduledAt?: Date;
    }): Promise<EmailSendResponse>;
    /**
     * Primary provider email sending
     */
    private sendViaPrimaryProvider;
    /**
     * SendGrid integration via Firebase Extension
     */
    private sendViaSendGrid;
    /**
     * Mailchimp Transactional (Mandrill) integration
     */
    /**
     * Firebase Email Extension (generic)
     */
    private sendViaSMTP;
    /**
     * Fallback system activation
     */
    private activateFallbackSystem;
    /**
     * Add email to Firestore queue for Firebase Extension processing
     */
    private addToEmailQueue;
    /**
     * Render email template with variables
     */
    private renderTemplate;
    /**
     * Render text version of email template
     */
    private renderTextTemplate;
    /**
     * Convert HTML to plain text
     */
    private htmlToText;
    /**
     * Delay utility
     */
    private delay;
}
export declare const EMAIL_TEMPLATES: Record<string, EmailTemplate>;
export declare const FIREBASE_EMAIL_CONFIG: {
    sendgrid: {
        extension_id: string;
        collection: string;
        config: {
            SENDGRID_API_KEY: string;
            DEFAULT_FROM: string;
            DEFAULT_REPLY_TO: string;
        };
    };
    mailchimp: {
        extension_id: string;
        collection: string;
        config: {
            MAILCHIMP_API_KEY: string;
            DEFAULT_FROM_EMAIL: string;
            DEFAULT_FROM_NAME: string;
        };
    };
    firebase_email: {
        extension_id: string;
        collection: string;
        config: {
            SMTP_CONNECTION_URI: string;
            DEFAULT_FROM: string;
            DEFAULT_REPLY_TO: string;
        };
    };
};
//# sourceMappingURL=emailFallbackService.d.ts.map