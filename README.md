# Siamese Cat Creative Club — Management System

Combined public website, parent signup, and internal point-of-sale/session
management web app for Siamese Cat Creative Club. The public website is served
from the domain root, parents self-register at `/signup`, and staff work inside
the protected `/admin` dashboard.

Built to `sccc-management-system-prd-v1.md` (business rules) and
`sccc-uiux-spec-v1.md` (screens). See `DECISIONS.md` for spec interpretations,
`WALKTHROUGH.md` for the acceptance-criteria map, and `DEPLOY.md` to ship it.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Neon Postgres via Drizzle ORM ·
iron-session admin auth · `promptpay-qr` + `qrcode` · `html-to-image` ·
local-disk uploads behind a storage abstraction. Thai-default UI with a per-device
TH/EN toggle. All times Asia/Bangkok; UTC in the DB.

## Local development

```bash
pnpm install
cp .env.example .env.local          # fill in DATABASE_URL + the rest
pnpm db:migrate                     # create tables
pnpm db:seed                        # insert the 11 products
pnpm create-admin admin@shop.com 'password'   # hash + admin row
pnpm dev                            # http://localhost:3000
```

Any standard Postgres works locally (e.g. Docker):
`postgresql://postgres:pw@localhost:5432/sccc`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / production build / serve |
| `pnpm db:generate` | Regenerate the Drizzle migration from `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed/refresh the 11 products (idempotent) |
| `pnpm create-admin <email> <password>` | Print the bcrypt hash + upsert the admin |
| `pnpm signup-qr <https://domain>` | Write `signup-qr.png` for the entrance |

## Layout

```
public/
  main-site/               static public website mounted at /, /inside, /memberships, /dinner, /faq
  landing/                 images for the previous landing page now mounted at /creative
src/
  app/
    creative/              previous Creative Club landing page
    signup/                 public parent registration (P1/P2)
    admin/(app)/            authed shell: sessions · search · sell · overview · child · session · receipt
    admin/login/            login (A0)
    api/                    public/signup, admin/* route handlers
  components/               AppBar, BottomNav, sheets, sell/*, Countdown, PackageRow, …
  db/                       schema.ts, index.ts (lazy pooled pg), migrate.ts, seed.ts
  lib/                      auth, orders, sessionOps, packages, sessions, overview, receipt, i18n, …
  middleware.ts             gates /admin/* and /api/admin/*
```
