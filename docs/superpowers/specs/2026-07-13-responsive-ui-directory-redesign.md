# Responsive UI + Directory Redesign — Design

**Date:** 2026-07-13
**Status:** Design, pending owner review
**Depends on:** existing SCCC app (Next.js 14, Tailwind, Thai-default i18n)

## 1. Purpose

Two problems the owner reported:
1. **Every screen wastes vertical space and forces scrolling** even when content is short. The app is currently a fixed 480px phone-width column, so on a tablet it's a skinny centered strip with empty sides. Make the whole app **responsive across all mobile screens (phone → tablet, both orientations)**, and tighten layouts so a page fits one screen when its content allows.
2. **The search screen is empty until you type.** It should instead show a **browsable directory of everyone**, so staff can page through by name or filter — and immediately see which children still have no parent registered.

The frontend-design skill guides the visual execution during implementation.

## 2. Confirmed decisions (from owner)

- **Responsive for all mobile screens** (phones and tablets, portrait + landscape) — not a fixed tablet layout.
- Admin pages: **tighten wasted space; paginate long lists** (page 1/2/3) rather than long scroll.
- Signup form: **fits one phone screen** for the default 1-child state; only adding a 2nd+ child scrolls.
- Search: **parent-grouped directory**, **orphan children (no parent) pinned on top**, **parents alphabetical**, **~10–12 parent-groups per page** with Prev/Next + page numbers; the search bar filters the same list.
- **New Parent detail page**; tapping a parent → Parent page, tapping a child → Child page.

## 3. Scope

### In scope
- Responsive layout foundation for the admin app (replace the fixed 480px column with a fluid, breakpoint-based shell).
- New **directory API** (paginated, parent-grouped, orphans-first, searchable).
- **Search page** rebuilt as the directory browser.
- New **Parent detail page** (`/admin/parent/[id]`).
- **Signup form** compacted to fit one phone screen at 1 child.
- **Tighten + paginate** the remaining admin pages: Sessions, Sell, Overview, Child, Session, Receipt.
- **PromptPay QR:** display larger on the payment screen; tap → full-screen lightbox for the parent to scan; tap outside to close.
- **Receipt:** show the legal entity **Siamese Cat Cafe Co., Ltd.** (the company behind Siamese Cat Creative Club), and make the receipt **bilingual (Thai + English together)** so both readers can read it regardless of the app-language toggle.

### Out of scope
- No change to business logic, money/hours/credits rules, DB schema (except read-only query additions; no column changes anticipated).
- No new languages; keep Thai-default i18n. All new strings go in `dictionary.ts`.
- Landing page and deploy config unchanged.

## 4. Design

### 4.0 Responsive foundation (do first)
- Replace the hard 480px `.app-frame` (in `globals.css`) for the **admin** subtree with a fluid container: comfortable max-width that grows with the viewport (e.g. content column ~640px on phones, widening to ~960–1100px on tablets) and full-bleed padding that scales. **Signup keeps the 480px phone column** (`src/app/signup/layout.tsx` unchanged).
- Approach: a new `.admin-frame` (or Tailwind responsive classes on the admin layout) using breakpoints — base = single column full-width with padding; `md:`/`lg:` = wider container, multi-column grids where a page benefits.
- `AppBar` and `BottomNav` adapt: bottom nav stays thumb-reachable on phones; on tablets it may become a wider bar (still bottom, per existing UX) — keep nav semantics identical, only the sizing responsive.
- Touch targets stay ≥44–48px (existing `.field`/`.btn-*` conventions).
- Everything below is restyled **inside** this responsive shell.

### 4.1 Directory API (new)
A single endpoint powering the search page. `GET /api/admin/directory?q=&page=`:
- **Grouping:** returns **parent groups** (parent + their children) plus a special **"no parent" group** of orphan children (`children.parentId IS NULL`).
- **Ordering:** the orphan group is **always first**; parent groups follow, **sorted alphabetically by parent name** (Thai/EN via default text collation, matching existing ILIKE search).
- **Pagination:** page size = **12 groups per page** (tunable constant). Response includes `page`, `totalPages`, `totalGroups`.
- **Search (`q`):** when present (≥1 char), filter to groups where the parent name, any child name, or phone matches (ILIKE `%q%`); same grouping/order/pagination. Orphan children matching `q` stay in the top group.
- Each child carries its `hasRunningSession` flag (green dot) as today. Each parent carries phone + `profileComplete`.
- Reuses the existing `requireAdminId()` guard. Read-only; no schema change.
- Implemented in a new `src/lib/directory.ts` (query + grouping + pagination), called by the thin route handler — matches the repo's lib/route split.

### 4.2 Search page (rebuilt)
`SearchClient.tsx` becomes a **directory browser**:
- On load (no query) it **fetches page 1 of the directory** and renders it — never empty.
- **Layout:** grouped list. Each group = a **parent row (primary)** with the parent's **children nested beneath**. The **orphan group** renders first with a clear label (e.g. "ยังไม่มีผู้ปกครอง / No parent registered yet") so staff can follow up.
- **Parent row** → navigates to the Parent page. **Child row** → Child page (as today). **Orphan child row** → Child page (where the existing complete-parent flow lives).
- **Search bar** (top, sticky) filters live (debounced) via `?q=`; clearing it returns to the full directory.
- **Pagination controls** (bottom, sticky): `‹ Prev  1 2 3 …  Next ›`, showing `page/totalPages`. Resets to page 1 on a new query.
- Running-session green dot preserved. Responsive: single column on phones; on tablets the directory can use the extra width (larger rows / two-column groups) per frontend-design.
- Keep the existing **Quick-add** entry point (`QuickAddSheet`) available from this screen.

