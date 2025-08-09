"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weatherController_1 = require("../controllers/weatherController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const asyncHandler_1 = require("../utils/asyncHandler");
/**
 * Weather Routes - Task 6 Implementation
 * Provides weather information and SUP activity recommendations
 */
const router = (0, express_1.Router)();
/**
 * GET /api/v1/weather/current
 * Get current weather for SUP activities
 * Public endpoint - no authentication required
 * Query params: location, lat, lng
 */
router.get('/current', weatherController_1.getCurrentWeather);
/**
 * GET /api/v1/weather/forecast
 * Get weather forecast for planning SUP activities
 * Public endpoint - no authentication required
 * Query params: location, days, lat, lng
 */
router.get('/forecast', weatherController_1.getWeatherForecast);
/**
 * GET /api/v1/weather/alerts
 * Get active weather alerts for SUP safety
 * Public endpoint - no authentication required
 * Query params: location, severity
 */
router.get('/alerts', weatherController_1.getWeatherAlerts);
/**
 * GET /api/v1/weather/recommendations
 * Get SUP activity recommendations based on weather
 * Authenticated endpoint - requires user login for personalized recommendations
 * Query params: location, date, experience_level
 */
router.get('/recommendations', authMiddleware_1.protect, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await (0, weatherController_1.getWeatherRecommendations)(req, res);
}));
exports.default = router;
//# sourceMappingURL=weatherRoutes.js.map