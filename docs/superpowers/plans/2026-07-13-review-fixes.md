# Product-Review Fixes + Optimizations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. UI/visual tasks additionally require **frontend-design**. Steps use `- [ ]`.

**Goal:** Fix every bug found in the 2026-07-13 product review (3 Medium, 8 Low) and apply the accessibility/UI-UX optimizations (contrast, touch targets, keyboard, `lang`, focus states, legibility), without changing business logic or the money/print behavior.

**Architecture:** Targeted fixes across API routes (`orders`, `sessions/*/end`, `overview`), the signup page, sell UI, the i18n/`lang` wiring, and the Tailwind color tokens. Each fix is independently verifiable by driving the app against the local Docker DB; visual/a11y fixes use headless-browser measurement.

**Tech Stack:** Next.js 14, TypeScript, Tailwind (existing tokens), Drizzle/pg, existing i18n.

## Global Constraints
- **No business-logic / money / schema changes.** Amounts, refund formula (`booked − floor(elapsed)`), receipt-number logic, transactions, audit writes, and the `.receipt-ticket` print output stay identical. Fixes are error-handling, validation, UI, and styling only.
- **No hardcoded display text** — new strings go in `src/lib/i18n/dictionary.ts` (TH+EN), rendered via `t()`. Thai default.
- **Every admin API route keeps `requireAdminId()`.**
- **Client/server split** preserved; `import type` for types; no db module in client files.
- **Reuse brand system** (tokens, Baloo 2, `.field`/`.btn-*`/`.chip`). Accessibility fixes must keep the warm/playful brand — darken only what's needed to pass WCAG AA.
- **No unit-test harness** — verify by `pnpm build` + driving `pnpm dev`/`start` against `sccc-pg` (`.env.local`, admin `admin@siamesecatclub.com`/`hunter2sccc`). Kill dev servers by exact PID; don't run dev+build on same `.next` concurrently.
- **pnpm v11** (`pnpm-workspace.yaml` `allowBuilds:false`).
- **OUT OF SCOPE (working-as-designed, not bugs — do NOT change without owner sign-off):** the parent-grouped directory design, family-view sibling display, EXTRA_1H API-level gating, quick-add stub-parent creation. These are documented decisions.

---

### Task 1: Order reliability — proper error surfacing + retry + EXTRA_1H extend feedback

**Files:** `src/app/api/admin/orders/route.ts`, `src/lib/orders.ts`, `src/components/sell/CheckoutView.tsx`, `src/lib/i18n/dictionary.ts`

**Fixes:** Review Medium #1 (receipt-number retry exhaustion → bodyless 500 mislabeled "proof required"), Low #5 (EXTRA_1H silent extend failure).

- [ ] **Step 1: Return proper JSON for non-OrderError failures (route)**
In `src/app/api/admin/orders/route.ts`, the final `catch` rethrows anything that isn't `OrderError`, producing a bodyless 500 the client misreads. Change it to return structured JSON so the client can distinguish:
```ts
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("createPaidOrder failed:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
```

- [ ] **Step 2: Harden the receipt-number retry (lib)**
In `src/lib/orders.ts` (the retry loop around the 23505 unique-violation, ~line 108): raise the retry count from 3 to 6 and add a tiny jittered backoff between attempts to de-collide concurrent inserts. Since `Date.now()`/`Math.random()` are fine at runtime in the app (only the workflow sandbox forbids them), use `await new Promise(r => setTimeout(r, 15 + Math.floor(Math.random()*40)))` between retries. Keep the receipt-number computation and the unique-index backstop unchanged — this only reduces the chance of exhausting retries.

