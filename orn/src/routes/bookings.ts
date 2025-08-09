import { Router } from 'express';
import admin from 'firebase-admin';
import { AuthMiddleware } from '../middleware/auth';
import { Booking, BookingStatus } from '../types/booking';

const router = Router();
const auth = new AuthMiddleware();
const db = admin.firestore();

// POST /api/v1/bookings - create booking (server-side validation placeholder)
router.post('/', auth.authenticate, async (req, res) => {
  try {
    const { serviceId, dateISO, time, people, boardType, extras, totalTRY } =
      req.body || {};

    if (!serviceId || !dateISO || !time || !people || !totalTRY) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing required fields' });
    }

    const payload: Booking = {
      serviceId: String(serviceId),
      dateISO: String(dateISO),
      time: String(time),
      people: Number(people),
      boardType: boardType ? String(boardType) : undefined,
      extras: Array.isArray(extras)
        ? extras.map((e: any) => String(e))
        : undefined,
      totalTRY: Number(totalTRY),
      status: BookingStatus.PENDING,
      customerId: req.user?.uid || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection('bookings').add(payload as any);
    const doc = await ref.get();

    res.status(201).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: error?.message || 'ERROR' });
  }
});

// GET /api/v1/bookings/:id - get booking (owner or admin)
router.get('/:id', auth.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('bookings').doc(id).get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
    const data = doc.data() as Booking & { customerId?: string };
    if (data.customerId && data.customerId !== req.user!.uid && !req.user!.isAdmin) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }
    res.status(200).json({ success: true, data: { id: doc.id, ...data } });
  } catch (error: any) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, error: error?.message || 'ERROR' });
  }
});

export default router;
