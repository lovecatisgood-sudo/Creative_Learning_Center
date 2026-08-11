# Catalogue change handoff — 11 August 2026

## Purpose of this document

This document hands the 11 August 2026 Kids Playroom catalogue work back to the Codex instance responsible for `Creative_Club_POS`.

The work was requested from the wrong Codex conversation after another Codex was already working in this repository. The repository had substantial unrelated, pre-existing changes—especially member-system and mobile-app work—before this catalogue task began. Those existing changes were preserved and must not be assumed to be part of this catalogue implementation.

No commit, push, production deployment, production database migration, browser automation, or account-dashboard action was performed for this task.

## Requested business change

Replace the old Little Explorer Playgroup offer everywhere with a parent-accompanied **Kids Playroom & Creative Activities** offer.

### New Kids Playroom menu

| Product | Price |
| --- | ---: |
| 1-hour child entry | 149 THB |
| 2-hour child entry | 249 THB |
| Additional hour after an initial entry | 80 THB |
| Additional adult | 50 THB/hour |
| Crayon activity | 45 THB |
| Small soft-clay figure activity | 69 THB |
| Large soft-clay figure activity | 99 THB |

Each child entry includes one accompanying adult and one coloring sheet. Prices are stated per child. Staff may guide activities, but the accompanying parent or guardian remains responsible for the child and must stay on the premises.

The 45 THB crayon activity is described as a separate, staff-guided activity using additional materials, distinct from the included coloring sheet. The website does not promise that clay figures are take-home items; customers are told to confirm current materials and take-home availability with staff.

No soft-opening end date was invented because none was supplied.

### Old Playgroup offers retired

- Shared Playgroup 1-hour entry at 199 THB
- Shared Playgroup 2-hour entry at 300 THB
- Weekday half-day at 599 THB
- Weekday full-day at 999 THB
- Weekend full-day at 1,500 THB
- 20-session weekday pass at 18,000 THB
- 8-session Saturday/Sunday passes at 9,200 THB
- Playgroup Meal Care value at 250 THB
- Playgroup membership, regular-care, full-day-care and drop-off claims

### After School Explorer intentionally preserved

- 1 hour at 199 THB
- 2 hours at 300 THB
- Weekday four-hour option at 599 THB
- Meal Care Add-On at 299 THB
- Homework, reading, creative play, rest, dinner and pickup-support positioning
- After School passes arranged with the team
- `/creative` page and its after-school SEO positioning

## Architectural decision: separate products

The old POS used shared `ENTRY_1H` and `ENTRY_2H` products. Those products could no longer represent both services because Playroom changed to 149/249 THB while After School remains 199/300 THB.

A shared catalogue was added at `src/lib/product-catalog.ts` with distinct SKUs:

### Playroom SKUs

- `PLAYROOM_ENTRY_1H`
- `PLAYROOM_ENTRY_2H`
- `PLAYROOM_EXTRA_1H`
- `PLAYROOM_EXTRA_ADULT_1H`
- `PLAYROOM_CRAYON_ACTIVITY`
- `PLAYROOM_CLAY_SMALL`
- `PLAYROOM_CLAY_LARGE`

### After School SKUs

- `AFTERSCHOOL_ENTRY_1H`
- `AFTERSCHOOL_ENTRY_2H`
- `AFTERSCHOOL_HALF_DAY_4H`
- `MEAL_AFTERSCHOOL`

`src/db/seed.ts` now consumes this catalogue. The catalogue also exports the legacy SKUs that must be deactivated.

## Database migration

Added `drizzle/0008_replace_playgroup_with_playroom.sql` and registered it in `drizzle/meta/_journal.json`.

The migration:

1. Deactivates the old shared and Playgroup-only SKUs.
2. Upserts the new Playroom products.
3. Upserts the preserved, separately named After School products.
4. Updates stale published blog content for these slugs:
   - `first-playgroup-one-hour-two-hours-half-day`
   - `things-to-do-kids-near-mega-bangna`
   - `kids-club-playgroup-bangkok-which-fits-your-day`
   - `after-school-care-bangna-working-parents`

Important: the migration was **not applied**. The repository's configured database credentials returned `password authentication failed for user "postgres"`. The next owner should inspect the SQL, obtain valid deployment credentials, run the migration through the normal release workflow, and verify the resulting product rows and live blog bodies.

## Signup changes

Added `src/lib/program-options.ts` as the shared bilingual signup-option source.

Updated:

- `src/app/signup/page.tsx`
- `src/app/api/public/signup/route.ts`

The signup form now exposes the seven Playroom selections and the preserved After School selections. The API now applies a server-side allowlist instead of trusting an arbitrary submitted programme value. Existing Terms of Service and Privacy Policy acceptance remains in the signup process.

## Public website changes

The source generator `scripts/build-main-site-redesign.mjs` and generated files under `public/main-site/` were updated.

Changed surfaces include:

- Homepage: Little Explorer replaced by Kids Playroom & Creative Activities.
- `/playgroup`: rewritten as the parent-accompanied Kids Playroom offer; includes a temporary “Formerly Little Explorer Playgroup” note.
- `/little-explorer-program`: removed from the generated rewrite list and permanently redirected to `/playgroup`.
- English retired route redirects to `/EN/playgroup`.
- `/membership`: Playgroup memberships removed; After School planning remains.
- `/dinner`: only After School Meal Care at 299 THB remains.
- `/first-visit`, `/faq`, `/contact`, `/about`, `/inside`, homepage journeys, thank-you and 404 copy updated where relevant.
- Thai and English pages updated together.