- [ ] **Step 3: Surface EXTRA_1H extend outcome**
In `src/lib/orders.ts`, the extend-on-payment path (`if (sess && sess.status === "running" && sess.childId === child.id)`) silently no-ops when the session isn't running. Track whether the requested `extendSessionId` extension actually applied and include it in the returned result, e.g. add `extendRequested: boolean` and `extendApplied: boolean` to the `createPaidOrder` return. In `CheckoutView.tsx`, after `onConfirmed`, if `extendSessionId` was set but `extendApplied === false`, show a non-blocking note (a new dict key `extendNotApplied: { th: "ไม่สามารถต่อเวลาได้ (เซสชันสิ้นสุดแล้ว) — เพิ่มเป็นเครดิตแทน", en: "Couldn't extend (session ended) — added as a credit instead" }`). Do NOT change money behavior — the credit is still created; this only informs staff.

- [ ] **Step 4: Verify**
`pnpm build`. Then drive the DB: (a) fire ~6 concurrent `POST /api/admin/orders` for the same child/day (with a valid uploaded proof) and confirm any failure now returns `{"error":"server_error"}` with status 500 (not bodyless) and the client would show a real message, and that with the raised retry the collisions mostly succeed; (b) confirm a normal single sale still returns `{ok:true, extendApplied:...}`; (c) an order with `extendSessionId` pointing at a completed session returns `extendApplied:false` and still creates the credit. No duplicate receipt_no; orders==payments.

- [ ] **Step 5: Commit** — `git commit -m "Order reliability: proper 500 JSON, hardened receipt-no retry, EXTRA_1H extend feedback"`

---

### Task 2: Signup — surface server errors, add validation, fix legibility

**Files:** `src/app/signup/page.tsx`, `src/app/api/public/signup/route.ts`, `src/lib/i18n/dictionary.ts`

**Fixes:** Medium #2 (errors swallowed), Low #7-signup (generic error), Low #8 (phone/DOB validation), a11y #16 (10–11px fonts).

- [ ] **Step 1: Render server/form errors**
`errors.form` is set on a failed POST but never rendered. Add a visible error banner near the submit button that renders `errors.form` when present. Also, when the API returns an error body, set `errors.form` to the server's message (fall back to a generic `t("signupFailed")`). Add `signupFailed: { th: "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่", en: "Registration failed, please try again" }`.

- [ ] **Step 2: Phone + DOB validation (client AND server)**
Client (`validate()` in `page.tsx`): phone must be a plausible number (e.g. `/^[0-9+\-\s]{6,20}$/` and contain ≥6 digits) → error key `invalidPhone`; each child DOB must not be in the future → error key `dobFuture`. Server (`src/app/api/public/signup/route.ts`): mirror both checks and return 422 with a clear message if violated (keep the existing required-field checks). Add dict keys `invalidPhone: { th:"เบอร์โทรไม่ถูกต้อง", en:"Invalid phone number" }`, `dobFuture: { th:"วันเกิดต้องไม่เป็นอนาคต", en:"Date of birth can't be in the future" }`.

- [ ] **Step 3: Legibility (frontend-design)**
Invoke **frontend-design**. Raise the sub-12px text — field labels, error messages, and especially the legal Terms/Privacy consent links — to **≥12px** (13px preferred for labels/errors; the consent links should be clearly legible). Keep inputs at 16px (avoids iOS zoom). It is acceptable if the 1-child form now needs a little scroll on a 360×640 phone — **legibility for a legal/registration form outweighs the strict one-screen fit**; keep the fixed submit bar so the CTA is always reachable. Keep every field, validation, i18n, and the POST body identical.

- [ ] **Step 4: Verify**
`pnpm build`. Drive `/signup`: submit a valid registration → success; force a server error (e.g. temporarily unreachable — or POST an invalid body via curl) → the error banner shows a real message; `phone:"abc"` and a future DOB are rejected client-side and via curl to `/api/public/signup` (422). Headless-measure that labels/errors/consent are now ≥12px at 360×640; both TH+EN legible.

- [ ] **Step 5: Commit** — `git commit -m "Signup: surface errors, validate phone/DOB, raise sub-12px text for legibility"`

---

### Task 3: API robustness — numeric guards

**Files:** `src/app/api/admin/sessions/[id]/end/route.ts` (+ a quick defensive sweep of other admin routes)

