"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const tslib_1 = require("tslib");
const firebase_admin_1 = tslib_1.__importDefault(require("firebase-admin"));
const auditLogService_1 = require("../services/auditLogService");
const db = firebase_admin_1.default.firestore();
const auditService = new auditLogService_1.AuditLogService(db);
// Enhanced audit log middleware with relationship tracking
const auditLog = async (req, res, next) => {
    try {
        const user = req.user;
        const startTime = Date.now();
        // Store original res.json to capture response
        const originalJson = res.json;
        let responseData;
        let statusCode = 200;
        res.json = function (body) {
            responseData = body;
            statusCode = res.statusCode;
            return originalJson.call(this, body);
        };
        // Continue with request
        next();
        // Log after response
        res.on('finish', async () => {
            try {
                const duration = Date.now() - startTime;
                // Determine action based on method and route
                const action = determineAuditAction(req.method, req.originalUrl);
                const resource = determineAuditResource(req.originalUrl);
                // Extract relationships from request/response
                const relationships = extractRelationships(req, responseData);
                // Create enhanced audit log
                const resourceId = extractResourceId(req, responseData);
                const userAgent = req.get('User-Agent');
                const clientIP = getClientIP(req);
                const sessionId = req.get('X-Session-ID');
                const auditData = {
                    action,
                    resource,
                    details: {
                        before: req.method === 'PUT' ? req.body?.before : undefined,
                        after: req.method === 'PUT' ? req.body : responseData,
                        metadata: {
                            route: req.originalUrl,
                            params: req.params,
                            query: req.query
                        }
                    },
                    request: {
                        method: req.method,
                        url: req.originalUrl,
                        headers: sanitizeHeaders(req.headers),
                        body: sanitizeRequestBody(req.body)
                    },
                    response: {
                        status: statusCode,
                        duration,
                        error: statusCode >= 400 ? responseData : undefined
                    },
                    relationships,
                    tags: generateTags(req, user, statusCode)
                };
                // Add optional fields only if they exist
                if (user?.uid)
                    auditData.userId = user.uid;
                if (user?.role)
                    auditData.userRole = user.role;
                if (user?.email)
                    auditData.userEmail = user.email;
                if (resourceId)
                    auditData.resourceId = resourceId;
                if (userAgent)
                    auditData.userAgent = userAgent;
                if (clientIP)
                    auditData.ip = clientIP;
                if (sessionId)
                    auditData.sessionId = sessionId;
                await auditService.createAuditLog(auditData);
            }
            catch (auditError) {
                console.error('Enhanced audit log error:', auditError);
            }
        });
    }
    catch (err) {
        console.error('Audit middleware error:', err);
        next();
    }
};
exports.auditLog = auditLog;
// Determine audit action from HTTP method and route
function determineAuditAction(method, route) {
    if (route.includes('/admin/services')) {
        if (method === 'POST')
            return auditLogService_1.AuditAction.ADMIN_SERVICE_CREATED;
        if (method === 'PUT')
            return auditLogService_1.AuditAction.ADMIN_SERVICE_UPDATED;
        if (method === 'DELETE')
            return auditLogService_1.AuditAction.ADMIN_SERVICE_DELETED;
    }
    if (route.includes('/customers/profile')) {
        if (method === 'POST')
            return auditLogService_1.AuditAction.CUSTOMER_PROFILE_CREATED;
        if (method === 'PUT')
            return auditLogService_1.AuditAction.CUSTOMER_PROFILE_UPDATED;
        if (method === 'DELETE')
            return auditLogService_1.AuditAction.CUSTOMER_PROFILE_DELETED;
    }
    if (route.includes('/bookings')) {
        if (method === 'POST')
            return auditLogService_1.AuditAction.BOOKING_CREATED;
        if (method === 'PUT')
            return auditLogService_1.AuditAction.BOOKING_UPDATED;
        if (method === 'DELETE')
            return auditLogService_1.AuditAction.BOOKING_CANCELLED;
    }
    if (route.includes('/payments')) {
        if (method === 'POST')
            return auditLogService_1.AuditAction.PAYMENT_INITIATED;
    }
    // Default actions
    return auditLogService_1.AuditAction.SYSTEM_ERROR;
}
// Determine audit resource from route
function determineAuditResource(route) {
    if (route.includes('/services'))
        return auditLogService_1.AuditResource.SERVICE;
    if (route.includes('/customers'))
        return auditLogService_1.AuditResource.CUSTOMER;
    if (route.includes('/bookings'))
        return auditLogService_1.AuditResource.BOOKING;
    if (route.includes('/payments'))
        return auditLogService_1.AuditResource.PAYMENT;
    if (route.includes('/admin'))
        return auditLogService_1.AuditResource.ADMIN;
    return auditLogService_1.AuditResource.SYSTEM;
}
// Extract resource ID from request or response
function extractResourceId(req, responseData) {
    // Try route params first
    if (req.params['id'])
        return req.params['id'];
    if (req.params['serviceId'])
        return req.params['serviceId'];
    if (req.params['customerId'])
        return req.params['customerId'];
    if (req.params['bookingId'])
        return req.params['bookingId'];
    // Try response data
    if (responseData?.id)
        return responseData.id;
    if (responseData?.data?.id)
        return responseData.data.id;
    return undefined;
}
// Extract relationships for cross-collection tracking
function extractRelationships(req, responseData) {
    const relationships = {};
    // Extract from request body
    if (req.body?.customerId)
        relationships.customerId = req.body.customerId;
    if (req.body?.serviceId)
        relationships.serviceId = req.body.serviceId;
    if (req.body?.bookingId)
        relationships.bookingId = req.body.bookingId;
    if (req.body?.paymentId)
        relationships.paymentId = req.body.paymentId;
    // Extract from response
    if (responseData?.customerId)
        relationships.customerId = responseData.customerId;
    if (responseData?.data?.customerId)
        relationships.customerId = responseData.data.customerId;
    // Extract from route
    const user = req.user;
    if (user?.uid && req.originalUrl.includes('/customers/')) {
        relationships.customerId = user.uid;
    }
    return Object.keys(relationships).length > 0 ? relationships : undefined;
}
// Generate tags for better categorization
function generateTags(req, user, statusCode) {
    const tags = [];
    if (req.method === 'POST')
        tags.push('create');
    if (req.method === 'PUT')
        tags.push('update');
    if (req.method === 'DELETE')
        tags.push('delete');
    if (req.method === 'GET')
        tags.push('read');
    if (statusCode >= 400)
        tags.push('error');
    if (statusCode >= 500)
        tags.push('server_error');
    if (req.originalUrl.includes('/admin/'))
        tags.push('admin_operation');
    if (req.originalUrl.includes('/customers/'))
        tags.push('customer_operation');
    if (user?.role)
        tags.push(`role_${user.role}`);
    return tags;
}
// Sanitize headers for security
function sanitizeHeaders(headers) {
    const sanitized = {};
    const allowedHeaders = ['content-type', 'user-agent', 'referer', 'accept-language'];
    allowedHeaders.forEach(header => {
        if (headers[header]) {
            sanitized[header] = headers[header];
        }
    });
    return sanitized;
}
// Sanitize request body for security
function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sanitized = { ...body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    delete sanitized.apiKey;
    return sanitized;
}
// Get client IP address
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        'unknown';
}
//# sourceMappingURL=auditLog.js.map