### 4.3 Parent detail page (new)
`src/app/admin/(app)/parent/[id]/page.tsx` (+ client), route `/admin/parent/[id]`:
- **Header:** parent name, phone, email, `profileComplete` status chip.
- **Children:** list of the parent's children, each a row → Child page (name, age/DOB, running-session dot).
- **History:** the parent's orders/receipts (reuse the same data the Child page uses, aggregated at parent level) → receipt pages.
- Actions consistent with existing patterns (e.g. edit/complete profile if such a flow exists at parent level — reuse existing sheets, don't invent new mutations).
- Server component fetches via a `src/lib/parents.ts` (or extend `children.ts`) + a `*Client.tsx` for interactivity, matching repo conventions.
- Fits the responsive shell; no forced scroll for a typical parent (few children).

### 4.4 Signup form (one phone screen)
`src/app/signup/page.tsx`:
- Compact the default (1-child) form so parent block + one child block + consent + submit fit a common phone (target ~360×640 safe floor) **without scrolling**.
- Techniques: tighter vertical rhythm, smaller section headers, 2-up field rows where sensible (e.g. DOB + gender side by side), a compact consent line, sticky submit. Keep ≥44px touch targets and existing validation.
- **Adding a 2nd+ child** grows the form and is the only case that scrolls (acceptable per owner).
- All existing fields, validation, i18n, and the POST payload stay identical.

### 4.5 Tighten + paginate remaining admin pages
For **Sessions, Sell, Overview, Child, Session, Receipt**:
- Remove wasted vertical space (oversized paddings/headers) so short-content pages fit one screen in the responsive shell.
- **Paginate long lists** with the same Prev/Next + page-number pattern as the directory:
  - **Sessions:** running-session cards — grid on tablets, paginated when they exceed one screen.
  - **Overview:** the order list — paginated (period totals/counts stay pinned above).
- Use responsive grids on tablets (e.g. session cards 2–3 across) collapsing to one column on phones.
- No change to the underlying data/logic; presentation + a client-side (or server `?page=`) pagination layer only.

### 4.6 PromptPay QR — larger + full-screen lightbox
- On the payment screen (`src/components/sell/CheckoutView.tsx`), the shop QR (`public/promptpay.jpg`) currently renders at `h-72 w-72` — too small. Enlarge it (e.g. up to ~min(80vw, 380px)) so it's comfortably scannable, amount still shown beneath.
- **Tap the QR → full-screen lightbox** (dark backdrop, QR centered large, like opening an image in a chat app) so staff can hand/turn the device to the parent. **Tap the backdrop (outside the QR) → close.** Also close on Esc. Lightbox is a client overlay; no new dependency.

### 4.7 Receipt — entity name + bilingual
- **Entity name:** add **Siamese Cat Cafe Co., Ltd.** to the receipt header (under the "Siamese Cat Creative Club" brand line). Source it from a new `NEXT_PUBLIC_COMPANY_NAME` env var (default `"Siamese Cat Cafe Co., Ltd."`), mirroring how `NEXT_PUBLIC_SHOP_NAME` is used, so it's configurable. Add it to `.env` / docs. (If the company later has a registered Thai name, it can be added the same way.)
- **Bilingual receipt:** the printed/saved receipt must show **both Thai and English together**, independent of the app-language toggle — every label as a `TH / EN` pair (e.g. `เลขที่ / No.`, `รายการ / Items`, `รวม / Total`, `ชำระโดย / Paid by`, `ขอบคุณ / Thank you`), and product lines show **both** `name_th` and `name_en`. Keep it compact for the 72mm print width. This affects `ReceiptClient.tsx` and the receipt strings only; the `.receipt-ticket` print CSS structure stays intact (it may need minor width/size tuning for the extra text).

## 5. Visual / frontend-design principles
- **Reuse the existing brand system** (tokens in `tailwind.config.ts`, Baloo 2, existing `.field`/`.btn-*`/`.chip`). This is a responsive reshape, not a rebrand.
- Establish a small set of **responsive layout primitives** (container, grid, list-group, pagination control) reused across pages for consistency.
- Density tuned per breakpoint; touch-first; Thai + English both must fit (Thai runs longer — test both).
- frontend-design skill invoked at implementation time to guide typography scale, spacing rhythm, and the grid/pagination components so it reads as one intentional system.

## 6. Verification (no unit-test harness; drive the app)
- Directory API: with seeded + test data, page 1 shows orphan group first then alphabetical parents; `q` filters; `totalPages` correct; orphan children with null parent appear on top.
- Search page: loads non-empty; grouping parent→children correct; Prev/Next + page numbers work; taps route to Parent/Child pages; green dots correct.
- Parent page: renders a parent's children + history; links work.
- Signup: on a ~360–667px phone viewport, the 1-child form fits with no scroll; adding a child scrolls; submit still works end-to-end.
- Responsiveness: each admin page checked at phone (~390px) and tablet portrait (~810px) and landscape (~1080px) — no wasted-space scroll on short content; long lists paginate.
- Regression: existing flows (register → sell → pay → session, overview totals) still pass (WALKTHROUGH.md).
- Both languages (TH default + EN) fit without overflow.

## 7. Build order (each reviewed before the next)
1. **Responsive foundation** (shell) — everything sits inside it.
2. **Directory API + Search page + Parent page** (the primary ask).
3. **Signup** one-screen.
4. **Tighten + paginate** Sessions, Sell, Overview, Child, Session, Receipt.

## 8. Open item to confirm during build
- Exact per-page group count (starting at 12) and tablet container max-width will be tuned visually against a real device during implementation.