**Fix:** Medium #3 (malformed `refundHours` → 500, session stuck running).

- [ ] **Step 1: Guard refundHours**
In `sessions/[id]/end/route.ts`: `const refundHours = body?.refundHours != null ? Number(body.refundHours) : undefined;` — add: if `body?.refundHours != null && !Number.isFinite(Number(body.refundHours))` return `NextResponse.json({ error: "Bad refundHours" }, { status: 422 })`. Only pass a finite number (or undefined) to `endSession`.

- [ ] **Step 2: Quick sweep**
Grep the other admin route handlers for `Number(body...)`/`Number(params...)` fed into DB writes without an `isInteger`/`isFinite` guard (e.g. `redemptions`, `sessions/start`). Add guards only where a NaN would reach a query (return 422). Do not change valid-input behavior.

- [ ] **Step 3: Verify**
`pnpm build`. `POST /api/admin/sessions/<id>/end {"refundHours":"abc"}` → 422 (not 500); the session stays `running` and can be ended normally afterward. A valid `refundHours` still ends + refunds correctly.

- [ ] **Step 4: Commit** — `git commit -m "API: reject non-finite refundHours (and sweep numeric guards) with 422 instead of 500"`

---

### Task 4: Overview — print the full period (remove 200-row cap for print)

**Files:** `src/lib/overview.ts`, `src/app/admin/(app)/overview/OverviewClient.tsx`

**Fix:** Low #4 (order list capped at 200 → print "full period" truncates above 200).

- [ ] **Step 1: Don't cap the printed list**
`src/lib/overview.ts:~112` limits the order-list query to 200. The print block promises the full period. Options (pick the simpler that keeps memory sane): either remove the `.limit(200)` (period order counts are small — days/weeks), or keep an on-screen limit but return the full list for print. Simplest: drop the `.limit(200)` so `data.orders` is the full period; the on-screen view already paginates 12/page so the DOM stays light, and the `print-only` block gets everything. Totals/counts already come from a separate unlimited aggregate — unchanged.

- [ ] **Step 2: Verify**
`pnpm build`. For a period, confirm `data.orders.length` equals the true period order count (cross-check psql), on-screen still paginates 12/page, and `emulateMedia('print')` shows all rows. (If the DB has <200 orders/period, reason from the removed cap + confirm the count matches the aggregate.)

- [ ] **Step 3: Commit** — `git commit -m "Overview: print shows the full period (drop 200-row order-list cap)"`

---

### Task 5: Small correctness cleanups

**Files:** `src/lib/i18n/dictionary.ts`, `src/lib/directory.ts`

**Fixes:** Low #9 (`signupSubtitle` TH/EN reversed), Low #10 (directory `profileComplete` missing blank-name guard).

- [ ] **Step 1: Fix reversed dictionary entry**
`dictionary.ts` `signupSubtitle` currently `{ th: "Member registration", en: "ลงทะเบียนสมาชิก" }` — swap to `{ th: "ลงทะเบียนสมาชิก", en: "Member registration" }`.

- [ ] **Step 2: Consistent profileComplete in directory**
In `src/lib/directory.ts`, where parent groups set `profileComplete`, apply the same guard used in `parents.ts`/`children.ts`: `profileComplete: Boolean(p.profileComplete) && Boolean(p.name?.trim())`. (Keeps the incomplete chip correct if a blank-name stub ever has `profile_complete=true`.)

- [ ] **Step 3: Verify** — `pnpm build`; `/api/admin/directory` still returns correct groups; a blank-name stub parent (there is one in the DB) shows `profileComplete:false`.

- [ ] **Step 4: Commit** — `git commit -m "Fix reversed signupSubtitle i18n + directory profileComplete blank-name guard"`

---

### Task 6: Sell UI fixes

**Files:** `src/components/sell/ProductGrid.tsx`, `src/components/sell/CheckoutView.tsx`, `src/components/QuickAddSheet.tsx`, `src/lib/i18n/dictionary.ts`

