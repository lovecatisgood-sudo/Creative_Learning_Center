# Build Decisions

Ambiguities resolved during the build, per the kickoff prompt's "When you are
unsure → choose the simpler behavior and note it here." None of these touch
money or hour accounting rules (those follow the PRD exactly).

## M1 — Skeleton & data layer

- **DB driver: `pg` (node-postgres), not `@neondatabase/serverless`.** The PRD
  allows either. `pg` speaks standard Postgres, so the same code runs against
  Neon's pooled endpoint on a Hostinger VPS *and* on Vercel unchanged, and also
  against a plain local/Docker Postgres for development — no driver swap. The
  connection is lazy (created on first query) so `next build` never needs
  `DATABASE_URL`.

- **Auth: iron-session (not NextAuth).** Single shared credential, one encrypted
  httpOnly cookie — iron-session is the smaller dependency for exactly one login.

- **Admin identity source.** `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` in env are the
  canonical credential; `scripts/create-admin.ts` also upserts an `admins` row so
  there's a real integer id for `audit_log`. Login prefers the DB row and falls
  back to env-only (session `adminId = -1`) so the app works before the row is
  created.

- **Two-layer route protection.** `src/middleware.ts` bounces unauthenticated
  requests early (redirect for pages, 401 JSON for `/api/admin/*`) using cookie
  presence; the authenticated layout (`admin/(app)/layout.tsx`) additionally
  verifies the session cryptographically server-side. Middleware lives under
  `src/` because that's where Next.js detects it when an app uses a `src` dir.

- **i18n built from M1, not M2.** The kickoff says "from M2 onward," but the
  language toggle sits on every app bar including login, so the dictionary +
  `LanguageProvider` are foundational and were built now. Thai is the default,
  persisted per device in `localStorage`.

- **Bangkok time via fixed +7h offset.** Asia/Bangkok has no DST, so a constant
  offset is exact for extracting wall-clock components (receipt date stamp,
  pickup times) without pulling `Intl`/tz data into hot paths. Storage is UTC.
