"use strict";
/**
 * Authentication Routes
 * Firebase Auth integration endpoints for customer authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_admin_1 = require("firebase-admin");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/verify-phone
 * Verify phone number with custom token
 */
router.post('/verify-phone', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber, verificationCode } = req.body;
    if (!phoneNumber || !verificationCode) {
        res.status(400).json({
            success: false,
            error: 'Telefon numarası ve doğrulama kodu gereklidir'
        });
        return;
    }
    try {
        // In a real implementation, you would verify the phone number
        // For now, we'll create a custom token for the phone number
        const customToken = await (0, firebase_admin_1.auth)().createCustomToken(phoneNumber);
        res.status(200).json({
            success: true,
            customToken,
            message: 'Telefon numarası doğrulandı'
        });
    }
    catch (error) {
        console.error('Phone verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Telefon doğrulama hatası'
        });
    }
}));
/**
 * POST /api/auth/create-customer
 * Create customer profile after authentication
 */
router.post('/create-customer', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { uid, email, phone, firstName, lastName, authMethod, isTemporary } = req.body;
    if (!uid) {
        res.status(400).json({
            success: false,
            error: 'Kullanıcı ID gereklidir'
        });
        return;
    }
    try {
        const firestore = require('firebase-admin').firestore();
        const customersRef = firestore.collection('customers');
        const customerData = {
            email: email || '',
            phone: phone || '',
            firstName: firstName || '',
            lastName: lastName || '',
            authMethod: authMethod || 'email',
            isTemporary: isTemporary || false,
            preferredLanguage: 'tr',
            preferences: {
                communications: {
                    email: true,
                    sms: true,
                    push: true
                },
                language: 'tr',
                currency: 'TRY',
                timeZone: 'Europe/Istanbul'
            },
            loyaltyPoints: 0,
            totalBookings: 0,
            memberSince: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await customersRef.doc(uid).set(customerData);
        res.status(201).json({
            success: true,
            customer: { id: uid, ...customerData },
            message: 'Müşteri profili oluşturuldu'
        });
    }
    catch (error) {
        console.error('Customer creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Müşteri profili oluşturulamadı'
        });
    }
}));
/**
 * GET /api/auth/profile/:uid
 * Get customer profile by UID
 */
router.get('/profile/:uid', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { uid } = req.params;
    if (!uid) {
        res.status(400).json({
            success: false,
            error: 'Kullanıcı ID gereklidir'
        });
        return;
    }
    try {
        const firestore = require('firebase-admin').firestore();
        const customerDoc = await firestore.collection('customers').doc(uid).get();
        if (!customerDoc.exists) {
            res.status(404).json({
                success: false,
                error: 'Müşteri profili bulunamadı'
            });
            return;
        }
        const customerData = customerDoc.data();
        res.status(200).json({
            success: true,
            customer: { id: uid, ...customerData }
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Profil alınamadı'
        });
    }
}));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map