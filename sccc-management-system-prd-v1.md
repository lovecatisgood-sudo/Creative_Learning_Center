# Siamese Cat Creative Club — Management System
## PRD V1 (Launch Build)

**Status:** Final for V1 build · **Deadline:** App operational before opening day (tomorrow)
**Owner:** Eri · **Builder:** Claude Code agent
**Timezone:** Asia/Bangkok (UTC+7) everywhere. **Currency:** THB, integer satang not required — whole THB only.
**Language:** the entire app (public signup AND admin) defaults to **Thai**, with a persistent TH/EN toggle in the app bar on every primary screen (staff and parents include Thai-only and English-only readers). Implementation: a lightweight key-based dictionary (no i18n framework), `lang` persisted in localStorage per device, product names carried in both languages in the products table (`name_en`, `name_th`), dates/times formatted with the active locale (`th-TH` renders Buddhist-era years). User-entered data (names, notes) is never translated.

---

## 1. Purpose & Philosophy

An internal point-of-sale and session-management web app for a supervised children's playroom and creative activity space. One admin device (staff phone/tablet) runs the whole shop. Parents interact only through a public signup form (QR code) — they have **no login, no portal, no self-service** in V1.

**Design bias:** speed at the counter over completeness. Every admin flow must be operable one-handed on a phone with parents queuing. When in doubt, fewer taps wins.

**Explicit non-goals (V2+, do NOT build):** parent login/portal, online booking, capacity limits, per-staff accounts/permissions, promotions engine, inventory of physical materials, notifications/SMS/email, advanced reporting/exports beyond the Overview screen, direct Web-Bluetooth ESC/POS printing.

---

## 2. Tech Stack & Deployment

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) — single app serves public signup pages + admin app + API routes |
| Database | **Neon Postgres** (serverless), connection via `@neondatabase/serverless` or pooled `pg` |
| ORM | Drizzle ORM + drizzle-kit migrations |
| Styling | Tailwind CSS, mobile-first |
| Auth (admin) | Single admin credential (email + password from env), iron-session or NextAuth credentials provider, httpOnly session cookie |
| File storage | Payment-proof photos → `UPLOAD_DIR` on server disk (Hostinger VPS), served via an authenticated API route. Abstract behind a `storage.ts` module so S3 can swap in later. Client-side compress images to ≤ 1600px / ~500KB before upload. |
| PromptPay QR | `promptpay-qr` npm package → EMVCo payload with amount embedded → render with `qrcode` package |
| Receipt print | Browser `window.print()` with dedicated 80mm print CSS + "Save as image" via `html-to-image` |
| Deployment | Hostinger VPS: Node 20+, `next build && next start` under PM2, Nginx reverse proxy + HTTPS (certbot). Must also run unchanged on Vercel as fallback (hence storage abstraction). |

### Environment variables
```
DATABASE_URL=            # Neon
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=     # bcrypt
SESSION_SECRET=
PROMPTPAY_ID=            # phone number or citizen ID for QR generation
BANK_NAME=
BANK_ACCOUNT_NAME=
BANK_ACCOUNT_NUMBER=
UPLOAD_DIR=/var/sccc/uploads
NEXT_PUBLIC_TERMS_URL=
NEXT_PUBLIC_PRIVACY_URL=
NEXT_PUBLIC_SHOP_NAME="Siamese Cat Creative Club"
```

---

## 3. Users & Roles

- **Admin (staff):** logs in, does everything — register/search customers, sell, confirm payments, start/end sessions, adjust hours, view receipts and daily summary. One shared account in V1.
- **Parent:** fills the public signup form. Never logs in. Their "account" is a database record the admin operates on.

---

## 4. Product Catalog (seed data — exact)

Products are seeded via a migration/seed script and are **config, not code**. Each product row carries a `type` and a `grants` JSON describing what it delivers.

### Product types
- `TIMED_ENTRY` — fixed-duration playroom session (consumed whole, no refunds)
- `ADDON` — creative activity credit (crayon session / clay statue), no playroom time
- `BUNDLE` — one timed entry + addon credits, sold as a unit (entry consumed whole)
- `HOUR_PASS` — bank of hours + bundled addon credits, multi-visit, partial-hour-refund eligible

### Seed catalog

