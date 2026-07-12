# Walkthrough — PRD §8 Acceptance Criteria

Each launch-gate criterion, where it's implemented, and how it was verified.
"Verified (automated)" means exercised end-to-end against a real Postgres during
the build via API + DB assertions. "Verify on device" means the logic and UI are
in place but the final confirmation is physical (scan a QR in a banking app,
print on an 80mm roll, use the phone camera) and should be done once on the
launch device.

| # | Criterion | Where | Status |
|---|-----------|-------|--------|
| 1 | Parent completes `/signup` in Thai by default → success screen; record in admin search within seconds | `app/signup/*`, `api/public/signup`, `api/admin/search` | **Verified (automated)** — Thai names created and found by Thai search + phone |
| 2 | Quick-add child + full cash checkout in < 60s | `components/QuickAddSheet`, `components/sell/*`, `api/admin/children/quick`, `api/admin/orders` | **Verified (automated)** for the data path; the <60s is a UI target (2-field add, 2-column grid, one confirm) — time on device |
| 3 | PromptPay QR scans with the exact amount pre-filled | `api/admin/promptpay` (`promptpay-qr` + `qrcode`) | Server generates a valid EMVCo PNG with the amount embedded (checked). **Verify on device** — scan in a Thai banking app |
| 4 | All three methods block confirmation until a proof photo; photo viewable from the receipt | `components/sell/CheckoutView`, `api/admin/upload`, `api/admin/orders`, `api/admin/proof/[key]` | **Verified (automated)** — order rejected 422 without proof and with an unresolvable key; proof served only to authed admins (401 anon) |
| 5 | Receipt prints on 80mm; Save-as-image is a legible PNG | `app/admin/.../receipt/[id]`, `globals.css` `@media print`, `html-to-image` | 72mm print CSS + PNG export in place. **Verify on device** — print on the 80mm roll |
| 6 | 2 × PKG_2H_CRAYON → two independent instances | `lib/orders.ts` | **Verified (automated)** — qty 2 produced 2 separate `available` instances |
| 7 | 30h pass: start 4h → end at 3h → refund 1h → 27h remaining + audit row | `lib/sessionOps.ts` | **Verified (automated)** — deduct to 26, refund 1, land on 27; `session_ended` audit `refunded:1` |
| 8 | Timed 2h ended early offers **no** refund path | `lib/sessionOps.ts` (`endSession` pass-only), `SessionDetailClient` | **Verified (automated)** — `isPass:false`, `refunded:0`, instance → consumed; UI shows a plain end confirm, no refund stepper |
| 9 | EXTRA_1H from the session screen extends 1h on payment; from the Sell tab it creates a +1h credit | `lib/orders.ts` (`extendSessionId`), `sessionOps.redeemCredit`, `SessionDetailClient`, `SellClient` | **Verified (automated)** — immediate +1h on the running session (planned_end 07:31→08:31, `extra_hour_extended` audit); à la carte path creates the credit |
| 10 | À la carte CRAYON/CLAY → consumable credit; consuming decrements; CONSUMED at 0 | `lib/orders.ts`, `sessionOps.redeemCredit`, `components/RedeemSheet` | **Verified (automated)** — crayon instance → 0 credits → status `consumed` |
| 11 | Consuming +1 Hour blocked with no running session | `sessionOps.redeemCredit` (hard block), `PackageRow` (disabled), `api/admin/redemptions` | **Verified (automated)** — 422 without a session |
| 12 | 60h pass startable for either sibling; 30h only its bound child | `sessionOps.startSession`, `StartSheet` sibling selector | **Verified (automated)** — 60h (parent-owned) started for a sibling; 30h (child-bound) rejected for a sibling (422) |
| 13 | Dashboard shows live countdowns + red OVERDUE without manual refresh (30s poll ok) | `SessionsClient`, `components/Countdown` | Countdowns tick client-side every second, flip red past pickup, 30s poll. **Verify on device** — watch a card go overdue |
| 14 | Overview Day totals match confirmed payments; Week/Month re-aggregate; ◀ past, ▶ blocked at current | `lib/overview.ts`, `OverviewClient`, `api/admin/overview` | **Verified (automated)** — Day totals equalled the DB per-method sums; forward offset clamped to 0; yesterday = 0; week/month aggregated |
| 15 | Thai default on `/signup` and `/admin`; TH/EN toggle switches every label instantly + persists per device | `lib/i18n/*`, `LangToggle` on every app bar | Dictionary-driven, Thai default, `localStorage`-persisted. **Verify on device** — tap the pill, confirm labels + product names switch |
| 16 | Admin routes unreachable without login; `/signup` reachable without login | `src/middleware.ts`, `admin/(app)/layout.tsx` | **Verified (automated)** — `/admin/*` redirects to login, `/api/admin/*` → 401; `/signup` public |

## How the automated checks were run

A local Postgres (Docker) stood in for Neon during the build. Migrations + seed
applied cleanly; the flows above were driven through the running app's HTTP APIs
and asserted against the database (instance counts, hour balances, ownership,
audit rows, receipt numbering, per-method totals). See `DECISIONS.md` for the few
places the implementation interprets an ambiguous spec point.

## Definition of done

- `pnpm build` succeeds (24 routes) and `pnpm start` boots.
- `pnpm dev` runs against a Neon `DATABASE_URL`.
- `pnpm db:migrate` + `pnpm db:seed` create the schema and the 11 products.
