# Siamese Cat Member Hub — Project Intent

**Planning status:** local plan only; no application, schema, DNS, or deployment
change is authorized by this document.

## Ultimate goal

Deliver `members.siamesecat.cafe` as the single member-facing Siamese Cat hub.
A person signs in through the shared Siamese Cat OIDC provider, is resolved to
exactly one Customer Core record, can see Love Points, and can see a safe
Creative Club summary without moving identity, loyalty, or Creative records out
of their owning systems.

## Authoritative sources

- The owner's handoff summary supplied in the current conversation on
  2026-08-23.
- `45_UNIFIED_SIAMESE_MEMBER_PLATFORM_PLAN.md`, especially Section 12, once the
  file is copied into or otherwise made readable from this workspace. The file
  is not currently present in this checkout, so none of its exact contracts or
  numeric targets may be guessed during implementation.
- [`MEMBER_SYSTEM_PRD_V3.md`](../../MEMBER_SYSTEM_PRD_V3.md) for existing
  universal identity and product-boundary invariants.
- [`MEMORY.md`](../../../MEMORY.md) for production, migration, health, and
  explicit-error safeguards.
- The current Creative portal/data behavior in `src/app/member/`,
  `src/lib/member-data.ts`, and `src/db/schema.ts`.
- The identity-provider rules in
  [`Login_with_Siamese_member_Oauth/AGENTS.md`](../../../Login_with_Siamese_member_Oauth/AGENTS.md).

## Non-negotiable invariants

- The cross-system identity key is exactly `(OIDC issuer, OIDC subject)`. Email,
  phone, name, public member ID, and Creative parent ID are mutable attributes
  or references, never cross-system identity keys.
- The identity provider authenticates. It does not own Customer Core, Love
  Points, Creative parents/children, packages, purchases, bookings, scores, or
  entitlements, and none of those data enter OIDC tokens.
- Customer Core owns the hub's customer record and OIDC-to-customer mapping.
- The POS/loyalty domain owns Love Points balances and ledger entries. The hub
  does not calculate an authoritative balance from copied events.
- A named coupon/benefit service owns coupon campaigns, eligibility, issuance,
  redemption, reversal, and audit. The hub does not infer discounts from
  identity or points.
- Creative Club owns guardian, child, package, session, purchase, receipt, and
  consent data. The hub consumes only the approved versioned Creative summary
  contract.
- The existing Creative `/member` portal is a product portal, not the new
  universal hub. It remains operational until an explicit, tested migration or
  redirect phase says otherwise.
- No repositories or schemas are merged directly. Integration occurs through
  stable OIDC identity and versioned service contracts.
- Existing identities are reconciled before any production mapping writes.
  Ambiguous matches are quarantined for human review; they are never silently
  merged by email or phone.
- A Creative or Love Points outage must not invalidate an authenticated hub
  session or appear as an empty/zero balance. Each unavailable panel shows an
  explicit retryable operational state with a correlation reference.
- Optional hub or integration schema must never disable Creative signup,
  directory/search, checkout, sessions, receipts, or provider authentication.
- Migrations are additive, idempotent, transaction-safe, count-verified,
  guarded at runtime, observable through health, and reversible without
  deleting newly created records.
- Member and child data follow least privilege, data minimization, PDPA-aware
  logging, and explicit authorization checks. Tokens, secrets, cookies, and
  child/CRM payloads never enter logs or analytics.
- Production, DNS, database writes, secret changes, client registration, and
  browser/GUI acceptance require their own explicit authorization.
- Completion means deployed and verified on the public production URL. A local
  implementation must be labelled `local only, not live`.

## Required member outcomes

- Sign in once at `members.siamesecat.cafe` with the shared Siamese Cat
  provider and retain a secure, hub-owned session.
- See a recognizable member identity without exposing internal database IDs.
- See the authoritative Love Points balance and recent point activity, with
  clear pending/reversed/expired semantics supplied by the owning system.
- See available, used, and expired discount coupons or membership benefits with
  owner-supplied eligibility, terms, expiry, and redemption state.
- See whether a Creative Club profile is connected and, when connected, the
  safe summary allowed by the Creative API contract.
- Reach Creative Club details/actions through an explicit product handoff
  rather than duplicated write logic in the hub.
- Receive useful partial results when one product service is unavailable.
- Never lose or duplicate history during account linking or legacy
  reconciliation.

## Explicit exclusions for the first production release

- Moving provider tables, Creative tables, or the points ledger into the hub.
- Email- or phone-only automatic account merging.
- Cross-product entitlement encoded in identity claims.
- Hub writes to Creative parent, child, package, session, purchase, or consent
  records.
- Hub-side point award, redemption, adjustment, expiration, or reversal.
- Hub-side coupon eligibility, issuance, redemption, reversal, or discount
  calculation.
- Replacing Creative staff/manager or master-member administration surfaces.
- Global logout, refresh tokens, public/native clients, dynamic OIDC client
  registration, or new delegated OIDC scopes without a separate threat review.
- DNS or production cutover before all release gates and explicit approval.

## Ambiguities that must be resolved before implementation

1. The actual location and exact contents of
   `45_UNIFIED_SIAMESE_MEMBER_PLATFORM_PLAN.md`.
2. Which repository/service is Customer Core and which tables/API constitute
   the authoritative Love Points ledger.
3. Which service owns coupon/benefit campaigns, eligibility, issuance,
   redemption, reversal, and audit.
4. The exact versioned Creative summary route, authentication mechanism,
   schema, field-level child-data policy, error envelope, timeout, and version
   retirement rules.
5. The handoff's exact numeric performance targets.
6. Whether `members.siamesecat.cafe` is a new deployment or an existing POS
   application route, and which repository owns it.
7. The approved Thai/English copy and final visual treatment.

These are release-blocking contract questions, not permission to collapse
ownership boundaries or infer matches from mutable data.