| SKU | Name | Type | Price (THB) | Grants |
|---|---|---|---:|---|
| ENTRY_1H | 1 Hour Entry | TIMED_ENTRY | 199 | `{hours: 1}` |
| ENTRY_2H | 2 Hours Entry | TIMED_ENTRY | 300 | `{hours: 2}` |
| EXTRA_1H | Additional 1 Hour | TIMED_ENTRY | 100 | `{hours: 1, extendOnly: true}` |
| CRAYON | Crayon Drawing Session | ADDON | 59 | `{crayonSessions: 1}` |
| CLAY | Small Soft-Clay Statue Activity | ADDON | 150 | `{claySessions: 1}` |
| PKG_1H_CRAYON | 1 Hour + Crayon Session | BUNDLE | 239 | `{hours: 1, crayonSessions: 1}` |
| PKG_1H_2CLAY | 1 Hour + 2 Small Statues | BUNDLE | 349 | `{hours: 1, claySessions: 2}` |
| PKG_2H_CRAYON | 2 Hours + Crayon Session | BUNDLE | 329 | `{hours: 2, crayonSessions: 1}` |
| PKG_2H_4CLAY | 2 Hours + 4 Small Statues | BUNDLE | 599 | `{hours: 2, claySessions: 4}` |
| PASS_30H | 30-Hour Creative Play Pass | HOUR_PASS | 3599 | `{hours: 30, crayonSessions: 5, claySessions: 3, shareable: false}` |
| PASS_60H | 60-Hour Creative Family Pass | HOUR_PASS | 5999 | `{hours: 60, crayonSessions: 10, claySessions: 6, shareable: true}` |

**Rules encoded in catalog:**
- `EXTRA_1H` never starts a standalone session. It is sellable at any time and creates an **extra-hour credit** on the child; consuming the credit extends the child's currently running session by 1 hour (`planned_end += 1h`). When sold via the session screen's "+ Add 1 hour" shortcut, it is consumed immediately on payment confirmation. Consuming requires a running session.
- À la carte `ADDON` purchases (CRAYON, CLAY) create **credit records** on the child — they are not fire-and-forget line items. Credits are consumed during a running session (soft-enforced) via the session screen or child page, decrementing the credit and writing an `addon_redemptions` + audit row.
- HOUR_PASS validity: `expires_at = purchased_at + 6 months` set automatically at purchase confirmation.
- PASS_30H is bound to **one child**. PASS_60H is bound to the **parent** and usable by any of that parent's registered children (siblings).
- Only HOUR_PASS instances support hour refunds on early pickup. Everything else is consumed once started.

---

## 5. Data Model (Drizzle / Postgres)

```
parents        id, name, phone, email, created_at, profile_complete (bool)
children       id, parent_id (nullable → fast-create), name, dob (nullable),
               gender (enum: male|female, nullable), created_at, notes
admins         id, email, password_hash
products       id, sku, name, type, price_thb, grants (jsonb), active
orders         id, created_by_admin, parent_id (nullable), child_id (nullable),
               status (draft|awaiting_payment|paid|void), total_thb, created_at
order_items    id, order_id, product_id, qty, unit_price_thb, line_total_thb
payments       id, order_id, method (promptpay|bank|cash), amount_thb,
               proof_photo_path (NOT NULL), confirmed_by_admin, confirmed_at
package_instances
               id, order_item_id, product_id, owner_child_id (nullable),
               owner_parent_id (nullable), status (available|active|consumed|expired),
               hours_total, hours_remaining, crayon_credits_remaining,
               clay_credits_remaining, extra_hours_remaining (default 0),
               expires_at (nullable), created_at
               -- NOTE: à la carte ADDON and EXTRA_1H purchases also create rows here
               -- (0 hours, credits only); status flips to consumed when all credits reach 0
sessions       id, package_instance_id, child_id, hours_booked,
               started_at, planned_end_at, ended_at (nullable),
               hours_refunded (default 0), status (running|completed)
addon_redemptions
               id, package_instance_id, child_id, type (crayon|clay|extra_hour),
               session_id (nullable), redeemed_at, admin_id
audit_log      id, admin_id, action, entity, entity_id, detail (jsonb), created_at
```

**Constraints & notes:**
- Every hour deduction, refund, credit redemption, payment confirmation, and manual adjustment writes an `audit_log` row. Non-negotiable — this is the dispute-protection layer.
- `payments.proof_photo_path` is required for **all three** methods (PromptPay slip, bank slip, photo of cash received).
- One order can produce multiple `package_instances` (qty 2 of a bundle → 2 instances, independently startable).
- `hours_remaining` mutations happen in a DB transaction with the session row change.
- Name search: `ILIKE '%term%'` across `children.name`, `parents.name`, `parents.phone`. Must handle Thai script (Postgres default UTF-8 is fine; no special collation work needed).

---

## 6. Flows & Screens

### 6.0 Admin shell
Mobile-first PWA-style layout. Bottom nav: **Sessions · Search · Sell · Today**. Login screen gates everything under `/admin`.

