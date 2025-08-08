# AI Agent Guide: AlphaSUP-V6

This repository contains a Vite + React (TypeScript) SPA frontend and an attached Firebase Functions backend (v5 code under `orn/`). Use this guide to make productive, safe edits.

## Architecture at a glance
- Frontend (SPA)
  - Stack: Vite + React 18 + TypeScript + shadcn/ui + TailwindCSS
  - Entry: `src/main.tsx` → `src/App.tsx` (React Router routes)
  - Pages: `src/pages/*` (e.g., `Rezervasyon.tsx`, `Giris.tsx`, `Admin.tsx`)
  - UI/SEO: `src/components/**`, SEO via `components/seo/SEO` and `react-helmet-async`
  - Data layer: lightweight API helpers under `src/lib/` and Firebase Web SDK init (`src/lib/firebase.ts`)
- Backend (Functions v5 legacy in repo, deploy separately)
  - Located under `orn/` (TypeScript source in `orn/src`, compiled JS in `orn/lib`)
  - Express app exported as a single HTTPS function named `api` (`orn/src/index.ts`)
  - Routes mounted:
    - Stripe webhook: `POST /api/payments/webhook/stripe`
    - Payments: `/api/payments` (create intent/refund/get)
    - Customers: `/api/v1/customers` (profile + bookings)
    - Services: `/api/services` (public list/detail)
    - Admin services: `/api/v1/admin/services` (CRUD with role guards)
  - Middleware: `helmet`, `cors` (origin allowlist), rate limiting, raw body for webhook
  - External: Stripe (server-side), Firebase Admin SDK, Firestore

## Build, run, deploy
- Frontend
  - Install: `npm i`
  - Dev: `npm run dev` (Vite)
  - Build: `npm run build` → outputs `dist/`
  - Hosting: Firebase Hosting as SPA. Rewrites should map `/api/**` to `functions:api` and `**` to `/index.html`.
- Backend (in `orn/`)
  - Install: `cd orn; npm i`
  - Build: `npm run build` (tsc → `lib/`)
  - Deploy functions: `npm run deploy` (expects Firebase project configured, Node 20)
  - Secrets required: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (prefer Firebase Secret Manager)

## Configuration & env
- Frontend env keys (Vite): defined in `src/vite-env.d.ts` and example in `.env.example`:
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`
- Backend env (Functions): via process.env in `orn/src/config/stripe.ts`; do not hardcode; use secrets on deploy.

## Patterns and conventions
- Routing: React Router in `App.tsx`; pages live under `src/pages`. Keep routes lightweight, business logic in `src/lib/*` or backend.
- API calls (frontend):
  - Use `src/lib/api.ts` as the client layer. When calling server endpoints requiring auth, include Firebase ID token as `Authorization: Bearer <token>` (AuthMiddleware expects this).
  - Current placeholder creates Firestore reservations directly; prefer server endpoints for validation once booking endpoints are added.
- Auth (frontend): Initialized in `src/lib/firebase.ts`; simple email/password methods in `src/lib/api.ts`. Role-based access on server is driven by custom claims (`admin`, `editor`).
- Services data: `/api/services` reads Firestore `services` collection; falls back to sample data if empty. Admin CRUD exists under `/api/v1/admin/services`.
- Payments flow:
  - `POST /api/payments/create-intent` → Stripe PaymentIntent + client secret
  - Stripe webhook `POST /api/payments/webhook/stripe` updates Firestore `payments`/`bookings`
  - Keep raw body on webhook route (see `orn/src/index.ts`), and do not attach JSON parser before it.

## Important caveats for agents
- Rewrites: Ensure `firebase.json` includes a rewrite for `/api/**` to the `api` function; otherwise SPA will intercept API calls.
- CORS allowlist in `orn/src/index.ts` is currently permissive for unknown origins. Tighten when setting real domains.
- Avoid direct imports from `../../../shared/dist` found in compiled JS (`orn/lib/**`); prefer local types or ensure the shared package is available in Functions runtime.
- The SMS routes exist (`orn/src/routes/sms.ts`) but are not mounted in `index.ts`. Mount only if needed and guard with auth.
- Maintain free-tier friendliness: keep Functions consolidated (single `api`), avoid heavy cron/scheduled tasks by default.

## File map references
- Frontend:
  - `src/lib/firebase.ts` (Firebase Web SDK init)
  - `src/lib/api.ts` (client API wrapper)
  - `src/pages/Rezervasyon.tsx` (booking UI)
  - `vite.config.ts`, `tailwind.config.ts` (build/UI)
- Backend:
  - `orn/src/index.ts` (Express app, routes, middleware)
  - `orn/src/routes/*` (payments, services, customers, admin services, sms)
  - `orn/src/middleware/auth.ts` (ID token + roles)
  - `orn/src/services/payment.ts` + `orn/src/config/stripe.ts` (Stripe integration)

## Example: calling an authenticated endpoint
- Get Firebase ID token on client (auth.currentUser.getIdToken()) and call:
  - `GET /api/v1/customers/profile/:userId` with `Authorization: Bearer <token>`
  - Expect 403 if userId != token uid and role != admin.

If any of the above is unclear or you need more specifics (e.g., concrete domain allowlist, booking endpoints design), ask for those details and I’ll extend this guide. 
