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

## M4 — Sessions engine

- **Refund = booked − whole elapsed hours, not `floor(booked − elapsed)`.** The
  PRD formula text and its own examples disagree: `floor(4 − 3.033)` = 0, but the
  owner example (booked 4h, used 3h02m) and PRD §8 both want **1**. Read
  "elapsed_hours" as *whole* hours elapsed, so refund = `booked − floor(elapsed)`,
  clamped ≥0 — a partial hour counts as used. Matches every example. Server and
  client compute it identically.

- **Refund path is HOUR_PASS-only, asserted server-side.** `endSession` only ever
  adds hours back for a pass; timed/bundle sessions just complete (instance →
  consumed). A `refundHours` sent for a non-pass is ignored.

- **Instance lifecycle.** available → active (session running) → for a pass, back
  to available while hours/credits remain (multi-visit) else consumed; for
  timed/bundle, straight to consumed. À la carte credit instances flip to
  consumed when all their credits hit 0.

- **EXTRA_1H immediate extension is atomic with payment.** When bought via the
  session "+ Add 1 hour" shortcut (`?extendSession=<id>`), the order transaction
  consumes it in place — extends the running session's pickup by 1h, marks the
  instance consumed, writes an addon_redemption + audit — so payment and
  extension can't diverge. Plain Sell-tab EXTRA_1H creates a +1h credit instead.

- **Dashboard: server-render + 30s poll + 1s client tick.** Initial running
  sessions render server-side; a 30s poll refreshes the set (check-ins elsewhere)
  while countdowns tick every second client-side and flip red past pickup.

## Responsive-UI + directory redesign

- **Admin app is fluid, per explicit owner request — overriding the UI/UX spec's
  fixed-width column.** `sccc-uiux-spec-v1.md` specs the whole POS as a single
  phone-width (480px) column, same as the public signup form. The owner asked for
  the admin app (used on tablets at the front desk as well as phones) to actually
  use the extra width instead of sitting in a centered 480px strip with wasted
  space either side. `src/app/admin/layout.tsx` now wraps the admin app (login +
  authed shell) in `.admin-frame` — fluid, `max-width: 1120px`, phone through
  tablet, both orientations — while `src/app/signup/layout.tsx` keeps the
  original fixed `.app-frame` (480px) for the public, phone-only registration
  flow, which the spec's layout still governs unchanged. Every screen under
  `admin/(app)/*` (sessions grid, product grid, overview totals, directory list)
  was rebuilt with responsive Tailwind breakpoints so it visibly uses tablet
  width rather than just not breaking at it.

- **`/admin/search` is a browsable, parent-grouped directory, not a
  search-only-when-typed screen.** The UI/UX spec describes A2 as a search box
  that returns results once the staff types a query. In practice the front-desk
  need is closer to "browse who's here / who's incomplete," so `/admin/search`
  now loads non-empty by default: `src/lib/directory.ts` +
  `/api/admin/directory` return every parent (grouped, with their children
  nested) plus a synthetic "orphans" group for stub parents / incomplete
  profiles, sorted with incomplete/orphan records pinned first (they're the ones
  staff most need to notice and fix), paginated via the shared
  `src/components/Pagination.tsx`. Typing still filters the same endpoint by
  name/phone (`?q=`); it narrows the directory rather than being the only way to
  see anything. A new `/admin/parent/[id]` (`src/lib/parents.ts`) gives a single
  parent's header, children, and full purchase history in one place, since the
  directory's job is now navigation into that page rather than the destination
  itself.

## 2026-07-13 — Product-review fixes + a11y
Post-launch audit fixes (branch fix/review-findings): orders route returns proper JSON 500 (not bodyless) + hardened receipt-no retry (6x + jitter); signup surfaces server errors and validates phone/DOB (client+server) with legibility ≥12px; admin routes reject non-finite numeric inputs with 422 (refundHours/redemptions/start); Overview prints the full period (dropped 200-row list cap); PromptPay QR keyboard-openable; product tile is one tap target; **foreground text tokens (meta/warn/danger/ok/tealdeep) darkened to meet WCAG AA ≥4.5:1** (same hue); `<html lang>` syncs with the TH/EN toggle; AppBar controls + qty stepper bumped to ≥44px; branded :focus-visible. No business-logic/money/schema changes. EXCLUDED as working-as-designed (owner to confirm if desired): parent-grouped directory, family-view siblings, EXTRA_1H API-level gating, quick-add stub parents.
