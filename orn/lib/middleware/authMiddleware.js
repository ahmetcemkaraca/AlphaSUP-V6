"use strict";
/**
 * Authentication Middleware
 *
 * This middleware protects routes by verifying Firebase Authentication tokens
 * and checking user roles.
 *
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const firebase_1 = require("../config/firebase");
// Middleware to verify Firebase ID token
const protect = async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        res.status(401).send('Unauthorized: No token provided');
        return;
    }
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
        const userRecord = await firebase_1.auth.getUser(decodedToken.uid);
        const role = userRecord.customClaims?.['role'] || 'user';
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || undefined,
            role: role,
            isAdmin: role === 'admin' || role === 'editor',
        };
        next();
    }
    catch (error) {
        console.error('Error verifying auth token:', error);
        res.status(403).send('Unauthorized: Invalid token');
        return;
    }
};
exports.protect = protect;
// Middleware to check for admin role
const adminOnly = (req, res, next) => {
    const user = req.user;
    if (user?.role !== 'admin' && user?.role !== 'editor') {
        res.status(403).send('Forbidden: Requires admin or editor role');
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=authMiddleware.js.map