### 6.1 Public parent signup — `/signup` (QR target)
Bilingual labels (Thai first, English second, hardcoded strings — no i18n framework).

Fields: Parent's Name*, Contact Number*, Email, Child's Name*, Child's Date of Birth*, Child's Gender* (Male/Female), ➕ "Add another child" (repeats child fields), checkbox* "I acknowledge the Terms & Conditions and Privacy Policy" with the two links (from env).

Submit → success screen: "Registration successful — please show this screen to our staff" + parent name + child name(s). No email sent, no login created. Duplicate phone number: warn but allow (staff resolves).

### 6.2 Admin fast-create (queue-buster)
From Search or Sell screen: **"+ Quick add child"** → two fields only: Child's Name*, Contact Phone*. Creates a child with `parent_id = null` and a stub parent keyed by phone, flagged `profile_complete = false`. Checkout can proceed immediately. Incomplete profiles show a yellow badge; tapping it opens the full form to finish later (or link to an existing parent by phone match).

### 6.3 Search
Single search box → live results grouped as **Child (under Parent, phone)**. Tapping a child opens the **Child page**: profile, owned package instances (with status chips and remaining hours/credits), active session if any, order/receipt history, and buttons: *Sell*, *Start package*, *Redeem credit*.

### 6.4 Sell (cart → payment → receipt)
1. **Cart:** pick child (search or quick-add), tap products from a grid (the 11 SKUs), adjust qty, running total. `EXTRA_1H` only enabled when the child has a running/just-ended session.
2. **Checkout — choose method (tabs):**
   - **PromptPay:** full-screen QR generated with exact total embedded. Admin shows phone to parent.
   - **Bank transfer:** full-screen card with bank name / account name / account number (from env) in large copyable text.
   - **Cash:** amount due displayed large.
3. **Proof:** all three methods then require a photo — `<input type="file" accept="image/*" capture="environment">` → compress → upload. PromptPay/bank = slip photo; cash = photo of cash received.
4. **Confirm:** "Confirm payment received" button (disabled until photo uploaded) → order `paid`, package instances created (with expiry for passes), audit logged → **Receipt screen**.
5. **Receipt:** shop name, receipt number (`SCCC-YYYYMMDD-####`), date/time, child & parent, line items, total, payment method. Buttons: **Print** (`window.print`, 80mm CSS: single column, ~72mm printable width, monospaced totals) and **Save as image** (PNG download/share). Receipts reachable forever from the child page and the Today screen.

### 6.5 Start a package / timed session
From Child page: list of `available` package instances. Tap → **Start**:
- **TIMED_ENTRY / BUNDLE:** confirm dialog → session starts now, `planned_end_at = now + hours`. Instance → `active`, then `consumed` when session completes. **No refunds, no pausing.** Early pickup just ends it; late pickup shows overdue state and admin may sell `EXTRA_1H` (extends `planned_end_at` by 1h on the same session).
- **HOUR_PASS:** admin picks hours to use this visit (stepper, 1..min(remaining, 12)) → deduct immediately in the same transaction the session starts → timer runs.
- **Start screen output:** big countdown, start time, **pickup time** in large text. Buttons: *Print pickup slip* (child name, start, pickup time, package used, hours remaining if pass) and *Save as image*.

### 6.6 End session & hour refund (HOUR_PASS only)
Admin taps **End session** on a running session:
- TIMED_ENTRY/BUNDLE: session `completed`, done.
- HOUR_PASS ended early: system computes `suggested_refund = floor(hours_booked − elapsed_hours)` (whole hours, never negative). Dialog: "Refund X unused hour(s) to the pass?" Admin can lower it (0..suggested) but not raise it. Refund adds back to `hours_remaining`, sets `sessions.hours_refunded`, audit logs with before/after. Example from owner: booked 4h, picked up at 3h → suggest 1h back.
- Sessions past `planned_end_at` auto-display as **OVERDUE** (red) but nothing auto-charges; staff decision only.

### 6.7 Consume credits (crayon / clay / extra hour)
Credits come from passes, bundles, and à la carte add-on purchases. Two entry points:
- **Session detail (primary):** a "Consumables during this session" strip lists every credit the child (or their family pass) holds — crayon, clay, and +1 Hour — each with a `Consume` button. Consuming crayon/clay decrements the credit; consuming +1 Hour extends `planned_end` by 1 hour and updates the dashboard countdown. Each consumption writes `addon_redemptions` (with `session_id`) + audit log.
- **Child page:** each credit-holding instance shows `Redeem` (crayon/clay) or `Consume +1h`. Extra-hour consumption is hard-blocked without a running session; crayon/clay is soft-enforced (warn, allow override — matches "must be used during active entry time").
When an à la carte addon/extra instance reaches 0 credits its status becomes `consumed` and it displays as CONSUMED on the child page. No payment screen is involved in consumption.

