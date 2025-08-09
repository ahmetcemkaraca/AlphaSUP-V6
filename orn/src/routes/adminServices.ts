/**
 * Admin Services Routes
 * Secure CRUD endpoints for managing services in Firestore
 */

import { Request, Response, Router } from 'express';
import admin from 'firebase-admin';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const auth = new AuthMiddleware();
const db = admin.firestore();

// Utilities
const badRequest = (
  res: Response,
  message: string,
  details?: unknown
): Response =>
  res.status(400).json({
    success: false,
    error: 'VALIDATION_ERROR',
    message,
    ...(details ? { details } : {}),
  });

// Shape used by admin UI for now (can be evolved to full shared Service later)
type AdminService = {
  id?: string;
  name: string;
  type: string;
  description: string;
  basePrice: number;
  duration: number; // minutes
  maxCapacity: number;
  minAge: number;
  isActive: boolean;
  location: string;
  imageUrl?: string;
  createdAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null;
  updatedAt?: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null;
  bookingCount?: number;
  displayOrder?: number;
};

// GET / - list services
router.get(
  '/',
  auth.authenticate,
  auth.requireEditor,
  async (req: Request, res: Response) => {
    try {
      const includeInactive =
        String(req.query.includeInactive || 'false') === 'true';

      let ref = db.collection('services').orderBy('displayOrder', 'asc');
      if (!includeInactive) {
        ref = ref.where('isActive', '==', true);
      }
      const snap = await ref.get();
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as object) }));
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Admin list services error:', error);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// GET /:id - get single service
router.get(
  '/:id',
  auth.authenticate,
  auth.requireEditor,
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return badRequest(res, 'Missing id');
      const doc = await db.collection('services').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'NOT_FOUND' });
      }
      res
        .status(200)
        .json({ success: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      console.error('Admin get service error:', error);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// POST / - create service
router.post(
  '/',
  auth.authenticate,
  auth.requireEditor,
  async (req: Request, res: Response) => {
    try {
      const payload = req.body as Partial<AdminService>;
      if (!payload || typeof payload !== 'object')
        return badRequest(res, 'Invalid payload');
      const required: Array<keyof AdminService> = [
        'name',
        'type',
        'description',
        'basePrice',
        'duration',
        'maxCapacity',
        'minAge',
        'isActive',
        'location',
      ];
      for (const key of required) {
        if (
          (payload as any)[key] === undefined ||
          (key === 'name' && String((payload as any)[key]).trim() === '')
        ) {
          return badRequest(res, `Missing field: ${key as string}`);
        }
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const docRef = await db.collection('services').add({
        ...payload,
        bookingCount: 0,
        displayOrder:
          typeof payload.displayOrder === 'number'
            ? payload.displayOrder
            : Date.now(),
        createdAt: now,
        updatedAt: now,
        createdBy: req.user?.uid || 'system',
        lastModifiedBy: req.user?.uid || 'system',
      });

      const created = await docRef.get();
      res
        .status(201)
        .json({ success: true, data: { id: created.id, ...created.data() } });
    } catch (error) {
      console.error('Admin create service error:', error);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// PUT /:id - update service
router.put(
  '/:id',
  auth.authenticate,
  auth.requireEditor,
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return badRequest(res, 'Missing id');

      const updates = {
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastModifiedBy: req.user?.uid || 'system',
      } as Partial<AdminService> & Record<string, any>;

      await db.collection('services').doc(id).set(updates, { merge: true });
      const updated = await db.collection('services').doc(id).get();

      res
        .status(200)
        .json({ success: true, data: { id: updated.id, ...updated.data() } });
    } catch (error) {
      console.error('Admin update service error:', error);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// PATCH /:id/toggle - toggle isActive
router.patch(
  '/:id/toggle',
  auth.authenticate,
  auth.requireEditor,
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return badRequest(res, 'Missing id');
      const ref = db.collection('services').doc(id);
      const doc = await ref.get();
      if (!doc.exists)
        return res.status(404).json({ success: false, error: 'NOT_FOUND' });
      const current = doc.data() as AdminService | undefined;
      const isActive = !(current?.isActive ?? true);
      await ref.update({
        isActive,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastModifiedBy: req.user?.uid || 'system',
      });
      const updated = await ref.get();
      res
        .status(200)
        .json({ success: true, data: { id: updated.id, ...updated.data() } });
    } catch (error) {
      console.error('Admin toggle service error:', error);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

// DELETE /:id - delete service (admin only)
router.delete(
  '/:id',
  auth.authenticate,
  auth.requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return badRequest(res, 'Missing id');
      await db.collection('services').doc(id).delete();
      res.status(200).json({ success: true, data: { id } });
    } catch (error) {
      console.error('Admin delete service error:', error);
      res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
    }
  }
);

export default router;