**Fixes:** Low #6 (price-row tap dead-zone), Low #11 (retake object-URL leak), Low #7 (QuickAdd generic error), a11y #14 (QR lightbox keyboard).

- [ ] **Step 1: Product card is one tap target**
In `ProductGrid.tsx`, the price `<span>` is a sibling of the add `<button>`, creating a dead zone. Make the whole card the button (or move the price inside the button), so a tap anywhere on the tile (except the disabled state) adds to cart. Keep the disabled EXTRA_1H tile behavior + caption.

- [ ] **Step 2: Revoke the previous preview URL on retake**
In `CheckoutView.tsx` retake handler, call `URL.revokeObjectURL(preview)` before clearing/replacing it (guard for null). Prevents the blob leak on repeated retakes.

- [ ] **Step 3: Surface the real quick-add error**
In `QuickAddSheet.tsx`, on a non-OK response read the JSON `error` and show it (fall back to a generic message) instead of always `t("required")`. Add `quickAddFailed: { th:"เพิ่มไม่สำเร็จ", en:"Couldn't add" }` if needed.

- [ ] **Step 4: QR lightbox keyboard-operable (frontend-design)**
Invoke **frontend-design**. Make the PromptPay QR trigger a real control: change the inline `<img onClick>` to a `<button>` wrapping the image (or add `role="button" tabIndex={0} onKeyDown` for Enter/Space) so it can be opened by keyboard. The overlay already closes on Esc/backdrop — keep that. Give the button a visible focus state.

- [ ] **Step 5: Verify**
`pnpm build`. Headless: tapping the product price area now adds to cart; retaking a photo doesn't accumulate blob URLs (or reason from code); a failing quick-add shows a specific message; the QR can be opened via keyboard (Tab to it, Enter opens the lightbox) and closed via Esc.

- [ ] **Step 6: Commit** — `git commit -m "Sell UI: full-card tap target, revoke retake blob, real quick-add error, keyboard-openable QR"`

---

### Task 7: Accessibility — color contrast to WCAG AA

**Files:** `tailwind.config.ts` (+ `src/app/globals.css` if any hex duplicated), verify across the app

**Fix:** a11y #12 (systemic contrast below 4.5:1 for small text).

- [ ] **Step 1: Darken the foreground text tokens to pass AA (frontend-design)**
Invoke **frontend-design**. The `*bg` tokens (paper/card/okbg/warnbg/dangerbg/tealbg) stay as the light backgrounds. Darken the FOREGROUND tokens so each meets **≥4.5:1** against the backgrounds it's actually rendered on (paper `#FBF1DE`, card `#FFFAF0`, and its paired `*bg`): `meta`, `warn`, `danger`, `ok`, `tealdeep`. Compute the ratio for each candidate hex (use the WCAG relative-luminance formula) and pick the LIGHTEST hex that still clears 4.5:1 on every background it appears on (so the brand shifts as little as possible). Keep the same hue — only reduce lightness. Do NOT change `ink`/`amber-ink`/nav pairs (already pass), and don't darken tokens used as backgrounds. Before/after, grep each token's usages (`text-meta`, `text-warn`, `bg-warn`?, etc.) to confirm none is used as a background where darkening would break contrast the other way.

