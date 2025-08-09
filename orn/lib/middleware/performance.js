"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = performanceMiddleware;
/**
 * Performance middleware logs response times for API performance monitoring
 */
function performanceMiddleware(req, res, next) {
    const start = process.hrtime();
    res.on('finish', () => {
        const delta = process.hrtime(start);
        const ms = delta[0] * 1000 + delta[1] / 1e6;
        console.log(`${req.method} ${req.originalUrl} - ${ms.toFixed(2)} ms`);
    });
    next();
}
//# sourceMappingURL=performance.js.map