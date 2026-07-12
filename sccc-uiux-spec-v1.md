# SCCC Management System — UI/UX Spec V1

Companion to `sccc-management-system-prd-v1.md`. This document defines every screen, its layout zones, and the navigation between them. Claude Code should treat this as the UI source of truth; the PRD remains the source of truth for business rules.

---

## 1. Design system (deliberately minimal)

- **Frame:** mobile-first, designed at 390px. Admin app is a bottom-tab shell; public signup is a single scrolling page.
- **Tap targets:** minimum 48px height. Primary action is always a full-width button pinned near the bottom of the screen.
- **Type:** system font stack. Three sizes only — 24px bold (screen titles, money totals, countdowns get 40px+), 16px (body/inputs), 13px (labels/meta).
- **Color tokens (derived from the circle logo):**
  - `paper` #FBF1DE cream background · `card` #FFFAF0 · `ink` #33200D · `meta` #8A6F52 · `line` #E8D9BC
  - `brown` #5F2B00 app bars / nav (logo wood) · `cream` #FAD290 text on brown (logo "CAT CLUB" lettering)
  - `amber` #E98C1D primary buttons (logo crown/pencils), with dark-brown text #3A1E00
  - `teal` #3FD0A7 interactive accents — active nav tab, active method-tab underline, focus rings, live-session borders and chips (logo "SIAMESE" lettering, eyes, paint)
  - `tealdeep` #1F8A6B pickup-time hero, steppers · `ok` #2D7F5A confirmations (logo canvas cat)
  - `warn` #B7791F incomplete profiles, expiring passes
  - `danger` #D6452A OVERDUE, destructive confirms
- **Type note:** rounded display family (e.g. Baloo 2) with system fallback, matching the badge's friendly lettering.
- **Logo usage:** circle badge small in every app bar; hero-size on login, signup, and pickup slips.
- **Status chips** (used everywhere a package or session appears): `AVAILABLE` gray · `ACTIVE` green · `CONSUMED` gray strikethrough · `EXPIRED` red outline · `OVERDUE` solid red.
- **Language:** **Thai is the default** for both the public signup and the admin app. Every primary app bar carries a compact TH/EN pill toggle (shows the *other* language: "EN" when in Thai, "ไทย" when in English); switching re-renders the current screen instantly and persists per device. Product names, statuses, chips, toasts, and period labels all localize; user-entered names never do.

---

## 2. Navigation map

```
PUBLIC (no auth)
└── /signup ──submit──▶ /signup/success

ADMIN (auth wall at /admin/login)
└── Bottom tabs: [Sessions] [Search] [Sell] [Overview]
    ├── Sessions (home, default after login)
    │     └── Session card ▶ Session detail ▶ End session (refund dialog if pass)
    │                                       ▶ Sell EXTRA_1H (jumps to Sell with cart preloaded)
    ├── Search
    │     ├── result ▶ Child page
    │     │            ├── Start package ▶ Start config ▶ Session started (pickup slip)
    │     │            ├── Redeem credit ▶ confirm sheet
    │     │            ├── Sell ▶ (Sell tab with child preselected)
    │     │            ├── Receipt history ▶ Receipt
    │     │            └── Edit / complete profile
    │     └── [+ Quick add child] modal ▶ Child page
    ├── Sell
    │     └── Cart ▶ Checkout (PromptPay | Bank | Cash tabs)
    │              ▶ Proof photo ▶ Confirm ▶ Receipt
    │              └── Receipt ▶ [Start now?] shortcut ▶ Start config
    └── Overview (Day / Week / Month, ◀ ▶ period navigation)
          └── order row ▶ Receipt
```

Rule: after payment confirmation, the Receipt screen offers **"Start a package now"** if the order contains startable items — this collapses the most common walk-in flow (pay → start → hand back phone) into one path.

---

## 3. Public parent screens

### P1 — Signup form (`/signup`, QR target)
Single scroll column, generous spacing (parents on phones, possibly holding a child).

1. Header: shop logo/name + one line: "ลงทะเบียนสมาชิก / Member registration".
2. **Parent section** (card): Parent's name*, Contact number* (tel keypad), Email (optional).
3. **Child section** (card, repeatable): Child's name*, Date of birth* (native date picker), Gender* — two large toggle buttons `ชาย Male` / `หญิง Female`.
4. `+ เพิ่มบุตร / Add another child` ghost button duplicates the child card (with a remove ✕).
5. Consent row: checkbox* + "ข้าพเจ้ายอมรับ ข้อกำหนดและเงื่อนไข และ นโยบายความเป็นส่วนตัว / I acknowledge the Terms & Conditions and Privacy Policy" — the two document names are links (env URLs), opening in a new tab.
6. Full-width `ลงทะเบียน / Register` button. Inline validation, error text under the offending field, never a toast-only error.

### P2 — Success (`/signup/success`)
Big check icon, "ลงทะเบียนสำเร็จ / Registration successful", then: "กรุณาแสดงหน้าจอนี้ให้พนักงาน / Please show this screen to our staff", followed by parent name + registered child names in large text (staff reads this to find the record). No further actions. Do not auto-redirect.