### 6.8 Sessions dashboard (home screen)
All `running` sessions as cards: child name, package, start → pickup time, live countdown, **OVERDUE in red when past pickup**. Sorted soonest-pickup first. This is the screen the shop lives on.

### 6.9 Overview (transactions across any period)
Tab renamed from "Today" to **Overview**. Two controls at the top: a **Day / Week / Month** unit switcher and **◀ [period label] ▶** navigation (forward capped at the current period; weeks start Monday; all boundaries computed in Asia/Bangkok). For the selected period it shows: totals per method (cash / PromptPay / bank) and grand total; counts of orders, sessions started, and credits consumed (from `addon_redemptions`); and the full order list (time — with date shown for week/month views — child, items, method, amount, → receipt). Defaults to Day / today. Labels localize ("Today/วันนี้", "Yesterday/เมื่อวาน", "This week", month names). Print/save summary buttons use the receipt CSS. Data comes from a single range query on `payments.confirmed_at`; no pre-aggregation tables in V1.

---

## 7. Business Rules — single source of truth

1. Creative add-ons never add playroom time.
2. TIMED_ENTRY and BUNDLE sessions are consumed once started — no partial refunds ever.
2b. Add-on purchases (CRAYON, CLAY, EXTRA_1H) always create trackable credits; nothing paid-for is untracked. Extra-hour credits require a running session to consume; consumption extends that session's planned end.
3. Only PASS_30H and PASS_60H support early-pickup hour refunds, whole hours, admin-confirmed, capped at the system suggestion.
4. PASS_30H → one child. PASS_60H → parent-level, any sibling; each session still records which child used it.
5. Passes expire 6 months after purchase; expired instances show `expired` and cannot start sessions or redeem credits (data retained).
6. All payments require photo proof before confirmation.
7. Every state change touching money, hours, or credits → audit log.
8. Multiple purchased instances of the same product are independent — starting one leaves the others `available`.
9. Nothing is auto-charged on overdue; staff acts manually.

---

## 8. Acceptance Criteria (launch gate)

- [ ] Parent completes `/signup` on a phone via QR **in Thai by default**, sees success screen; record visible in admin search within seconds.
- [ ] Quick-add child + full checkout (cash) completable in under 60 seconds on a phone.
- [ ] PromptPay QR scans in a Thai banking app with the exact amount pre-filled.
- [ ] All three payment methods block confirmation until a proof photo is uploaded; photo viewable from the receipt afterward.
- [ ] Receipt prints correctly on 80mm paper via the phone's native print dialog; Save-as-image produces a legible PNG.
- [ ] Buying 2 × PKG_2H_CRAYON yields two independent instances; starting one leaves the other available.
- [ ] 30h pass: start 4h → end at 3h → refund suggestion 1h → accept → 27h remaining, audit row exists.
- [ ] Timed 2h entry ended early offers **no** refund path.
- [ ] EXTRA_1H sold from the session screen extends pickup time by 1h immediately on payment; EXTRA_1H sold from the Sell tab creates a +1 Hour credit that, when consumed from the session screen, extends the running timer by 1h.
- [ ] À la carte CRAYON/CLAY purchase creates a consumable credit visible on the child page and in the running session's consumables strip; consuming decrements it, and the instance shows CONSUMED at 0 credits.
- [ ] Consuming a +1 Hour credit is blocked when the child has no running session.
- [ ] 60h pass purchased under a parent is startable for either of two registered siblings; 30h pass only for its bound child.
- [ ] Sessions dashboard shows live countdowns and turns overdue cards red without a manual refresh (poll every 30s is acceptable).
- [ ] Overview (Day, today) totals match the sum of the day's confirmed payments per method; switching to Week and Month re-aggregates correctly, ◀ navigates to past periods (yesterday, last week, last month) and ▶ is blocked beyond the current period.
- [ ] The app loads in Thai by default on both /signup and /admin; the TH/EN toggle switches every label (including product names and Overview period labels) instantly and persists across reloads on the same device.
- [ ] Admin routes unreachable without login; public `/signup` reachable without login.

---

## 9. Owner-supplied config checklist (Eri, before deploy)

- [ ] PromptPay ID (phone or citizen ID)
- [ ] Bank name, account name, account number
- [ ] Terms & Conditions URL, Privacy Policy URL
- [ ] Admin email + password
- [ ] Neon `DATABASE_URL`
- [ ] Hostinger VPS SSH access, domain/subdomain for the app (QR code will point at `https://<domain>/signup`)
- [ ] Shop logo (optional; text header is fine for V1)
