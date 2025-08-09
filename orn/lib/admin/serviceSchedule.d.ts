/**
 * Service Schedule Management Functions
 *
 * This module provides endpoints for managing service schedules from the admin panel.
 * Integrates with TimeSlotGenerationEngine for automated slot creation.
 *
 * Features:
 * - Create and update service schedules
 * - Generate time slots based on schedule configuration
 * - Handle recurring patterns and exceptions
 * - Real-time sync with customer site availability
 */
import * as functions from 'firebase-functions';
/**
 * Create or update a service schedule
 * POST /admin/schedules/save
 */
export declare const saveServiceSchedule: functions.HttpsFunction;
/**
 * Get a service schedule by ID
 * GET /admin/schedules/{serviceId}
 */
export declare const getServiceSchedule: functions.HttpsFunction;
/**
 * Get all service schedules
 * GET /admin/schedules
 */
export declare const getServiceSchedules: functions.HttpsFunction;
/**
 * Delete a service schedule
 * DELETE /admin/schedules/{serviceId}
 */
export declare const deleteServiceSchedule: functions.HttpsFunction;
/**
 * Generate time slots for a service schedule
 * POST /admin/schedules/generate-slots
 */
export declare const generateTimeSlots: functions.HttpsFunction;
/**
 * Get schedule statistics
 * GET /admin/schedules/stats
 */
export declare const getScheduleStats: functions.HttpsFunction;
//# sourceMappingURL=serviceSchedule.d.ts.map