- [ ] **Step 2: Verify (measure, don't eyeball)**
`pnpm build`. In a headless browser (or a small node script using the WCAG formula on the final hex values), compute and report the contrast ratio for every changed pair: `meta`/paper, `meta`/card, `warn`/warnbg, `warn`/paper, `danger`/dangerbg, `danger`/paper, `ok`/okbg, `tealdeep`/paper. ALL must be ≥4.5:1. Spot-check a few screens (search chips, error banners, `tel:` links, overview meta text) that the app still reads warm/playful and nothing regressed to unreadable-on-dark.

- [ ] **Step 3: Commit** — `git commit -m "a11y: darken foreground text tokens to meet WCAG AA (>=4.5:1) while keeping the brand"`

---

### Task 8: Accessibility — lang, touch targets, focus states

**Files:** `src/lib/i18n/LanguageProvider.tsx`, `src/components/LogoutButton.tsx`, `src/components/LangToggle.tsx`, `src/app/globals.css`

**Fixes:** a11y #13 (`<html lang>` never updates), a11y #15 (AppBar controls <44px), a11y #17 (no branded focus state).

- [ ] **Step 1: Keep `<html lang>` in sync**
In `LanguageProvider.tsx`, in the effect that reads/sets `lang`, also set `document.documentElement.lang = lang` whenever it changes (on mount from storage and on toggle). Guard for SSR (`typeof document`).

- [ ] **Step 2: 44px touch targets on AppBar controls**
`LogoutButton.tsx` and `LangToggle.tsx` are ~29px tall. Add `min-h-[44px]` (and adequate padding) so they meet the 44px floor consistent with the rest of the app. Keep them visually balanced in the AppBar (frontend-design if needed).

- [ ] **Step 3: Branded focus-visible**
In `globals.css`, add a consistent `:focus-visible` outline/ring for buttons and links (e.g. a teal ring matching the `.field` focus) so keyboard focus is clearly visible and on-brand, instead of the default browser outline. Apply to `.btn-primary`, `.btn-ghost`, and interactive links/buttons generally (a base rule is fine).

- [ ] **Step 4: Verify**
`pnpm build`. Headless: toggle EN → `document.documentElement.lang === "en"`; measure LogoutButton/LangToggle height ≥44px; Tab through a page and confirm buttons/links show the branded focus ring.

- [ ] **Step 5: Commit** — `git commit -m "a11y: sync <html lang> with toggle, 44px AppBar controls, branded focus-visible"`

---

### Task 9: Final regression + verification

- [ ] **Step 1: Full sweep**
`rm -rf .next && pnpm build`, then `pnpm start`. Re-drive the key flows against the DB: signup (valid + error + bad phone/DOB), directory, sell → concurrent-safe confirm + EXTRA_1H feedback + keyboard QR, session end (bad + good refundHours), overview print full period. Re-measure at phone/tablet/landscape: no forced scroll (still 0), touch targets ≥44px on AppBar + product tiles, `lang` toggles, focus rings visible, and re-confirm the 8 contrast pairs ≥4.5:1. Cross-check WALKTHROUGH.md acceptance items still hold. Record evidence.

- [ ] **Step 2: Docs**
Note the fixes in CLAUDE.md/DECISIONS.md where relevant (e.g. phone/DOB validation now enforced; contrast tokens darkened for AA).

- [ ] **Step 3: Commit** — `git commit -m "Docs: note review-fix behavior changes (validation, AA contrast)"`

---

## Self-Review
**Coverage:** Med#1→T1, Med#2→T2, Med#3→T3; Low#4→T4, Low#5→T1, Low#6→T6, Low#7→T2+T6, Low#8→T2, Low#9→T5, Low#10→T5, Low#11→T6; a11y#12→T7, #13→T8, #14→T6, #15→T8, #16→T2, #17→T8. All review items mapped. Out-of-scope product decisions explicitly excluded.
**Placeholder scan:** deterministic fixes have concrete code; visual/contrast tasks give measurable acceptance criteria (≥4.5:1, ≥44px, ≥12px) + frontend-design, not vague "improve" — intentional, not placeholders.
**Consistency:** new dict keys (`signupFailed`, `invalidPhone`, `dobFuture`, `extendNotApplied`, `quickAddFailed`) each added once with TH+EN. `createPaidOrder` return extended with `extendApplied`/`extendRequested` consumed in CheckoutView.
**Risk:** Task 7 (token darkening) is the highest-touch (app-wide) — mitigated by "lightest hex that passes", grep of usages, and measured verification. Task 2 legibility may trade the strict 360×640 one-screen fit for readability — explicitly chosen; flag to owner in the final report.
