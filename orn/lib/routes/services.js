"use strict";
/**
 * Services Routes
 * Handles service-related API endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const router = (0, express_1.Router)();
// Sample service data for development
const sampleServices = [
    {
        id: 'sup-rental-basic',
        name: 'SUP Board Kiralama',
        slug: 'sup-board-kiralama',
        description: "Kaliteli SUP board'larını saatlik olarak kiralayın. Tüm seviyeler için uygun.",
        shortDescription: "Kaliteli SUP board'ları ile özgürce keşfet",
        type: 'rental',
        pricing: {
            basePrice: 150,
            pricingType: 'hourly',
        },
        duration: {
            value: 1,
            unit: 'hour',
        },
        capacity: {
            min: 1,
            max: 8,
        },
        requirements: {
            experience: 'beginner',
        },
        includedEquipment: [
            { id: 'sup-board', name: 'SUP Board', included: true },
            { id: 'paddle', name: 'Paddle', included: true },
            { id: 'life-jacket', name: 'Can Yeleği', included: true },
        ],
        additionalEquipment: [
            { id: 'waterproof-bag', name: 'Su Geçirmez Çanta', price: 25 },
            { id: 'gopro-mount', name: 'GoPro Aparatı', price: 35 },
        ],
        media: [{ url: '/images/sup-rental-1.jpg' }],
    },
    {
        id: 'guided-tour-sunset',
        name: 'Rehberli SUP Turu',
        slug: 'rehberli-sup-turu',
        description: 'Profesyonel rehber eşliğinde unutulmaz SUP tur deneyimi yaşayın.',
        shortDescription: 'Profesyonel rehber eşliğinde unutulmaz tur deneyimi',
        type: 'guided_tour',
        pricing: {
            basePrice: 250,
            pricingType: 'per_person',
        },
        duration: {
            value: 2,
            unit: 'hour',
        },
        capacity: {
            min: 2,
            max: 12,
        },
        requirements: {
            experience: 'beginner',
        },
        includedEquipment: [
            { id: 'sup-board', name: 'SUP Board', included: true },
            { id: 'paddle', name: 'Paddle', included: true },
            { id: 'life-jacket', name: 'Can Yeleği', included: true },
            { id: 'guide', name: 'Profesyonel Rehber', included: true },
        ],
        additionalEquipment: [
            { id: 'waterproof-camera', name: 'Su Geçirmez Kamera', price: 50 },
            { id: 'snorkeling-gear', name: 'Şnorkel Seti', price: 40 },
        ],
        media: [{ url: '/images/guided-tour-1.jpg' }],
    },
    {
        id: 'sup-lesson-beginner',
        name: 'SUP Eğitimi',
        slug: 'sup-egitimi',
        description: 'Başlangıçtan ileri seviyeye SUP eğitimi alın. Sertifikalı eğitmenlerle.',
        shortDescription: 'Başlangıçtan ileri seviyeye SUP eğitimi',
        type: 'lesson',
        pricing: {
            basePrice: 200,
            pricingType: 'per_person',
        },
        duration: {
            value: 90,
            unit: 'minute',
        },
        capacity: {
            min: 1,
            max: 6,
        },
        requirements: {
            experience: 'none',
        },
        includedEquipment: [
            { id: 'sup-board', name: 'SUP Board', included: true },
            { id: 'paddle', name: 'Paddle', included: true },
            { id: 'life-jacket', name: 'Can Yeleği', included: true },
            { id: 'instructor', name: 'Sertifikalı Eğitmen', included: true },
        ],
        additionalEquipment: [{ id: 'wetsuit', name: 'Dalış Kıyafeti', price: 30 }],
        media: [{ url: '/images/sup-lesson-1.jpg' }],
    },
];
/**
 * GET /services
 * Get all available services
 */
router.get('/', async (req, res) => {
    try {
        console.log('📋 Fetching services list');
        const db = firebase_admin_1.default.firestore();
        const snapshot = await db
            .collection('services')
            .where('isActive', '==', true)
            .orderBy('displayOrder', 'asc')
            .get();
        const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({
            success: true,
            data: services.length > 0 ? services : sampleServices,
            message: 'Services retrieved successfully',
            source: services.length > 0 ? 'firestore' : 'mock-fallback',
        });
    }
    catch (error) {
        console.error('❌ Error fetching services:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch services',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * GET /services/:id
 * Get a specific service by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🎯 Fetching service: ${id}`);
        const db = firebase_admin_1.default.firestore();
        const docRef = db.collection('services').doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            res.status(200).json({
                success: true,
                data: { id: docSnap.id, ...docSnap.data() },
                message: 'Service retrieved successfully',
                source: 'firestore',
            });
            return;
        }
        const fallback = sampleServices.find(s => s.id === id);
        if (fallback) {
            res.status(200).json({
                success: true,
                data: fallback,
                message: 'Service retrieved successfully (mock fallback)',
                source: 'mock-fallback',
            });
            return;
        }
        res.status(404).json({
            success: false,
            error: 'Service not found',
            message: `Service with ID "${id}" not found`,
        });
    }
    catch (error) {
        console.error('❌ Error fetching service:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Note: Additional services moved to dedicated route: /api/additional-services
// See: src/routes/additionalServices.ts
exports.default = router;
//# sourceMappingURL=services.js.map