import { Request, Response, Router } from 'express';
import admin from 'firebase-admin';

const router = Router();

type Slot = { time: string; capacity: number; booked: number };

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function generateSampleSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let h = 9; h <= 18; h++) {
    slots.push({ time: `${pad(h)}:00`, capacity: 8, booked: 0 });
  }
  return slots;
}

/**
 * GET /api/availability
 * Query: date=YYYY-MM-DD&serviceId=<id>
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || '';
    const serviceId = (req.query.serviceId as string) || '';

    if (!date || !serviceId) {
      res.status(400).json({
        success: false,
        error: 'Missing required query params',
        message: 'Provide date=YYYY-MM-DD and serviceId',
      });
      return;
    }

    const db = admin.firestore();
    const docId = `${date}_${serviceId}`;
    const doc = await db.collection('availability').doc(docId).get();

    if (doc.exists) {
      const data = doc.data() || {};
      res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          dateISO: date,
          serviceId,
          slots: (data.slots as Slot[]) || [],
        },
        source: 'firestore',
      });
      return;
    }

    // Fallback to generated sample slots
    res.status(200).json({
      success: true,
      data: {
        id: docId,
        dateISO: date,
        serviceId,
        slots: generateSampleSlots(),
      },
      source: 'mock-fallback',
    });
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
