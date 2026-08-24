# Siamese Cat Member Hub — Execution Plan

**Status:** planning complete; implementation blocked on authoritative handoff
and Customer Core source identification  
**Target:** `members.siamesecat.cafe`  
**Current repository role:** Creative Club product system and prospective
Creative summary API owner; this checkout does not contain an identified
Customer Core or Love Points implementation.

## Ownership map

| Concern | System of record | Hub behavior |
| --- | --- | --- |
| Authentication and verified identity | Siamese Cat OIDC provider | Authorization Code + PKCE; validate fixed issuer, audience, state, nonce, signature, and expiry; create a hub session |
| Cross-system key | OIDC `(iss, sub)` | Resolve through Customer Core mapping; never join by email/phone |
| Customer profile | POS Customer Core | Read the hub-safe customer projection and retain its internal mapping |
| Love Points | POS loyalty ledger | Display authoritative balance/activity; no hub-side recomputation or mutation in v1 |
| Coupons and benefits | Named POS/CRM promotion service, to be confirmed | Display owner-supplied eligibility and state; present short-lived redemption proof only after a separate approved contract |
| Creative family and service data | Creative Club | Consume the versioned member-summary API; show partial failure independently |
| Universal member product history | Membership/provider platform | Display only fields explicitly approved by the shared contract |
| Member Hub composition and session | Member Hub deployment | Own navigation, aggregation, caching, error isolation, observability, and logout of the hub session |

## Phase 0 — Import and freeze the cross-repository contract

**Status:** blocked  
**Depends on:** readable `45_UNIFIED_SIAMESE_MEMBER_PLATFORM_PLAN.md`

### Objective

Turn the quoted handoff into checked-in, exact contracts before runtime work.

### Work

1. Copy or link the handoff into the owning repository and record its checksum.
2. Reconcile Section 12 against this intent, the provider PRD, and actual
   repository state; record every conflict rather than silently choosing one.
3. Identify the Customer Core/Love Points repository and hub deployment owner.
4. Freeze versioned schemas for:
   - OIDC identity input and hub session output;
   - Customer Core resolution;
   - Love Points balance/activity;
   - coupon/benefit eligibility and lifecycle;
   - Creative member summary;
   - shared error and correlation envelopes.
5. Copy the handoff's exact performance targets into `GATES.md`.
6. Create consumer-driven fixtures in both provider/Creative and hub
   repositories from the same contract version.

### Exit condition

No `TBD` remains in an interface or performance gate; ownership and deployment
boundaries are named; both repositories validate the same fixtures.

## Phase 1 — OIDC-to-Customer Core identity mapping

**Status:** pending  
**Depends on:** Phase 0 and a staging OIDC client

### Objective

Resolve each authenticated `(iss, sub)` to one stable Customer Core record
without using mutable contact fields as identity.

### Work

1. Add an additive mapping entity conceptually containing:
   `customer_id`, `issuer`, `subject`, `status`, `linked_at`, `last_seen_at`,
   audit metadata, and a non-key verified-email snapshot if operationally
   required.
2. Enforce a unique `(issuer, subject)` mapping and prohibit reassignment except
   through a separately authorized, audited reconciliation action.
3. Implement fixed-issuer OIDC login with Authorization Code + PKCE and a
   short-lived, encrypted, secure, HttpOnly, SameSite hub session.
4. On first safe login, create or attach a Customer Core record only under the
   frozen reconciliation rules. A matching email/phone creates a review
   candidate, not an automatic merge.
5. Add a read-only dry-run reconciler classifying exact, new, ambiguous,
   conflict, and invalid records before enabling production writes.
6. Add idempotent runtime schema readiness, compatibility behavior, audit, and
   health signals.

### Integration obligation

Provider outages affect hub sign-in only; Customer Core mapping failures are
explicit and retryable; POS checkout and Creative core flows remain available.

## Phase 2 — Member Hub foundation

**Status:** pending  
**Depends on:** Phase 1

### Objective

Create the production member-facing shell at the approved deployment boundary.

### Work

1. Build Thai and English routes with accessible, mobile-first navigation.
2. Add signed-in home, account/security, product connections, and sign-out.
3. Use a server-side aggregation layer; browser code never receives downstream
   service credentials or raw provider tokens.
4. Isolate each product panel with bounded timeout, safe retry, correlation ID,
   and last-known timestamp where the contract permits caching.
5. Add CSRF protection, session rotation, CSP/security headers, rate limits,
   redacted structured logs, and request tracing.
6. Render loading, unavailable, not-connected, no-activity, and real zero states
   as distinct states.

### Integration obligation

One downstream failure cannot blank the whole home screen or convert an
operational error into zero data.

## Phase 3 — Love Points integration

**Status:** pending  
**Depends on:** Phases 0–2 and identified loyalty owner

### Objective

Show an authoritative, understandable Love Points view without duplicating
ledger authority.

### Work

1. Consume the Customer Core/loyalty read contract by resolved customer ID.
2. Display available balance, pending balance if supported, and recent ledger
   activity with transaction status and effective time.
3. Preserve ledger-supplied reversal, expiry, and adjustment semantics.
4. Add pagination/cursors and a bounded cache policy that cannot fabricate a
   current balance.
5. Keep earn/redeem/adjust/admin actions outside hub v1 unless separately
   specified, threat-modeled, and gated.

### Integration obligation

A points service error is shown as unavailable with retry, never as `0`; ledger
IDs and balances are never inferred from Creative purchases.

