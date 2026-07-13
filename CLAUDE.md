# CLAUDE.md

Guidance for Claude Code working in this repo. The SCCC Management System is an
internal POS + session-management app for a children's playroom in Bangkok. One
admin device runs the shop; parents self-register via a public QR form and never
log in.

**Source of truth:** `sccc-management-system-prd-v1.md` (business rules — wins on
logic) and `sccc-uiux-spec-v1.md` (screens — wins on layout/nav). These plus the
prototype are `chmod 444` read-only; don't edit them. `DECISIONS.md` records
where the implementation interprets an ambiguous spec point — read it before
changing money/hours/credits logic.

## Commands

```bash
pnpm dev                      # dev server (needs DATABASE_URL in .env.local)
pnpm build                    # production build (also typechecks + lints)
pnpm start                    # serve the production build
pnpm db:generate              # regenerate Drizzle migration after editing src/db/schema.ts
pnpm db:migrate               # apply migrations
pnpm db:seed                  # seed/refresh the 11 products (idempotent)
pnpm create-admin <email> <pw>  # print bcrypt hash + upsert the admin row
pnpm signup-qr <https://domain> # write signup-qr.png
pnpm images:landing            # regenerate responsive landing WebP + manifest from assets/
```

There are no unit tests; verification is done by driving the running app's HTTP
APIs and asserting against the database (see WALKTHROUGH.md). A local Docker
Postgres is used for this: `docker run -d --name sccc-pg -e POSTGRES_PASSWORD=sccc
-e POSTGRES_DB=sccc -p 55432:5432 postgres:16-alpine`, with `.env.local` →
`postgresql://postgres:sccc@localhost:55432/sccc`. After any schema/logic change,
verify against a real DB — don't trust the build alone.

## Architecture

Single Next.js 14 App Router app (TypeScript, Tailwind, Thai-default i18n).

```
src/app/(landing)/            public marketing page at / (six showcase sections)
src/app/signup/*              public parent registration (P1/P2), no auth
src/app/admin/login/          login (A0)
src/app/admin/(app)/          authed shell (bottom nav): sessions, search, sell,
                              overview, parent/[id], child/[id], session/[id],
                              receipt/[id]
src/app/api/public/signup     public signup endpoint
src/app/api/admin/*           all admin endpoints (each calls requireAdminId()),
                              including api/admin/directory (parent-grouped,
                              orphans-first, paginated directory data for /admin/search)
src/db/                       schema.ts, index.ts (lazy pooled pg), migrate/seed
src/lib/                      orders, sessionOps, packages, sessions, overview,
                              receipt, children, catalog, audit, auth, time, i18n,
                              directory (directory/search data layer), parents
                              (parent-detail: children + purchase history)
src/components/               AppBar, BottomNav, sheets, sell/*, Countdown,
                              Pagination (shared Prev/Next + page-number control
                              used by the directory, sessions, and overview lists), ...
src/middleware.ts             cookie-presence gate for /admin/* and /api/admin/*
```

**Admin shell is fluid, signup is not.** `src/app/admin/layout.tsx` wraps every
admin screen (login + authed app) in `.admin-frame` — full width, `max-width:
1120px`, phone through tablet, both orientations. This replaced a fixed 480px
column that used to size the admin app the same as the public flow. Public
`/signup` is unchanged: `src/app/signup/layout.tsx` still wraps it in the
480px-capped `.app-frame` (see `globals.css`), since that flow is meant to stay
a single-column phone form. Don't conflate the two classes.

Business logic lives in `src/lib/*` (server), is called by thin API route
handlers, and is exercised as transactions. Pages are server components that fetch
via `lib/*` and hand off to a `*Client.tsx` for interactivity.

## Conventions & gotchas (learned during the build)

- **DB access is lazy.** `src/db/index.ts` exports a `db` Proxy that connects on
  first query, so `next build` never needs `DATABASE_URL`. Uses node-postgres
  (`pg`) — same code runs on Neon (VPS or Vercel) and local Postgres.
- **Client/server split for product code.** Pure types + `productName` /
  `effectiveStatus` live in `src/lib/product.ts` (client-safe). `src/lib/packages.ts`
  imports the db. Never import a db-touching module into a `"use client"` file —
  it drags `pg`/`net`/`tls` into the bundle and the build fails. Import types with
  `import type`.
