# Project intent: Coding with AI Hostinger deployment

## Goal

Make the already-approved Coding with AI student-project release build successfully on Hostinger and become publicly live at `creative.siamesecat.cafe`.

## Required outcomes

- Hostinger builds the exact GitHub `main` source without a mixed or stale route configuration.
- `/EN/coding-with-ai` presents the student-built project wording and links.
- `/EN/coding-with-ai/car-maze` and `/EN/coding-with-ai/cat-vs-dog` return HTTP 200.
- Existing Creative Club signup, authentication, member, game, database, and legal flows are not changed by this deployment repair.

## Invariants

- Do not weaken or remove the route-map validator to make the build pass.
- Do not deploy the dirty primary worktree or include its uncommitted member-platform work.
- `mainSiteRoutes`, generated HTML, sitemap entries, and the validator must agree on both project routes.
- "Fixed" means the Hostinger deployment succeeds and public production verification passes.

## Authoritative sources

- Owner's Hostinger failure log from 2026-08-23.
- GitHub `origin/main` commit `6400a0250551ca94a3119ec8cd2d2857a1f90a24`.
- `package.json` Hostinger/prebuild commands.
- `scripts/check-main-site-shell.mjs` route contract.
- `next.config.mjs`, generated Coding pages, and `src/app/sitemap.ts`.

## Exclusions

- No member-system, OIDC, POS, Love Points, database-schema, or unrelated UI changes.
- No DNS or unrelated Hostinger setting changes.
