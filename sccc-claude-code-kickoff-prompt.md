# Claude Code Kickoff Prompt — SCCC Management System V1

Paste everything below this line into Claude Code, with `sccc-management-system-prd-v1.md` and `sccc-uiux-spec-v1.md` placed in the repo root.

---

You are building the V1 management system for **Siamese Cat Creative Club**, a children's playroom in Bangkok that opens **tomorrow**. The full specification is in `sccc-management-system-prd-v1.md` in this directory — read it completely before writing any code. Then read `sccc-uiux-spec-v1.md`, which defines every screen layout, the navigation map, design tokens, and end-to-end flow variations — build the UI to match it. Also open `sccc-app-prototype-v1.html` in a browser: it is a working clickable prototype of the entire app (both parent and admin flows) and is the visual and behavioral reference — match its theme (cream/brown/amber palette derived from the logo), layouts, and interaction patterns. The PRD wins on business rules; the UI/UX spec and prototype win on screens and navigation.

## Mission
Ship a working, deployable app **today**. Bias every decision toward simplicity and shipping. Do not add features, abstractions, tests-for-coverage, or "nice to haves" beyond the PRD. The Non-Goals list in PRD §1 is a hard fence.

## Stack (fixed — do not substitute)
Next.js App Router + TypeScript + Tailwind. Neon Postgres via Drizzle ORM + drizzle-kit. iron-session (or NextAuth credentials) for the single admin login. `promptpay-qr` + `qrcode` for payment QR. `html-to-image` for save-as-image. Local-disk uploads behind a `lib/storage.ts` abstraction. Deployment target: Hostinger VPS (Node 20, PM2, Nginx); must also boot on Vercel unchanged.

## Build order (work in this exact sequence, commit after each milestone)

**M1 — Skeleton & data layer**
Scaffold app, Tailwind, env handling (`.env.example` with every var from PRD §2). Drizzle schema for all tables in PRD §5, migration, and a seed script inserting the 11 products exactly as PRD §4 (SKUs, prices, grants JSON). Admin auth: login page, session cookie, middleware protecting `/admin/*` and `/api/admin/*`. `/signup` stays public.

**M2 — Registration & search**
Public bilingual (TH/EN) `/signup` form per PRD §6.1 including multi-child and T&C checkbox, success screen. Admin quick-add child (PRD §6.2) with `profile_complete=false` badge and complete-later editing. Search (PRD §6.3) across child name / parent name / phone with Thai text, and the Child page shell.

**M3 — Sell: cart → payment → receipt**
Product grid cart, checkout with the three payment tabs (PromptPay dynamic QR with exact amount, bank details card, cash), mandatory proof-photo capture with client-side compression, confirm → create order/payments/package_instances (+ 6-month expiry on passes) in one transaction with audit rows. Receipt screen with numbering `SCCC-YYYYMMDD-####`, 80mm print CSS via `window.print()`, and Save-as-image. Receipts accessible from Child page history.

**M4 — Sessions engine**
Start flows per PRD §6.5 (timed/bundle whole-consumption; hour-pass stepper deduction in-transaction). Pickup slip (print + image). End-session flow with the hour-refund dialog for HOUR_PASS only, `floor(booked − elapsed)` cap, audit logging (PRD §6.6). EXTRA_1H extension of a running session. Addon credit redemption (PRD §6.7). Sessions dashboard home screen with live countdowns and red OVERDUE state, 30s polling (PRD §6.8).

**M5 — Overview screen & deploy pack**
Overview per PRD §6.9: Day/Week/Month unit switcher, ◀ ▶ period navigation capped at the current period, per-method totals, counts, and the period's order list. Then a `DEPLOY.md`: exact Hostinger VPS steps (Node install, pnpm, build, PM2 ecosystem file, Nginx server block with client_max_body_size for uploads, certbot), Neon setup, running migrations + seed, creating the admin password hash, and generating the signup-page QR code. Include a `scripts/create-admin.ts` helper.

## Hard rules
- The whole app (signup + admin) defaults to **Thai** with a TH/EN toggle on every primary app bar, per PRD §2 Language — build the string dictionary from M2 onward, never hardcode display text.
- Asia/Bangkok for every displayed time; store UTC in the DB.
- Every mutation of money, hours, or credits: DB transaction + `audit_log` row. No exceptions.
- Payment confirmation is impossible without an uploaded proof photo (server-enforced, not just UI).
- Refund path exists **only** for HOUR_PASS instances; assert this server-side.
- Mobile-first: assume a 390px-wide phone held by a staff member with a queue in front of them. Big tap targets, minimal typing.
- No email sending, no SMS, no cron jobs. Expiry is checked at read time (`expires_at < now` → treat as expired).
- Keep dependencies minimal; no component libraries beyond Tailwind unless trivial (headlessui acceptable for dialogs).

## Definition of done
Every checkbox in PRD §8 (Acceptance Criteria) passes in a manual walkthrough. Provide a short `WALKTHROUGH.md` mapping each criterion to where/how you verified it. App boots locally with `pnpm dev` against a Neon URL, and `pnpm build && pnpm start` succeeds.

## When you are unsure
Choose the simpler behavior, note it in `DECISIONS.md`, and keep moving. Do not stop to ask unless the ambiguity blocks money handling or hour accounting.
