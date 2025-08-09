/**
 * AlphaSUP Customer Profile Routes
 * Handles customer profile creation, updates, and retrieval
 */

import { Router } from 'express';
import admin from 'firebase-admin';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const authMiddleware = new AuthMiddleware();
const db = admin.firestore();

// Debug endpoint to test API connectivity
router.get('/test', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Customer API is working',
      timestamp: new Date().toISOString(),
      headers: req.headers,
      method: req.method,
      url: req.url,
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get customer profile
router.get(
  '/profile/:userId',
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own profile or is admin
      if (req.user?.uid !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Unauthorized access to profile',
          code: 'FORBIDDEN',
        });
      }

      const customerDoc = await db.collection('customers').doc(userId).get();

      if (!customerDoc.exists) {
        return res.status(404).json({
          error: 'Customer profile not found',
          code: 'PROFILE_NOT_FOUND',
        });
      }

      const customerData = customerDoc.data() || {};
      // Remove sensitive data before sending without creating unused vars
      if (
        Object.prototype.hasOwnProperty.call(customerData, 'stripeCustomerId')
      ) {
        delete (customerData as any).stripeCustomerId;
      }

      res.status(200).json({
        success: true,
        data: {
          id: customerDoc.id,
          ...customerData,
        },
      });
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      res.status(500).json({
        error: 'Failed to fetch customer profile',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

// Create customer profile
router.post('/', authMiddleware.authenticate, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
        code: 'UNAUTHORIZED',
      });
    }

    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      dateOfBirth,
      emergencyContact,
      swimmingLevel,
      preferences,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, phoneNumber',
        code: 'VALIDATION_ERROR',
      });
    }

    // Check if profile already exists
    const existingProfile = await db.collection('customers').doc(userId).get();
    if (existingProfile.exists) {
      return res.status(409).json({
        error: 'Customer profile already exists',
        code: 'PROFILE_EXISTS',
      });
    }

    const customerData = {
      uid: userId,
      firstName,
      lastName,
      phoneNumber,
      email: email || req.user?.email,
      dateOfBirth: dateOfBirth || null,
      emergencyContact: emergencyContact || null,
      swimmingLevel: swimmingLevel || 'beginner',
      preferences: preferences || {},
      bookingCount: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('customers').doc(userId).set(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer profile created successfully',
      data: {
        id: userId,
        ...customerData,
      },
    });
  } catch (error) {
    console.error('Error creating customer profile:', error);
    res.status(500).json({
      error: 'Failed to create customer profile',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Update customer profile
router.put(
  '/profile/:userId',
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user is updating their own profile
      if (req.user?.uid !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to profile',
          code: 'FORBIDDEN',
        });
      }

      const {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth,
        emergencyContact,
        swimmingLevel,
        preferences,
      } = req.body;

      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (emergencyContact) updateData.emergencyContact = emergencyContact;
      if (swimmingLevel) updateData.swimmingLevel = swimmingLevel;
      if (preferences) updateData.preferences = preferences;

      await db.collection('customers').doc(userId).update(updateData);

      const updatedDoc = await db.collection('customers').doc(userId).get();
      const updatedData = updatedDoc.data();

      res.status(200).json({
        success: true,
        message: 'Customer profile updated successfully',
        data: {
          id: userId,
          ...updatedData,
        },
      });
    } catch (error) {
      console.error('Error updating customer profile:', error);
      res.status(500).json({
        error: 'Failed to update customer profile',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

// Get customer booking history
router.get(
  '/bookings/:userId',
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Verify user is accessing their own bookings
      if (req.user?.uid !== userId) {
        return res.status(403).json({
          error: 'Unauthorized access to bookings',
          code: 'FORBIDDEN',
        });
      }

      const bookingsSnapshot = await db
        .collection('bookings')
        .where('customerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const bookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
      res.status(500).json({
        error: 'Failed to fetch customer bookings',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

export default router;
