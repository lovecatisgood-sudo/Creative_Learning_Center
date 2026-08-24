# Siamese Member Platform — Cutover and Rollback

## Required deployment order

1. Back up the shared PostgreSQL database and record protected-table counts.
2. Deploy provider migration `0004_universal_membership.sql`; verify provider
   `/health/ready` and schema version 4.
3. Register three confidential clients with exact product IDs and callbacks:
   Creative Club, Cat vs Dog, and Car Maze. Never share their secrets.
4. Deploy the master-admin service on its approved dedicated hostname with a
   dedicated database login, credential, session rotation keys, and CSRF key.
5. Deploy Creative with membership linking disabled; verify signup, directory,
   checkout, member portal, and both game guest paths.
6. Enable Creative, Cat vs Dog, and Car Maze independently, completing the open
   gates after each change before enabling the next product.

## Health and failure behavior

- Provider readiness requires exact schema version 4 and signing-key readiness.
- Master admin has independent `/health/live` and `/health/ready`; a membership
  query failure displays a retryable operational error, never zero members.
- Creative membership and game authentication are optional feature paths.
  Their schema/config/provider failures disable or pend only the affected link;
  Creative registration, directory, checkout, and guest play remain available.

## Non-destructive rollback

1. Disable `SIAMESE_CREATIVE_AUTH_ENABLED` and
   `SIAMESE_GAME_AUTH_ENABLED` in Creative first.
2. Route the master-admin hostname to maintenance or the prior service version.
3. Roll provider code back only after new client traffic is disabled.
4. Do not drop version-4 tables, columns, product relationships, login events,
   profile links, consents, conflicts, or audit records. Older code ignores the
   additive data and a later corrected release can reuse it.
5. Preserve existing Creative and game sessions during the approved
   compatibility window. Disabling universal authentication must not delete
   parent, child, order, package, player, run, or score history.
6. Re-run protected counts and all three readiness checks after recovery.

## Production evidence to retain

Record deployment revisions, migration output, pre/post counts, health
responses, client IDs (never secrets), timestamps for each feature toggle, the
four remaining gate results, and rollback/recovery timings. Store no raw email,
child data, tokens, codes, cookies, or secrets in the evidence bundle.
