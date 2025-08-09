import { Request, Response, Router } from 'express';

const router = Router();

const additionalServices = [
  { id: 'photography', name: 'Fotoğraf Çekimi', price: 100, unit: 'session' },
  { id: 'transport', name: 'Transfer Hizmeti', price: 75, unit: 'round_trip' },
  { id: 'lunch-package', name: 'Öğle Yemeği Paketi', price: 50, unit: 'person' },
];

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.status(200).json({ success: true, data: additionalServices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch additional services' });
  }
});

export default router;