The legacy `public/main-site/little-explorer-program.html` generated artifacts may still physically exist in the worktree, but Next.js now handles those public URLs with permanent redirects before serving them. They should not be indexed because the paths were also removed from the sitemap.

## SEO, schema and metadata

The repository's local `creative-club-seo` skill and its current audit guidance were read before making SEO changes.

Updated:

- `src/components/landing/Jsonld.tsx`
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `next.config.mjs`
- signup and legal page metadata
- blog index/article shell calls to action
- static page titles, descriptions and structured data

Old Playgroup prices and care claims were removed from customer-facing schema. After School values remain intentionally present.

## Legal and policy content

Updated bilingual source documents:

- `src/content/legal/terms.md`
- `src/content/legal/terms.th.md`
- `src/content/legal/privacy.md`
- `src/content/legal/privacy.th.md`

Regenerated their `*.html.ts` modules.

The terms now state:

- Playroom is parent-accompanied and not drop-off childcare.
- A parent or guardian remains on the premises and responsible for the child.
- Exact Playroom menu and inclusions.
- Additional-hour eligibility requires an initial entry and remains subject to capacity.
- No Playroom meal value, full-day care or membership entitlement.
- Clay take-home availability must be confirmed rather than assumed.
- After School remains a separate service with its preserved prices and operating terms.

## Other affected content

Updated programme/service labels in:

- contact email generation and public contact API
- admin inquiry display
- bilingual dictionary fallback content
- blog index/article presentation
- family-tool templates and regenerated `public/tools/` content

These changes remove obsolete Little Explorer positioning from shared navigation, calls to action and cross-promotional content.

## Automated regression coverage

Added `scripts/check-playroom-menu.mjs` and package script:

```text
pnpm check:playroom-menu
```

The check verifies:

- every current SKU and its expected price in the source catalogue and migration;
- retirement of old Playgroup SKUs;
- removal of stale signup values;
- required parent-stay, inclusion and price language in legal terms;
- the permanent Little Explorer redirect;
- removal of the retired route from the sitemap;
- migration coverage for all four affected published articles;
- correct nested blog-body and heading replacements in the migration.

The check was added to `prebuild`, so future `pnpm build` runs include it.

`scripts/check-main-site-shell.mjs` was also updated to check the new navigation labels, all seven Playroom prices, parent-stay wording and absence of retired package values.

## Verification performed

The following passed after the final changes:

- `node scripts/check-playroom-menu.mjs`
- `node scripts/check-main-site-shell.mjs`
- `node scripts/check-family-tools.mjs`
- `node scripts/check-deploy-hygiene.mjs`
- `git diff --check`
- Full `pnpm build`
  - static source regeneration
  - legal-document generation
  - Next.js compilation
  - lint/type validation
  - static page generation
- Focused stale-content searches across source and generated public pages
- Local production-server HTTP checks:
  - `/playgroup` → 200
  - `/EN/playgroup` → 200
  - `/little-explorer-program` → 308 to `/playgroup`
  - `/EN/little-explorer-program` → 308 to `/EN/playgroup`
  - `/membership`, `/creative` and `/signup` → 200

No browser or GUI was opened. Verification was CLI-only.

## Missing source artwork

`new_menu_aug.jpg` was not found anywhere in the repository during the task. The website was implemented from the menu values and clarifications supplied in the request, but the menu image itself was not inspected, copied or edited.

If the artwork must be published or corrected, add the actual image to the repository and review it separately. Recommended artwork wording remains:

- “Kids Playroom & Creative Activities”
- “One adult included per child entry”
- “One coloring sheet included”
- “Additional adult — 50 THB/hour”
- “Additional hour — 80 THB after initial entry”
- “Staff guide activities, but the accompanying parent or guardian remains responsible for the child and must stay on the premises.”
- Explicit per-child pricing
- A real soft-opening end date or “until further notice”
- Confirmation of whether clay items are take-home

## Worktree and ownership warning

The worktree was already heavily modified before this task. Pre-existing changes included member authentication/identity, member pages and APIs, mobile bridge/native projects, game assets, admin parent/search/receipt/sell work, schema changes, documentation and package configuration.

Do not bulk-revert or attribute every modified/untracked file to this catalogue task. Review the current diff file-by-file and coordinate with the Codex or developer handling those existing changes.

The catalogue task intentionally touched some files that were already modified, including `package.json`, signup files and generated content. Preserve both sets of valid changes when resolving or committing.

## Recommended next-owner release steps

1. Review this handoff and the relevant diff without resetting the dirty worktree.
2. Inspect `drizzle/0008_replace_playgroup_with_playroom.sql` against the actual production schema and current live blog content.
3. Resolve the database authentication configuration.
4. Run the migration using the repository's normal deployment workflow.
5. Verify active products and prices in the staff/admin POS.
6. Verify the public signup stores each new programme value correctly.
7. Deploy the latest combined worktree only after coordinating the unrelated member/mobile changes.
8. Recheck production HTML, structured data, sitemap, retired redirects and all four affected blog articles through CLI.
9. Add and separately review `new_menu_aug.jpg` if the menu artwork is intended for the public site.
