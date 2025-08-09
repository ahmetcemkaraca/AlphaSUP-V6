"use strict";
/**
 * Customer Equipment Controller
 * Handles customer-facing equipment operations
 *
 * Task 5: Equipment Management Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEquipmentRecommendations = exports.getEquipmentSpecs = exports.getEquipmentTypes = exports.getAvailableEquipment = void 0;
const firebase_1 = require("../config/firebase");
/**
 * Get available equipment for customers
 * GET /api/v1/equipment/available
 */
const getAvailableEquipment = async (req, res, next) => {
    try {
        const { location, type, date } = req.query;
        let query = firebase_1.db.collection('equipment');
        // Filter by availability status
        query = query.where('status', '==', 'available');
        // Filter by location if provided
        if (location) {
            query = query.where('location', '==', location);
        }
        // Filter by equipment type if provided
        if (type) {
            query = query.where('type', '==', type);
        }
        const snapshot = await query.get();
        const equipment = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Filter by date availability if provided
        let availableEquipment = equipment;
        if (date) {
            // Check booking conflicts for the specific date
            const targetDate = new Date(date);
            const bookingsSnapshot = await firebase_1.db.collection('bookings')
                .where('date', '==', targetDate)
                .where('status', 'in', ['confirmed', 'pending'])
                .get();
            const bookedEquipmentIds = new Set();
            bookingsSnapshot.docs.forEach(doc => {
                const booking = doc.data();
                if (booking['equipment'] && Array.isArray(booking['equipment'])) {
                    booking['equipment'].forEach((eq) => {
                        if (eq.id)
                            bookedEquipmentIds.add(eq.id);
                    });
                }
            });
            availableEquipment = equipment.filter(eq => !bookedEquipmentIds.has(eq.id));
        }
        res.json({
            success: true,
            data: {
                equipment: availableEquipment,
                totalCount: availableEquipment.length,
                filters: { location, type, date }
            }
        });
    }
    catch (error) {
        console.error('Error getting available equipment:', error);
        next(error);
    }
};
exports.getAvailableEquipment = getAvailableEquipment;
/**
 * Get equipment types and categories
 * GET /api/v1/equipment/types
 */
const getEquipmentTypes = async (req, res, next) => {
    try {
        const snapshot = await firebase_1.db.collection('equipment').get();
        const equipment = snapshot.docs.map(doc => doc.data());
        // Extract unique types and categories
        const types = new Set();
        const categories = new Set();
        const sizes = new Set();
        const brands = new Set();
        equipment.forEach(eq => {
            if (eq['type'])
                types.add(eq['type']);
            if (eq['category'])
                categories.add(eq['category']);
            if (eq['size'])
                sizes.add(eq['size']);
            if (eq['brand'])
                brands.add(eq['brand']);
        });
        res.json({
            success: true,
            data: {
                types: Array.from(types).sort(),
                categories: Array.from(categories).sort(),
                sizes: Array.from(sizes).sort(),
                brands: Array.from(brands).sort(),
                totalEquipment: equipment.length
            }
        });
    }
    catch (error) {
        console.error('Error getting equipment types:', error);
        next(error);
    }
};
exports.getEquipmentTypes = getEquipmentTypes;
/**
 * Get detailed specifications for specific equipment
 * GET /api/v1/equipment/:id/specs
 */
const getEquipmentSpecs = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({
                success: false,
                error: 'Equipment ID is required'
            });
            return;
        }
        const doc = await firebase_1.db.collection('equipment').doc(id).get();
        if (!doc.exists) {
            res.status(404).json({
                success: false,
                error: 'Equipment not found'
            });
            return;
        }
        const equipment = { id: doc.id, ...doc.data() };
        // Get related bookings for availability info
        const bookingsSnapshot = await firebase_1.db.collection('bookings')
            .where('equipment', 'array-contains', { id })
            .where('status', 'in', ['confirmed', 'pending'])
            .orderBy('date', 'desc')
            .limit(5)
            .get();
        const recentBookings = bookingsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                date: data['date'],
                status: data['status'],
                customerName: data['customerInfo']?.['firstName'] || 'Unknown'
            };
        });
        // Calculate usage statistics
        const totalBookings = await firebase_1.db.collection('bookings')
            .where('equipment', 'array-contains', { id })
            .where('status', '==', 'completed')
            .get();
        const usageStats = {
            totalUses: totalBookings.size,
            lastUsed: recentBookings.length > 0 ? recentBookings[0]?.date : null,
            averageRating: equipment['averageRating'] || 0,
            condition: equipment['condition'] || 'good'
        };
        res.json({
            success: true,
            data: {
                equipment,
                specifications: {
                    dimensions: equipment['dimensions'] || {},
                    weight: equipment['weight'] || null,
                    material: equipment['material'] || null,
                    features: equipment['features'] || [],
                    suitableFor: equipment['suitableFor'] || [],
                    maintenanceDate: equipment['maintenanceDate'] || null
                },
                availability: {
                    status: equipment['status'],
                    location: equipment['location'],
                    nextAvailable: equipment['nextAvailable'] || null
                },
                usage: usageStats,
                recentBookings: recentBookings
            }
        });
    }
    catch (error) {
        console.error('Error getting equipment specs:', error);
        next(error);
    }
};
exports.getEquipmentSpecs = getEquipmentSpecs;
/**
 * Get equipment recommendations based on customer preferences
 * GET /api/v1/equipment/recommendations
 */
const getEquipmentRecommendations = async (req, res, next) => {
    try {
        const { experience, bodyWeight, height, preferences } = req.query;
        const customerId = req.user?.uid;
        // Get customer's booking history if authenticated
        let customerHistory = [];
        if (customerId) {
            const historySnapshot = await firebase_1.db.collection('bookings')
                .where('customerId', '==', customerId)
                .where('status', '==', 'completed')
                .orderBy('date', 'desc')
                .limit(10)
                .get();
            customerHistory = historySnapshot.docs.map(doc => doc.data());
        }
        // Get all available equipment
        const equipmentSnapshot = await firebase_1.db.collection('equipment')
            .where('status', '==', 'available')
            .get();
        const allEquipment = equipmentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Simple recommendation logic based on experience and preferences
        const recommendations = allEquipment.filter(eq => {
            // Filter by experience level
            if (experience === 'beginner' && eq['difficulty'] === 'advanced')
                return false;
            if (experience === 'advanced' && eq['difficulty'] === 'beginner')
                return false;
            // Filter by body weight if specified
            if (bodyWeight && eq['weightLimit'] && parseInt(bodyWeight) > eq['weightLimit'])
                return false;
            return true;
        }).sort((a, b) => {
            // Sort by rating and popularity
            const aScore = (a['averageRating'] || 0) + (a['popularityScore'] || 0);
            const bScore = (b['averageRating'] || 0) + (b['popularityScore'] || 0);
            return bScore - aScore;
        }).slice(0, 6); // Top 6 recommendations
        res.json({
            success: true,
            data: {
                recommendations,
                criteria: {
                    experience: experience || 'not specified',
                    bodyWeight: bodyWeight || 'not specified',
                    height: height || 'not specified',
                    hasHistory: customerHistory.length > 0
                },
                totalAvailable: allEquipment.length
            }
        });
    }
    catch (error) {
        console.error('Error getting equipment recommendations:', error);
        next(error);
    }
};
exports.getEquipmentRecommendations = getEquipmentRecommendations;
//# sourceMappingURL=equipmentController.js.map