- **Every money/hours/credits mutation runs in a transaction and writes an
  `audit_log` row** via `writeAudit(tx, ...)` in the same transaction. No exceptions
  (PRD §7.7).
- **Proof photo is server-enforced.** Order confirmation re-reads the uploaded key
  from disk before creating anything; a payment cannot be confirmed without a real
  stored photo. Photos are served only through the authenticated
  `/api/admin/proof/[key]` route, never the public folder.
- **Refund = `booked − floor(elapsedHours)`, clamped ≥0**, HOUR_PASS only. (The
  PRD's literal `floor(booked − elapsed)` contradicts its own examples; see
  DECISIONS.md M4.) Server and client compute it identically.
- **Receipt numbers** `SCCC-YYYYMMDD-####` are computed in JS (max+1 of the
  Bangkok day) inside the order transaction; the `orders.receipt_no` unique index
  is the race backstop and `createPaidOrder` retries on 23505.
- **Time:** store UTC, display Asia/Bangkok. Use `src/lib/time.ts` helpers (fixed
  +7h offset — BKK has no DST). Overview period boundaries are in `src/lib/overview.ts`.
- **Auth is double-layered:** `src/middleware.ts` (cookie presence, must live under
  `src/` because of the src dir) + a cryptographic re-check in `admin/(app)/layout.tsx`
  and `requireAdminId()` in every admin route handler.
- **i18n:** never hardcode display text. Add a key to `src/lib/i18n/dictionary.ts`
  (Thai + English) and use `t("key")`. Thai is the default; product names carry
  both languages. User-entered data is never translated.
- **After editing `src/db/schema.ts`**, run `pnpm db:generate` then `pnpm db:migrate`.
- **Don't run `pnpm dev` and `pnpm build` against the same `.next` concurrently** —
  it corrupts chunks and `pnpm start` then 500s with "Cannot find module './NNN.js'".
  Fix: `rm -rf .next && pnpm build`.
- **Never use broad `pkill -f next`** — it can hit unrelated processes; kill by PID.
- **Landing page (`/`) is a separate app frame.** `src/app/(landing)/*` renders full-width,
  outside the `.app-frame`/`.admin-frame` columns (see above); those columns live in
  `src/app/signup/layout.tsx` and `src/app/admin/layout.tsx` (not the root layout), so the
  marketing page, the signup flow, and the admin app can each size independently. Landing
  images are pre-generated responsive WebP files committed to `public/landing/`, referenced
  through the typed manifest `src/lib/landing/images.ts` — run `pnpm images:landing` after
  changing anything under `assets/` to regenerate both.
- **Receipt is bilingual + carries an entity name.** `ReceiptClient.tsx` renders every label
  in Thai and English together (not a language toggle) and prints `process.env.
  NEXT_PUBLIC_COMPANY_NAME` (falls back to "Siamese Cat Cafe Co., Ltd.") above the shop name,
  since the printed ticket is the legal proof of payment.
- **PromptPay QR is a static image, not generated per-order.** `public/promptpay.jpg` (a
  fixed shop QR) is shown large in Sell → Checkout; tapping it opens a full-screen lightbox
  (`CheckoutView.tsx`, `qrOpen` state) closable via backdrop click or Escape. The customer
  enters the amount manually when scanning — there's no per-transaction QR payload.
- **Known pre-existing layout quirk (not fixed, tracked here):** every `admin/(app)/**/
  *Client.tsx` wraps its own content in `<div className="flex min-h-screen flex-col">`,
  which is already nested inside `admin/(app)/layout.tsx`'s own `flex min-h-screen flex-col`
  (main + sticky `BottomNav`). The inner `min-h-screen` forces a second full viewport height
  on top of the space already reserved for `BottomNav`, so every admin screen has ~65px of
  forced scroll even when content is short (measured identically at 360/390/810/1080px
  viewports — confirmed present on `main` before the responsive redesign, so it's not a
  regression from this branch). Fix direction: drop `min-h-screen` from the per-page wrapper
  divs (they only need `flex flex-col`/`flex-1`); left unfixed here since it touches 8 files
  and needs its own review.

## Deploying

See `DEPLOY.md` (Hostinger VPS: Node/pnpm/PM2/Nginx with `client_max_body_size`,
certbot; Neon; migrate+seed; admin hash; signup QR). `WALKTHROUGH.md` maps every
PRD §8 acceptance criterion to where it's implemented and how it was verified.
