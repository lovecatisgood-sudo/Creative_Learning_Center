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

## M2 — Registration & search

- **Quick-add uses a linked stub parent, not `child.parent_id = null`.** PRD §6.2
  describes "parent_id = null and a stub parent keyed by phone." Implemented as a
  stub `parents` row (blank name, `profile_complete = false`) that the child *is*
  linked to, because the child needs to carry its contact phone (children have no
  phone column) and be sellable immediately. "Complete profile" fills the stub;
  "link by phone" repoints the child to a matched complete parent and deletes the
  orphaned stub. Functionally identical to the PRD's intent, and it actually works.

- **Duplicate-phone handling is a server-returned flag, not a public lookup.** The
  signup API creates the record regardless (PRD: "warn but allow") and returns
  `duplicatePhone: true` for the staff-facing success screen. No public
  phone-existence endpoint, to avoid letting anyone enumerate registered numbers.

- **Client-safe product module (`lib/product.ts`).** Pure types + `productName` /
  `effectiveStatus` live apart from `lib/packages.ts` (which imports the db) so
  client components can use them without webpack trying to bundle `pg`/`net`/`tls`.

## M3 — Sell / payment / receipt

- **No draft-order persistence.** The cart lives in client state; the order,
  items, single payment, and all package_instances are created in one atomic
  transaction only at "Confirm payment received." Nothing half-created if the
  admin backs out.

- **Receipt number computed in JS, unique constraint as backstop.** `SCCC-
  YYYYMMDD-####` per Bangkok day: read the day's existing numbers in the
  transaction, take max+1. The `orders.receipt_no` unique index guards races;
  `createPaidOrder` retries the transaction on a 23505 collision.

- **Proof photo: upload-then-reference, server-enforced.** The client compresses
  (≤1600px/~500KB) and uploads to `/api/admin/upload` → opaque key. Confirmation
  re-reads that key from disk before creating the order, so a payment can't be
  confirmed without a real stored photo. Photos are served only through an
  authenticated route (401 for anon), never the public folder.

- **EXTRA_1H in the Sell grid is gated on a running session.** À la carte it
  creates a +1h credit instance; "extend the running timer immediately on
  payment" is wired in M4 where sessions exist.

- **qty N → N independent package_instances** (PRD §7.8).
