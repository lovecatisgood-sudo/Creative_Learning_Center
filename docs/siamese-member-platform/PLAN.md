# Siamese Member Platform — Phased Plan

**Status:** runtime implementation and local verification complete; controlled
staging/production cutover pending  
**Scope owner:** [`MEMBER_SYSTEM_PRD_V3.md`](../../MEMBER_SYSTEM_PRD_V3.md)

## Phase 0 — Product contract and source reconciliation

**Status:** complete

### Objective

Lock the universal-member model, optional Creative membership link, product
history, and three-dashboard boundary before runtime work.

### Owned artifacts

- `MEMBER_SYSTEM_PRD_V3.md`
- `docs/siamese-member-platform/PROJECT_INTENT.md`
- `docs/siamese-member-platform/PLAN.md`
- `docs/siamese-member-platform/GATES.md`

### Exit condition

PRD outcomes map to planned phases and gates; no runtime code is represented as
implemented.

## Phase 1 — Membership data foundation

**Status:** complete  
**Depends on:** Phase 0

### Objective

Create the additive universal-member, authentication-identity, product,
member/product, login-event, profile-link, conflict, and audit schema. Reconcile
it with existing provider and Creative tables without making Creative core
flows depend on it.

### Work

1. Produce physical schema and data-classification design.
2. Add idempotent migrations and runtime readiness verification.
3. Seed distinct Siamese Cat Creative Club, Cat vs Dog, and Car Maze
   products/clients.
4. Backfill stable provider and Creative member identifiers.
5. Add reconciliation reports for ambiguous legacy records.
6. Prove exact Creative/game record counts before and after migration.

### Integration obligation

Existing Creative signup, directory, checkout, sessions, and existing provider
authentication remain functional if the new optional schema is unavailable.

## Phase 2 — Unified provider methods and product recording

**Status:** complete  
**Depends on:** Phase 1

### Objective

Add Google as an upstream method beside magic link and resolve both to one
stable Siamese identity. Record the trusted product relationship and successful
login event after authorization.

### Work

1. Add Google server-side authorization, callback, and verification.
2. Add immutable Google-subject linking and collision quarantine.
3. Keep provider claims limited to OIDC protocol claims plus `sub`, `email`, and
   `email_verified`.
4. Map each confidential OIDC client to one trusted product.
5. Atomically update first/last/count and append one product-login event.
6. Preserve current magic-link security, generic responses, and stable subject.

### Integration obligation

Google and magic link return the same subject for a safely linked fixture;
product recording cannot cause a successful identity to receive entitlement.

## Phase 3 — Siamese Cat Member Admin Dashboard foundation

**Status:** complete  
**Depends on:** Phase 1; product event contract from Phase 2

### Objective

Build the separate master-admin service with its own deployment, credential,
session, authorization middleware, database role, health signal, and audit.

### Work

1. Resolve hostname/repository and deploy boundary.
2. Implement separate master-admin login and role.
3. Build member directory, product filters, and explicit error states.
4. Build member detail with all product summaries and paginated login history.
5. Add linked profile references and conflict/reconciliation queue.
6. Add disable/merge/repair designs behind audited, least-privilege endpoints.

### Integration obligation

Creative staff/manager cookies are rejected. Master-admin cookies are rejected
by Creative routes. A membership query failure is never displayed as zero
members.

## Phase 4 — Creative Club optional membership connection

**Status:** complete locally; both-provider staging journey pending  
**Depends on:** Phases 1–2

### Objective

Prompt parents to connect/create a Siamese identity through Google or magic
link while preserving an unconditional Creative registration path.

### Work

1. Add prompt, Google, email, skip, pending, retry, and link-later states.
2. Preserve entered parent/child data across redirects and network failure.
3. Store guest contact email as unverified product contact data only.
4. Link verified identity transactionally without duplicating profiles.
5. Record Creative product relationship only after successful authorization.
6. Preserve existing Creative staff/manager routes and permissions.

### Integration obligation

Parent/child registration succeeds and is staff-visible when membership is
accepted, skipped, or unavailable. No optional failure appears as an empty or
lost registration.

## Phase 5 — Cat vs Dog migration

**Status:** complete locally; finish/ad browser journey pending  
**Depends on:** Phases 1–2

### Objective

Replace the separate Google-only path with the shared provider at the existing
post-game/post-finish-ad transition while preserving player/run data.

### Work

1. Register a dedicated Cat vs Dog production client.
2. Use the shared Google-or-email provider interaction.
3. Link game player by `(issuer, subject)`.
4. Reconcile an existing player on next Google login by stored Google `sub`.
5. Preserve ad completion, next-game transition, sessions, and run history.
6. Keep the established direct-Google route available behind a compatibility
   path until the shared Google and magic-link journeys both pass against the
   live game; retire it only in a later, reversible release.

## Phase 6 — Car Maze migration

**Status:** complete  
**Depends on:** Phases 1–2

### Objective

Use the shared provider at Stage 20 without altering guest-first stages or the
ten-stage ad schedule.

### Work

1. Register a dedicated Car Maze production client.
2. Offer Google or email magic link at the Stage 20 checkpoint.
3. Preserve stages 1–19, guest progress, and post-callback stage state.
4. Keep ads every 10 stages independent from authentication.
5. Link progress and player history by stable subject.

## Phase 7 — Legacy reconciliation and controlled cutover

**Status:** implementation complete; controlled production cutover pending  
**Depends on:** Phases 1–6

### Objective

Complete migration without silent merges, lost product history, or a single
all-products cutover.

### Work

1. Backfill verified existing provider/Creative links.
2. Promote standalone provider accounts to universal members.
3. Migrate game players on verified next login.
4. Review conflict queue and exercise audited repair paths.
5. Retain legacy sessions through the approved compatibility window.
6. Roll out provider, master dashboard, Creative, then each game independently.
7. Never replace a working login with a `410` or disabled control before the
   replacement is deployed, production-verified, and covered by rollback.

## Phase 8 — Production verification and handoff

**Status:** local verification complete; deployment/recovery drill pending  
**Depends on:** all earlier phases

### Objective

Prove production readiness, rollback, observability, documentation, and exact
requirement-to-repository reconciliation.

### Work

1. Run full builds, tests, migrations twice, compatibility tests, and security
   checks.
2. Verify independent readiness and explicit-error behavior.
3. Run local/staging end-to-end flows with controlled fixtures.
4. Deploy in the approved sequence and perform read-only public checks.
   Public checks alone do not satisfy authentication gates: controlled real
   Google and real-mail journeys must also reach the correct application
   callback and first-party session.
5. Refresh operations, recovery, client onboarding, and incident guides.
6. Perform a fresh PRD-to-repository reconciliation after the final change.

## Future phase — Member-facing dashboard

Explicitly deferred. It begins only after Phase 8 passes and receives its own
PRD for member-visible data, account recovery, product navigation, privacy, and
session behavior.