---

## 4. Admin screens

### A0 — Login (`/admin/login`)
Logo, email, password, `Log in`. Error state: "Email or password is incorrect." Nothing else on the page.

### A1 — Sessions (home tab)
The shop's default screen; lives on the counter.

- Title row: "Sessions" + live clock.
- Vertical list of **session cards**, sorted by soonest pickup:
  - Row 1: child name (bold) · package short-name chip.
  - Row 2: `Start 13:05 → Pickup 15:05` and a **large countdown** `1:23:45` right-aligned.
  - Overdue: whole card border + countdown turn `danger` red, label `OVERDUE +0:12`.
  - Tap anywhere ▶ Session detail.
- Empty state: "No children checked in. Start a package from a child's page."
- Poll every 30s; countdowns tick client-side every second.

### A2 — Search tab
- Search input autofocused, placeholder "Child, parent, or phone…". Live results after 2 characters.
- Result rows grouped visually: **Child name** (bold) / under it "Parent · phone" in meta gray. Yellow `PROFILE INCOMPLETE` chip when applicable. Green dot if the child has a running session.
- Sticky footer button: `+ Quick add child`.

### A2b — Quick add child (modal sheet)
Two fields: Child's name*, Contact phone*. `Create & open` button. On save ▶ Child page with the yellow incomplete chip. Creation takes ≤10 seconds by design; no other fields allowed on this sheet.

