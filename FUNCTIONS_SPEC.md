# Firebase Functions & Data Plan (AlphaSUP)

This project currently has no backend functions folder. Below are proposed endpoints and Firestore data shapes to support reservations, availability, pricing, and admin.

## Collections

- reservations (document per reservation)
  - serviceId: string (hourly | daily | sunset | moon)
  - dateISO: string (YYYY-MM-DD)
  - time: string (HH:mm)
  - people: number
  - boardType: string
  - extras: string[]
  - totalTRY: number
  - customer: { name, email, phone }
  - coupon?: string
  - termsAccepted: boolean
  - status: 'pending-payment' | 'paid' | 'cancelled' | 'refunded'
  - userUid?: string | null
  - createdAt: Timestamp

- availability (per day + service time slots)
  - id format: `${dateISO}_${serviceId}`
  - dateISO: string
  - serviceId: string
  - slots: { time: string; capacity: number; booked: number }[]

- pricing (per month/day/service)
  - id format: `${yyyyMM}_${day}_${serviceId}`
  - month: string (YYYY-MM)
  - day: number
  - serviceId: string
  - priceTRY: number

- users
  - uid: string
  - role: 'admin' | 'staff' | 'customer'

## Proposed Cloud Functions (HTTP)

- POST /api/reservations
  - Body: ReservationPayload (see src/lib/api.ts)
  - Validates availability and price server-side, creates reservation, returns { id }

- POST /api/payments/checkout
  - Body: { reservationId: string, provider: 'stripe' | 'iyzico' }
  - Creates payment session, returns { url }

- POST /api/webhooks/stripe
  - Stripe webhook to mark reservation as paid/cancelled

- GET /api/availability?date=YYYY-MM-DD&serviceId=hourly
  - Returns slots for selected day/service

- PUT /api/admin/pricing
  - Auth required (admin)
  - Body: { month, day, serviceId, priceTRY }

## Security Rules (Firestore)

- reservations: create allowed for authenticated users, or anonymous with reCAPTCHA + rate limit; read own docs; admin read/write all
- availability: read public; write admin/staff only
- pricing: read public; write admin
- users: read/write own profile; admin read/write all

## Next steps

1. Initialize Firebase project (Web app) and fill .env.local with keys.
2. Add Cloud Functions using Node 20 + Express with endpoints above.
3. Add Firestore security rules per plan.
4. Wire /rezervasyon to call POST /api/reservations then payment checkout.
5. Add Admin auth guard and panels to edit availability/pricing.
