# Siamese Cat Creative Club — Management System

Combined public website, Siamese Cat Member signup and portal, and internal
point-of-sale/session management web app for Siamese Cat Creative Club. The
public website is served from the domain root, customers create a temporary
member account at `/signup`, review packages and usage at `/member`, and staff
work inside the protected `/admin` dashboard.

The currently implemented Creative Club behavior was built to
`sccc-management-system-prd-v1.md`, the historical
`MEMBER_SYSTEM_PRD_V2.md`, and `sccc-uiux-spec-v1.md`. The authoritative product
contract for the universal cross-product identity is now
`MEMBER_SYSTEM_PRD_V3.md`. Its runtime implementation and local verification
are complete; four staging/production gates remain explicitly open in
`docs/siamese-member-platform/GATES.md`. See `DECISIONS.md` for earlier
spec interpretations, `WALKTHROUGH.md` for the existing acceptance-criteria
map, and `DEPLOY.md` to ship the current application.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind · Neon Postgres via Drizzle ORM ·
separate iron-session admin/member auth · `promptpay-qr` + `qrcode` · `html-to-image` ·
local-disk uploads behind a storage abstraction. Thai-default UI with a per-device
TH/EN toggle. All times Asia/Bangkok; UTC in the DB.

## Local development

```bash
pnpm install
cp .env.example .env.local          # fill in DATABASE_URL + the rest
pnpm db:migrate                     # create tables
pnpm db:seed                        # insert the 11 products
pnpm create-admin manager@shop.com 'strong-password' manager
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
| `pnpm create-admin <email> <password> [manager\|staff]` | Print the bcrypt hash + upsert a role-based team account |
| `pnpm signup-qr <https://domain>` | Write `signup-qr.png` for the entrance |
| `pnpm check:member-release` | Run static member privacy, ownership, migration, and mobile release gates |
| `pnpm check:member-system` | Run member integration tests against an explicitly marked test database |
| `pnpm check:siamese-creative-link` | Run disposable-DB universal-link, preservation, optional-failure, and legacy-game migration checks |
| `MEMBER_TOKEN_PRUNE=1 pnpm member:prune-tokens` | Remove expired/used token rows beyond the configured retention period |

## Layout

```
public/
  main-site/               static public website mounted at /, /inside, /memberships, /dinner, /faq
  landing/                 images for the previous landing page now mounted at /creative
src/
  app/
    creative/              previous Creative Club landing page
    signup/                 public Siamese Cat Member registration
    member/                 customer package, usage, receipt, and profile portal
    admin/(app)/            role-aware shell: staff operations plus manager reporting/content/team tools
    admin/login/            login (A0)
    api/                    public/signup, admin/* route handlers
  components/               AppBar, BottomNav, sheets, sell/*, Countdown, PackageRow, …
  db/                       schema.ts, index.ts (lazy pooled pg), migrate.ts, seed.ts
  lib/                      auth, orders, sessionOps, packages, sessions, overview, receipt, i18n, …
  middleware.ts             gates /admin/* and /api/admin/*
```
