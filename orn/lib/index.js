"use strict";
/**
 * AlphaSUP Booking System - Firebase Cloud Functions
 * Main entry point for all backend API endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const https_1 = require("firebase-functions/v1/https");
const helmet_1 = __importDefault(require("helmet"));
// Initialize Firebase Admin SDK once
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp();
}
// Import routes after admin initialization
const webhook_1 = __importDefault(require("./handlers/webhook"));
const adminServices_1 = __importDefault(require("./routes/adminServices"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const payment_1 = __importDefault(require("./routes/payment"));
const services_1 = __importDefault(require("./routes/services"));
const additionalServices_1 = __importDefault(require("./routes/additionalServices"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const availability_1 = __importDefault(require("./routes/availability"));
// const smsRoutes = require('./routes/sms').default;
// Create Express app
const app = (0, express_1.default)();
// Stripe webhook MUST be registered BEFORE the JSON body parser to preserve raw body
const webhookHandler = new webhook_1.default();
app.post('/api/payments/webhook/stripe', express_1.default.raw({ type: 'application/json' }), (req, res) => webhookHandler.handleStripeWebhook(req, res));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Compression middleware
app.use((0, compression_1.default)());
// Security middleware - Updated for better CORS compatibility
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP that might interfere with CORS
    crossOriginEmbedderPolicy: false,
}));
// CORS configuration - Enhanced for Firebase Cloud Functions
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, postman, etc.)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'http://localhost:5173', // Customer dev
            'http://localhost:5174', // Admin dev
            'https://alphasupack.web.app', // Customer prod
            'https://alphasupack.firebaseapp.com', // Customer prod alt
            'https://alphasupack-admin.web.app', // Admin prod
            'https://alphasupack-admin.firebaseapp.com', // Admin prod alt
        ];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all for now to debug
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Origin',
        'Accept',
    ],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    optionsSuccessStatus: 200, // Support legacy browsers
}));
// Add explicit OPTIONS handler for preflight requests
app.options('*', (0, cors_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// API Routes
app.use('/api/v1/customers', customerRoutes_1.default);
app.use('/api/services', services_1.default);
app.use('/api/additional-services', additionalServices_1.default);
app.use('/api/payments', payment_1.default);
app.use('/api/v1/admin/services', adminServices_1.default);
app.use('/api/v1/bookings', bookings_1.default);
app.use('/api/availability', availability_1.default);
// app.use('/api/sms', smsRoutes);
// Root endpoint for Cloud Run health checks (GET and HEAD)
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'alphasup-api',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
    });
});
app.head('/', (_req, res) => {
    res.status(200).end();
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            api: 'operational',
            database: 'operational',
            authentication: 'operational',
        },
        uptime: process.uptime(),
    });
});
// API version info
app.get('/api/v1', (_req, res) => {
    res.status(200).json({
        name: 'AlphaSUP Booking System API',
        version: '3.0.0',
        description: 'Dual-Frontend Single-Backend API for SUP booking system',
        endpoints: {
            customer: {
                profile: '/api/v1/customers',
                bookings: '/api/v1/bookings',
                services: '/api/v1/services',
                payments: '/api/v1/payments',
            },
            admin: {
                auth: '/api/v1/admin/auth',
                dashboard: '/api/v1/admin/dashboard',
                bookings: '/api/v1/admin/bookings',
                services: '/api/v1/admin/services',
                customers: '/api/v1/admin/customers',
                analytics: '/api/v1/admin/analytics',
            },
        },
        documentation: 'https://github.com/ahmetcemkaraca/AlphaSUP-Web/docs',
    });
});
// Error handling middleware
app.use((error, _req, res, _next) => {
    console.error('API Error:', error);
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(error.status || 500).json({
        error: {
            message: isDevelopment ? error.message : 'Internal server error',
            status: error.status || 500,
            timestamp: new Date().toISOString(),
            ...(isDevelopment && { stack: error.stack }),
        },
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            message: 'Endpoint not found',
            status: 404,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
        },
    });
});
// Export the Express app as a Firebase Cloud Function (v2 https)
// 💰 Cost-optimized for free tier usage - keeping stable config
exports.api = (0, https_1.onRequest)(app);
// 🚧 Phase 7 - Scheduled functions temporarily disabled due to deployment health check issues
// export {
//     aggregateSMSAnalytics,
//     retrySMSMessages, sendArrivalInstructions, sendBookingReminders,
//     sendWeatherAlerts
// } from './scheduled/smsScheduler';
//# sourceMappingURL=index.js.map