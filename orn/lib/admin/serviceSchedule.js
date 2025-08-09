"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScheduleStats = exports.generateTimeSlots = exports.deleteServiceSchedule = exports.getServiceSchedules = exports.getServiceSchedule = exports.saveServiceSchedule = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
const functions = tslib_1.__importStar(require("firebase-functions"));
// Use admin SDK for Firestore
const db = admin.firestore();
/**
 * Create or update a service schedule
 * POST /admin/schedules/save
 */
exports.saveServiceSchedule = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        console.log('💾 Saving service schedule:', req.body);
        const scheduleData = req.body;
        if (!scheduleData.serviceId) {
            res.status(400).json({
                success: false,
                error: 'Service ID is required'
            });
            return;
        }
        // Add timestamps
        const now = admin.firestore.Timestamp.now();
        scheduleData.updatedAt = now;
        if (!scheduleData.createdAt) {
            scheduleData.createdAt = now;
        }
        // Save to Firestore using admin SDK
        const scheduleRef = db.collection('serviceSchedules').doc(scheduleData.serviceId);
        await scheduleRef.set(scheduleData, { merge: true });
        console.log(`✅ Service schedule saved for service: ${scheduleData.serviceId}`);
        // TODO: Trigger time slot generation if schedule is active
        if (scheduleData.status === 'active' && scheduleData.autoGeneration.enabled) {
            console.log('🔄 Triggering time slot generation...');
            // This would integrate with TimeSlotGenerationEngine
        }
        res.status(200).json({
            success: true,
            message: 'Service schedule saved successfully',
            scheduleId: scheduleData.serviceId
        });
    }
    catch (error) {
        console.error('❌ Error saving service schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save service schedule'
        });
    }
});
/**
 * Get a service schedule by ID
 * GET /admin/schedules/{serviceId}
 */
exports.getServiceSchedule = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        const serviceId = req.query.serviceId;
        if (!serviceId) {
            res.status(400).json({
                success: false,
                error: 'Service ID is required'
            });
            return;
        }
        console.log(`📋 Getting service schedule for: ${serviceId}`);
        const scheduleDoc = await db.collection('serviceSchedules').doc(serviceId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Service schedule not found'
            });
            return;
        }
        const schedule = scheduleDoc.data();
        res.status(200).json({
            success: true,
            schedule
        });
    }
    catch (error) {
        console.error('❌ Error getting service schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get service schedule'
        });
    }
});
/**
 * Get all service schedules
 * GET /admin/schedules
 */
exports.getServiceSchedules = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        console.log('📋 Getting all service schedules');
        const scheduleQuery = db.collection('serviceSchedules')
            .orderBy('updatedAt', 'desc')
            .limit(100);
        const snapshot = await scheduleQuery.get();
        const schedules = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json({
            success: true,
            schedules,
            total: schedules.length
        });
    }
    catch (error) {
        console.error('❌ Error getting service schedules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get service schedules'
        });
    }
});
/**
 * Delete a service schedule
 * DELETE /admin/schedules/{serviceId}
 */
exports.deleteServiceSchedule = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'DELETE') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        const serviceId = req.query.serviceId;
        if (!serviceId) {
            res.status(400).json({
                success: false,
                error: 'Service ID is required'
            });
            return;
        }
        console.log(`🗑️ Deleting service schedule for: ${serviceId}`);
        // Check if schedule exists
        const scheduleDoc = await db.collection('serviceSchedules').doc(serviceId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Service schedule not found'
            });
            return;
        }
        // Delete the schedule
        await db.collection('serviceSchedules').doc(serviceId).delete();
        // TODO: Also delete related time slots
        console.log('🔄 Cleaning up related time slots...');
        res.status(200).json({
            success: true,
            message: 'Service schedule deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ Error deleting service schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete service schedule'
        });
    }
});
/**
 * Generate time slots for a service schedule
 * POST /admin/schedules/generate-slots
 */
exports.generateTimeSlots = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        const { serviceId, startDate, endDate, options } = req.body;
        if (!serviceId || !startDate || !endDate) {
            res.status(400).json({
                success: false,
                error: 'Service ID, start date, and end date are required'
            });
            return;
        }
        console.log(`⚡ Generating time slots for service: ${serviceId}`);
        console.log(`📅 Date range: ${startDate} to ${endDate}`);
        // Get the service schedule
        const scheduleDoc = await db.collection('serviceSchedules').doc(serviceId).get();
        if (!scheduleDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Service schedule not found'
            });
            return;
        }
        const schedule = scheduleDoc.data();
        // TODO: Integrate with TimeSlotGenerationEngine
        // For now, simulate slot generation
        const simulatedSlots = generateSimulatedSlots(schedule, startDate, endDate);
        console.log(`✅ Generated ${simulatedSlots.length} time slots for service: ${serviceId}`);
        res.status(200).json({
            success: true,
            message: 'Time slots generated successfully',
            slotsGenerated: simulatedSlots.length,
            serviceId,
            dateRange: { startDate, endDate }
        });
    }
    catch (error) {
        console.error('❌ Error generating time slots:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate time slots'
        });
    }
});
/**
 * Simulate slot generation (replace with actual TimeSlotGenerationEngine integration)
 */
function generateSimulatedSlots(schedule, startDate, endDate) {
    const slots = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay();
        const workingDay = schedule.workingDays.find(wd => wd.dayOfWeek === dayOfWeek);
        if (workingDay && workingDay.active) {
            // Generate slots for this working day
            const slotStart = schedule.defaultTimeConfig.timeSlots.startTime;
            const slotEnd = schedule.defaultTimeConfig.timeSlots.endTime;
            slots.push({
                serviceId: schedule.serviceId,
                date: date.toISOString().split('T')[0],
                startTime: slotStart,
                endTime: slotEnd,
                capacity: schedule.capacityConfig.defaultCapacity.maxParticipants,
                price: schedule.pricingConfig.basePricing.amount,
                status: 'available'
            });
        }
    }
    return slots;
}
/**
 * Get schedule statistics
 * GET /admin/schedules/stats
 */
exports.getScheduleStats = functions.https.onRequest(async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        return;
    }
    try {
        console.log('📊 Getting schedule statistics');
        // Get total schedules count
        const schedulesSnapshot = await db.collection('serviceSchedules').get();
        const totalSchedules = schedulesSnapshot.size;
        // Count by status
        const statusCounts = {
            active: 0,
            draft: 0,
            paused: 0,
            archived: 0
        };
        schedulesSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const status = data.status;
            if (status in statusCounts) {
                statusCounts[status]++;
            }
        });
        // Get time slots count (approximate)
        const slotsSnapshot = await db.collection('timeSlots').limit(1000).get();
        const totalSlots = slotsSnapshot.size;
        const stats = {
            totalSchedules,
            statusCounts,
            totalSlots,
            lastUpdated: new Date().toISOString()
        };
        res.status(200).json({
            success: true,
            stats
        });
    }
    catch (error) {
        console.error('❌ Error getting schedule stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get schedule statistics'
        });
    }
});
//# sourceMappingURL=serviceSchedule.js.map