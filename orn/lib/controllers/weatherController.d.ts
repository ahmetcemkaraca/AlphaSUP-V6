import { AuthenticatedRequest } from 'alphasup-shared';
import { Request, Response } from 'express';
/**
 * Get current weather for default or specified location
 * GET /api/v1/weather/current
 * Query params: location (optional), coordinates (optional)
 */
export declare const getCurrentWeather: (req: Request, res: Response) => Promise<void>;
/**
 * Get weather forecast for the next 7 days
 * GET /api/v1/weather/forecast
 * Query params: location, days (optional, default 7)
 */
export declare const getWeatherForecast: (req: Request, res: Response) => Promise<void>;
/**
 * Get active weather alerts for SUP activities
 * GET /api/v1/weather/alerts
 * Query params: location (optional), severity (optional)
 */
export declare const getWeatherAlerts: (req: Request, res: Response) => Promise<void>;
/**
 * Get SUP activity recommendations based on weather
 * GET /api/v1/weather/recommendations
 * Query params: location, date (optional), experience_level (optional)
 */
export declare const getWeatherRecommendations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=weatherController.d.ts.map