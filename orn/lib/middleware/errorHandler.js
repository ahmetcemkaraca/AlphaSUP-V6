"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginatedResponse = exports.createApiResponse = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ServiceUnavailableError = exports.RateLimitError = exports.ConflictError = exports.AuthorizationError = exports.AuthError = exports.ValidationError = exports.NotFoundError = exports.ApiError = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
const auditLogService_1 = require("../services/auditLogService");
/**
 * Base error class for API errors
 */
class ApiError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        // Maintain proper stack trace (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}
exports.ApiError = ApiError;
/**
 * Not found error (404)
 */
class NotFoundError extends ApiError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Validation error (400)
 */
class ValidationError extends ApiError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication error (401)
 */
class AuthError extends ApiError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTH_ERROR');
    }
}
exports.AuthError = AuthError;
/**
 * Authorization error (403)
 */
class AuthorizationError extends ApiError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Conflict error (409)
 */
class ConflictError extends ApiError {
    constructor(message) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
/**
 * Rate limit error (429)
 */
class RateLimitError extends ApiError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Service unavailable error (503)
 */
class ServiceUnavailableError extends ApiError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE');
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Central error handling middleware
 * Bu middleware tüm route'ların sonunda kullanılmalı
 */
const errorHandler = async (error, req, res, next) => {
    // Request ID for tracking
    const requestId = req.headers['x-request-id'] ||
        req.headers['request-id'] ||
        generateRequestId();
    // Default error response
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details = undefined;
    // Handle known API errors
    if (error instanceof ApiError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        if (error instanceof ValidationError) {
            details = error.details;
        }
    }
    else if (error.name === 'ValidationError') {
        // Handle mongoose/joi validation errors
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = error.message;
    }
    else if (error.name === 'CastError') {
        // Handle database cast errors
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid ID format';
    }
    else if (error.name === 'MongoError' || error.name === 'MongooseError') {
        // Handle database errors
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Database operation failed';
    }
    else if (error.message.includes('PERMISSION_DENIED')) {
        // Handle Firestore permission errors
        statusCode = 403;
        code = 'PERMISSION_DENIED';
        message = 'Permission denied';
    }
    else if (error.message.includes('NOT_FOUND')) {
        // Handle Firestore not found errors
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Resource not found';
    }
    // Prepare error response
    const errorResponse = {
        success: false,
        error: {
            code,
            message,
            statusCode,
            timestamp: new Date().toISOString(),
            requestId,
            ...(details && { details })
        }
    };
    // Log error details
    const logData = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.uid || 'anonymous',
        statusCode,
        code,
        message: error.message,
        stack: error.stack
    };
    // Log based on severity
    if (statusCode >= 500) {
        firebase_functions_1.logger.error('Server Error:', logData);
    }
    else if (statusCode >= 400) {
        firebase_functions_1.logger.warn('Client Error:', logData);
    }
    else {
        firebase_functions_1.logger.info('Handled Error:', logData);
    }
    // Audit log for security-related errors
    if (statusCode === 401 || statusCode === 403) {
        try {
            const db = admin.firestore();
            const auditService = new auditLogService_1.AuditLogService(db);
            await auditService.createAuditLog({
                userId: req.user?.uid || null,
                userRole: req.user?.role || null,
                userEmail: req.user?.email || null,
                action: auditLogService_1.AuditAction.SYSTEM_ERROR,
                resource: auditLogService_1.AuditResource.SYSTEM,
                details: {
                    error: code,
                    message,
                    method: req.method,
                    url: req.url,
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.headers['user-agent']
                },
                request: {
                    method: req.method,
                    url: req.url,
                    headers: sanitizeHeaders(req.headers),
                    body: null
                },
                response: {
                    status: statusCode,
                    duration: 0,
                    error: errorResponse.error
                },
                ip: req.ip || req.connection.remoteAddress || 'unknown',
                userAgent: req.headers['user-agent'],
                sessionId: req.headers['x-session-id']
            });
        }
        catch (auditError) {
            firebase_functions_1.logger.error('Audit logging failed:', auditError);
        }
    }
    // Send error response
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
/**
 * Sanitize headers for security
 */
function sanitizeHeaders(headers) {
    const sanitized = {};
    const allowedHeaders = ['content-type', 'user-agent', 'referer', 'accept-language'];
    allowedHeaders.forEach(header => {
        if (headers[header] && typeof headers[header] === 'string') {
            sanitized[header] = headers[header];
        }
    });
    return sanitized;
}
/**
 * 404 handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
    const errorResponse = {
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.url} not found`,
            statusCode: 404,
            timestamp: new Date().toISOString()
        }
    };
    firebase_functions_1.logger.warn('Route not found:', {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });
    res.status(404).json(errorResponse);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async error wrapper
 * Route handler'ları wrap etmek için kullanılır
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Generate unique request ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Helper function to create standardized API responses
 */
const createApiResponse = (data, message) => {
    return {
        success: true,
        data,
        ...(message && { message }),
        timestamp: new Date().toISOString()
    };
};
exports.createApiResponse = createApiResponse;
/**
 * Helper function to create paginated API responses
 */
const createPaginatedResponse = (data, page, limit, total, message) => {
    const totalPages = Math.ceil(total / limit);
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        ...(message && { message }),
        timestamp: new Date().toISOString()
    };
};
exports.createPaginatedResponse = createPaginatedResponse;
//# sourceMappingURL=errorHandler.js.map