## Phase 4 - Coupons and membership benefits

**Status:** pending  
**Depends on:** Phases 0-2 and a named coupon/benefit system of record

### Objective

Give members one understandable place to view eligible discounts and benefits
without duplicating promotion or redemption authority in the Hub.

### Work

1. Freeze a versioned read contract for available, saved if supported, used,
   and expired benefits.
2. Require the owner to supply eligibility, terms, participating products or
   locations, expiry, usage limits, and lifecycle state.
3. Design redemption as a server-created, short-lived, single-use presentation
   bound to member, campaign, audience, and expiry. Static identifiers and
   screenshots are not redeemable proof.
4. Keep issue, reserve, redeem, reverse, and staff override operations in the
   owning service with idempotency and audit.
5. Isolate coupon failure from identity, Love Points, and Creative panels.

### Integration obligation

The Hub never applies a discount itself and never shows an unavailable coupon
service as no benefits.

## Phase 5 - Creative member-summary integration

**Status:** pending  
**Depends on:** Phase 0 and the other agent's provider/API stabilization

### Objective

Expose a safe Creative Club overview through the versioned Creative API while
Creative remains the sole owner of family and service records.

### Producer work (Creative repository)

1. Implement the exact versioned, server-authenticated member-summary contract
   from the handoff.
2. Resolve only by verified `(iss, sub)` through
   `creative_member_identity_links`; never accept email/phone as authority.
3. Return only approved member-facing fields, explicit not-connected state,
   contract version, freshness timestamp, and safe error/correlation envelope.
4. Apply least-privilege database access, rate limits, audit, readiness, and
   contract tests.
5. Keep all existing `/member`, signup, directory/search, checkout, sessions,
   and receipt behavior working if this optional API is unavailable.

### Consumer work (Hub repository)

1. Use only the versioned contract and pinned server credential.
2. Validate every response at runtime and fail the Creative panel closed on
   incompatible versions or invalid payloads.
3. Show not connected, connected/no-current-package, connected/active, and
   service-unavailable as different states.
4. Deep-link to the approved Creative product route for details/actions; do not
   recreate Creative mutations in the hub.

### Integration obligation

Consumer-driven contract tests run in both repositories and a Creative API
failure leaves identity and Love Points usable.

## Phase 6 - Legacy reconciliation and migration rehearsal

**Status:** pending  
**Depends on:** Phases 1, 4, and 5

### Objective

Reconcile existing provider, Customer Core, POS, points, and Creative records
before any production mapping writes.

### Work

1. Snapshot exact record counts and stable identifiers from every owner using
   read-only exports from an approved non-production copy.
2. Produce deterministic classifications: exact subject link, new Customer
   Core record, legacy verified candidate, ambiguous, collision, and invalid.
3. Require human disposition for ambiguous/collision cases; retain before/after
   evidence and operator identity.
4. Rehearse migrations twice, interruption/retry, rollback, and restore.
5. Prove no points entry, Creative parent/child, package, session, purchase,
   receipt, consent, or provider subject is lost, duplicated, or reassigned.
6. Enable writes first in staging and later as a small production canary only
   after explicit authorization.

## Phase 7 - Staging quality and operations gates

**Status:** pending  
**Depends on:** Phases 1-6

### Objective

Prove member journeys, performance, security, observability, and recovery at
the integrated boundary.

### Work

1. Run Google and magic-link journeys for new, exact-linked, unconnected,
   ambiguous, disabled, and changed-email identities.
2. Exercise partial failures and recovery for provider, Customer Core, points,
   coupons, and Creative independently.
3. Run accessibility, responsive, Thai/English, cache, session-expiry, CSRF,
   authorization, IDOR, rate-limit, and sensitive-log checks.
4. Meet the exact handoff performance budgets at the specified percentile,
   device/network, warm/cold cache, and data-volume conditions.
5. Rehearse database restore and application rollback while retaining mappings
   and events created by the newer version.
6. Complete an owner-authorized browser acceptance pass in staging.

## Phase 8 - Controlled rollout and convergence

**Status:** pending; requires explicit deployment/DNS authorization  
**Depends on:** all earlier phases

### Objective

Launch without an all-systems big bang and retain a fast, data-safe rollback.

### Sequence

1. Stabilize provider and prevent the overlapping universal-member migration
   from deploying unchanged.
2. Deploy the versioned Creative summary API dark, then verify health and
   contract behavior without member traffic.
3. Deploy Customer Core mapping and Hub dark; run read-only reconciliation.
4. Enable staging traffic, then a small production identity canary.
5. Enable Love Points panel, then Creative panel independently behind kill
   switches.
6. Enable coupons as a separate canary only after redemption and reversal
   rehearsal passes.
7. Complete public terminal checks and separately authorized browser
   acceptance.
8. Change DNS/primary navigation only after restore rehearsal and explicit
   authorization.
9. Observe agreed error, latency, conflict, and mismatch windows before broad
   rollout.

### Rollback rule

Disable the affected panel or Hub traffic and revert application routing before
reverting schemas. Do not delete mapping, audit, or reconciliation records
created after cutover. Creative `/member` remains the product-level fallback
until an explicitly approved retirement gate passes.

## Completion contract

The project is complete only after every gate passes, both repositories pass
the same frozen contracts, migration counts reconcile, staging and production
checks pass, rollback/restore is rehearsed, and a fresh owner-requirements-to-
deployed-systems reconciliation passes after the final material change.
