/**
 * Customer Equipment Controller
 * Handles customer-facing equipment operations
 *
 * Task 5: Equipment Management Implementation
 */
import { AuthenticatedRequest } from 'alphasup-shared';
import { NextFunction, Request, Response } from 'express';
/**
 * Get available equipment for customers
 * GET /api/v1/equipment/available
 */
export declare const getAvailableEquipment: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get equipment types and categories
 * GET /api/v1/equipment/types
 */
export declare const getEquipmentTypes: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get detailed specifications for specific equipment
 * GET /api/v1/equipment/:id/specs
 */
export declare const getEquipmentSpecs: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get equipment recommendations based on customer preferences
 * GET /api/v1/equipment/recommendations
 */
export declare const getEquipmentRecommendations: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=equipmentController.d.ts.map