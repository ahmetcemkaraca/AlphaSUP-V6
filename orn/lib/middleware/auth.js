"use strict";
/**
 * Authentication Middleware
 * Kimlik doğrulama ve yetkilendirme middleware'i
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = exports.UserRole = void 0;
const firebase_admin_1 = require("firebase-admin");
// Define UserRole enum locally
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["CUSTOMER"] = "customer";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
class AuthMiddleware {
    constructor() {
        /**
         * Authenticate user with Firebase token
         */
        this.authenticate = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Authorization header required',
                        },
                    });
                    return;
                }
                const token = authHeader.split('Bearer ')[1];
                // Verify Firebase token
                const decodedToken = await (0, firebase_admin_1.auth)().verifyIdToken(token);
                // Get user role from custom claims or default to USER
                const userRole = decodedToken.role || UserRole.USER;
                // Attach user info to request
                req.user = {
                    uid: decodedToken.uid,
                    role: userRole,
                    isAdmin: userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
                    isEditor: userRole === UserRole.EDITOR ||
                        userRole === UserRole.ADMIN ||
                        userRole === UserRole.SUPER_ADMIN,
                };
                if (decodedToken.email) {
                    req.user.email = decodedToken.email;
                }
                next();
            }
            catch (error) {
                console.error('Authentication error:', error);
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid or expired token',
                    },
                });
            }
        };
        /**
         * Require admin role
         */
        this.requireAdmin = (req, res, next) => {
            if (!req.user?.isAdmin) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Admin access required',
                    },
                });
                return;
            }
            next();
        };
        /**
         * Require editor role or higher
         */
        this.requireEditor = (req, res, next) => {
            if (!req.user?.isEditor) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Editor access required',
                    },
                });
                return;
            }
            next();
        };
        /**
         * Require customer role (for customer-specific endpoints)
         */
        this.requireCustomer = (req, res, next) => {
            if (!req.user ||
                (req.user.role !== UserRole.CUSTOMER && !req.user.isAdmin)) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Customer access required',
                    },
                });
                return;
            }
            next();
        };
        /**
         * Optional authentication (doesn't fail if no token)
         */
        this.optionalAuth = async (req, _res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.split('Bearer ')[1];
                    const decodedToken = await (0, firebase_admin_1.auth)().verifyIdToken(token);
                    const userRole = decodedToken.role || UserRole.USER;
                    req.user = {
                        uid: decodedToken.uid,
                        role: userRole,
                        isAdmin: userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN,
                        isEditor: userRole === UserRole.EDITOR ||
                            userRole === UserRole.ADMIN ||
                            userRole === UserRole.SUPER_ADMIN,
                    };
                    if (decodedToken.email) {
                        req.user.email = decodedToken.email;
                    }
                }
                next();
            }
            catch (error) {
                // If token is invalid, continue without authentication
                next();
            }
        };
    }
}
exports.AuthMiddleware = AuthMiddleware;
exports.default = AuthMiddleware;
//# sourceMappingURL=auth.js.map