**Parent details are deliberately deferred.** A fast-created child can be sold to and checked out immediately with no parent record. The child page shows a yellow banner — "No parent details yet · ＋ Add parent details" — which opens a sheet (Parent's name*, Email, child DOB, gender, or *Link to existing parent by phone*). Staff completes this **after** checkout, once the queue clears. Saving flips `profile_complete = true`; linking by phone merges the stub into the matched parent.

### A3 — Child page
Header: child name, age (from DOB, blank if fast-created), parent name + phone (tappable to call), `Edit` link. Yellow banner if profile incomplete: "Tap to complete profile / link parent".

Sections, in order:
1. **Active session** (only if running): mini version of the session card ▶ Session detail.
2. **Packages** — list of owned instances: name, status chip, and for passes `hrs 23/30 · crayon 4 · clay 2 · exp 12 Jan 27`. Each `AVAILABLE`/`ACTIVE` pass row has a `Start` button; rows holding credits show `Redeem` (crayon/clay) or `Consume +1h` (extra-hour credits, blocked without a running session). À la carte add-on credits appear here too and remain visible with a gray `CONSUMED` chip once used.
   - 60h family passes appear on **every sibling's** child page, labeled `FAMILY`.
3. **History** — reverse-chron receipts and completed sessions, each row ▶ Receipt / session record.

Sticky footer: primary `Sell` (opens Sell tab with this child preselected).

### A4 — Sell tab (cart)
- Top: selected-child bar — "Selling to: **[child]** (parent)" with `Change` ▶ inline search + `+ Quick add`. Selling is blocked until a child is chosen.
- **Product grid**, 2 columns, grouped by section headers exactly matching the price list: *Entry*, *Creative add-ons*, *Packages*, *Play passes*. Each tile: name, price. Tap = add (badge shows qty); long-press or tap badge = stepper.
- Add-on tiles (`CRAYON`, `CLAY`, `EXTRA_1H`) are always sellable and carry a small caption ("consume during play" / "consume on a running timer") — payment creates a consumable credit on the child rather than an untracked line item.
- Sticky footer: `3 items · 947 THB — Checkout ▶`.

### A5 — Checkout
- Order summary (collapsed, expandable) + total in 40px.
- **Method tabs:** `PromptPay` | `Bank transfer` | `Cash`.
  - *PromptPay:* full-width QR with amount embedded, caption "Scan to pay 947 THB". 
  - *Bank:* bank name, account name, account number in large text with a copy button.
  - *Cash:* "Collect **947 THB**" in huge type.
- **Proof step** (identical for all tabs): dashed photo drop-zone `📷 Take photo of slip / cash` → opens camera → thumbnail preview with retake ✕.
- Footer: `Confirm payment received` — disabled until photo uploaded; turns green when armed. Confirm shows a 1-tap re-confirm sheet ("947 THB via Cash — confirm?") to prevent misfires.

### A6 — Receipt
80mm-styled ticket rendered on screen: shop name, receipt no. `SCCC-20260713-0042`, datetime, child + parent, line items with qty/price, total, payment method, proof-photo thumbnail (tappable full-screen; not included in print).
Buttons: `Print` (window.print) · `Save as image` · and if the order contains startable packages: primary `Start a package now ▶`.

### A7 — Start config
Reached from Child page `Start` or Receipt shortcut.

- *TIMED_ENTRY / BUNDLE:* card shows package name and duration; confirm sheet: "Start 2-hour session for **[child]** now? Pickup at **15:05**." → `Start session`.
- *HOUR_PASS:* hour **stepper** `− [ 4 ] +` (1..min(remaining,12)), live preview "Pickup at 17:05 · 26 hrs will remain". For a family (60h) pass, a sibling selector row appears first.
- On start ▶ A8.

### A8 — Session started / pickup slip
Full-screen confirmation designed to be shown or printed for the parent:
child name · package · `Start 13:05` · **`Pickup 15:05`** (huge) · hours remaining if pass.
Buttons: `Print pickup slip` · `Save as image` · `Done` (▶ Sessions tab).

### A9 — Session detail & end
Opened from a session card. Shows the A8 info plus live countdown.
Below the countdown, a **"Consumables during this session"** strip lists every credit the child holds (own add-ons + bundle/pass credits + family-pass credits): `⏱ +1 Hour · 1 left [Consume]`, `🖍 Crayon session · from 30H PASS · 4 left [Consume]`, `🗿 Clay statue · 2 left [Consume]`. Consuming crayon/clay decrements with a toast; consuming +1 Hour extends the pickup time in place and re-sorts the dashboard.

Actions:
- `+ Add 1 hour (100 THB)` ▶ Sell flow with EXTRA_1H preloaded; on payment, pickup time extends in place immediately (no separate consume step for this shortcut).
- `End session`:
  - Timed/bundle: confirm sheet "End session for [child]?" → done.
  - Hour pass ended early: **refund sheet** — "Booked 4h · used 3h 02m. Refund **1** unused hour to the pass?" with a stepper capped at the suggestion (down to 0) and a required tap on `Confirm end + refund 1h`. Result toast: "27 hrs remaining on pass."
  - Overdue end: banner "Session ran 22 min over — consider selling Additional 1 Hour" (informational only; no auto-charge).

### A10 — Redeem credit (sheet)
From Child page `Redeem`: pick credit type (crayon/clay) from instances with credits; confirm sheet "Use 1 clay statue credit from 30-Hour Pass? 2 will remain." If the child has no running session, show a warning line "No active session — add-ons are normally used during play time" with `Redeem anyway`.

### A11 — Overview tab (formerly "Today")
- **Unit switcher** (segmented tabs): `Day | Week | Month`, defaulting to Day.
- **Period navigator:** `◀  [label]  ▶` — label reads "Today · 12 Jul" / "Yesterday · 11 Jul" / a weekday-date, "This week · 6 Jul – 12 Jul", or "This month · July". ▶ disabled at the current period; ◀ goes back indefinitely. Weeks start Monday, all in Asia/Bangkok.
- **Totals strip:** Cash · PromptPay · Bank · **Total** (bold), aggregated over the selected period.
- Counts row: "12 orders · 9 sessions started · 5 credits consumed" for the period.
- Order list for the period: time (with date in week/month views) · child · items summary · method icon · amount ▶ Receipt. Empty state: "No transactions in this period."
- `Print summary` / `Save as image` footer.

---

## 5. Flow variations (end-to-end walkthroughs)

**V1. Brand-new walk-in, queue behind them (fast lane)**
Search tab ▶ `+ Quick add child` (name + phone, 10s) ▶ Child page ▶ `Sell` ▶ tap `2H + Crayon` ▶ Checkout ▶ Cash ▶ photo of cash ▶ Confirm ▶ Receipt ▶ `Start a package now` ▶ confirm ▶ show pickup slip. **Target: under 90 seconds.** Profile completed later from the yellow badge (or parent scans QR from their seat in the café).

**V2. New family, self-registered**
Parent scans QR at the door ▶ P1 ▶ P2 success screen shown to staff ▶ staff searches the name ▶ Child page ▶ Sell → identical from there.

**V3. Returning pass family**
Search child ▶ Child page shows `30H PASS · 23 hrs` ▶ `Start` ▶ stepper to 4h ▶ pickup slip. No payment screens touched at all.

**V4. Early pickup on a pass**
Sessions tab ▶ tap card ▶ `End session` ▶ refund sheet suggests 1h ▶ confirm ▶ pass back to 24h, audit logged.

**V5. Parent is late**
Card turns red OVERDUE on Sessions tab ▶ open ▶ `+ Add 1 hour` ▶ Cash 100 THB ▶ photo ▶ confirm ▶ pickup time extends.

**V6. Crayon add-on mid-play, paid à la carte**
Search child ▶ `Sell` ▶ `Crayon Session 59` ▶ PromptPay ▶ slip photo ▶ confirm. (If they own credits instead: Child page ▶ `Redeem` — zero payment.)

**V7. Sibling using the family pass**
Search either sibling ▶ Child page shows the `FAMILY` 60h pass ▶ `Start` ▶ sibling selector defaults to this child ▶ hours deducted from the shared pool.

**V8. End of day & lookback**
Overview tab (Day/today) ▶ verify Cash total against the drawer ▶ Print summary. Owner review: switch to Month ▶ ◀ to last month ▶ compare totals.
