# Siamese Cat Member Hub — Acceptance Gates

Evidence remains `pending` until the stated check runs against the named
environment. Planned command names may be implemented in the owning repository
after Phase 0 identifies it.

## Contract and ownership

- [ ] **H0.1 — Authoritative handoff is present and reconciled.**  
  **Check:** checksum the readable `45_UNIFIED_SIAMESE_MEMBER_PLATFORM_PLAN.md`
  and compare every Section 12 instruction with `PROJECT_INTENT.md` and
  `PLAN.md`.  
  **Expected:** exact API, performance, security, rollout, and ownership terms
  are mapped; conflicts are explicitly resolved.  
  **Evidence:** pending; source file is absent from this workspace.

- [ ] **H0.2 — Every datum has one system of record.**  
  **Check:** architecture review of schema/API inventory.  
  **Expected:** provider owns authentication; Customer Core owns customer
  mapping; loyalty owns points; Creative owns family/service data; Hub owns
  composition/session only; no duplicated writable authority.  
  **Evidence:** pending.

- [ ] **H0.3 — Shared contracts are consumer-tested.**  
  **Check:** run producer and consumer contract suites from the same versioned
  fixtures.  
  **Expected:** both repositories accept valid fixtures and reject incompatible
  versions, extra-sensitive fields, missing required fields, and malformed
  error envelopes.  
  **Evidence:** pending.

## Identity and Customer Core

- [ ] **H1.1 — Stable identity mapping uses only `(iss, sub)`.**  
  **Check:** integration fixtures change email, phone, and name while retaining
  subject; then reuse an email across two different subjects.  
  **Expected:** mutable changes retain the same customer; reused contact data
  never merges subjects.  
  **Evidence:** pending.

- [ ] **H1.2 — Mapping schema is additive and idempotent.**  
  **Check:** apply migration twice to a disposable production-shaped database,
  run exact schema verifier, and simulate optional readiness failure.  
  **Expected:** second run is a no-op; unique `(issuer, subject)` exists;
  readiness is explicit; POS and Creative core operations remain functional.
  
  **Evidence:** pending.

- [ ] **H1.3 — Ambiguous identities are quarantined.**  
  **Check:** fixtures for email collision, phone collision, conflicting legacy
  links, and subject already mapped elsewhere.  
  **Expected:** no record mutates; conflict is auditable and requires human
  disposition.  
  **Evidence:** pending.

- [ ] **H1.4 — OIDC and hub sessions fail closed.**  
  **Check:** wrong issuer/audience/signature/redirect/nonce/state/PKCE verifier,
  expired/replayed code, fixation attempt, and disabled account.  
  **Expected:** authorization is denied without mapping or session creation;
  logs contain no token, secret, code, cookie, or sensitive claims.  
  **Evidence:** pending.

## Member experience and failure isolation

- [ ] **H2.1 — Hub displays distinct operational states.**  
  **Check:** UI/integration fixtures for loading, not connected, real zero, no
  activity, timeout, invalid response, and service recovery.  
  **Expected:** errors never appear as empty data or zero; retry and correlation
  reference are available where appropriate.  
  **Evidence:** pending.

- [ ] **H2.2 — Product failures are isolated.**  
  **Check:** independently fail Customer Core profile, loyalty, and Creative
  summary dependencies.  
  **Expected:** unaffected panels remain usable; an authenticated Hub session
  is not destroyed by a product-service outage.  
  **Evidence:** pending.

- [ ] **H2.3 — Thai/English responsive accessibility passes.**  
  **Check:** automated accessibility suite plus manual keyboard, screen-reader,
  390px mobile, tablet, and desktop inspection in both languages.  
  **Expected:** WCAG 2.2 AA acceptance scope, visible focus, no clipped primary
  content, 44px targets, and meaningful localized error/status copy.  
  **Evidence:** pending.

## Love Points

- [ ] **H3.1 — Balance is authoritative and correctly qualified.**  
  **Check:** compare Hub output with loyalty API fixtures covering available,
  pending, reversed, adjusted, and expired entries.  
  **Expected:** exact owner-supplied balance and semantics; no recomputation from
  Creative orders and no stale value labelled current.  
  **Evidence:** pending.

- [ ] **H3.2 — Loyalty errors never become zero points.**  
  **Check:** force timeout, 401/403, 404 mapping mismatch, 429, 500, malformed
  payload, and incompatible contract version.  
  **Expected:** safe explicit unavailable/mismatch state; retry is bounded;
  correlation is preserved.  
  **Evidence:** pending.

## Coupons and benefits

- [ ] **H4.1 - Coupon ownership and lifecycle are authoritative.**  
  **Check:** contract fixtures for eligible, ineligible, available, reserved,
  used, reversed, exhausted, and expired benefits.  
  **Expected:** every state and term comes from the owning service; the Hub
  never calculates eligibility or discount value.  
  **Evidence:** pending; owning service is not identified.

- [ ] **H4.2 - Redemption proof cannot be copied or replayed.**  
  **Check:** attempt screenshot reuse, token replay, cross-member use,
  cross-campaign use, expiry, concurrent redemption, and reversal.  
  **Expected:** only one authorized redemption succeeds; repeated and mismatched
  attempts reveal no member data and create auditable safe failures.  
  **Evidence:** pending.

- [ ] **H4.3 - Coupon failure is explicit and isolated.**  
  **Check:** force timeout, authorization failure, rate limit, invalid payload,
  and owner outage.  
  **Expected:** coupon panel shows a retryable unavailable state; identity,
  points, and Creative remain usable.  
  **Evidence:** pending.

## Creative summary

- [ ] **H5.1 - Creative resolves only verified subject links.**  
  **Check:** valid active link, no link, revoked link, duplicate/conflict, same
  email with different subject, and changed email fixtures.  
  **Expected:** data returns only for the active exact `(iss, sub)` link; other
  cases reveal no family data.  
  **Evidence:** pending.

- [ ] **H5.2 - Creative payload is minimal and versioned.**  
  **Check:** schema allow-list and snapshot tests against the exact handoff
  contract.  
  **Expected:** only approved member-facing fields, contract version, freshness,
  and safe errors; no health notes, internal IDs, staff data, consents, secrets,
  or unrelated children.  
  **Evidence:** pending.

- [ ] **H5.3 - Existing Creative flows do not regress.**  
  **Check:** full signup, empty-query admin directory, search failure UI,
  checkout, active session, package, receipt, `/member`, permission matrix,
  startup compatibility, and health suite with summary schema/API both present
  and forced unavailable.  
  **Expected:** identical core behavior; optional summary failure is isolated
  and visible only in its own health/panel state.  
  **Evidence:** pending.

## Migration and reconciliation

- [ ] **H6.1 - Dry-run classification covers every source record.**  
  **Check:** compare source totals with exact + new + ambiguous + conflict +
  invalid classifications.  
  **Expected:** totals reconcile exactly; report is repeatable; dry run makes no
  writes.  
  **Evidence:** pending.

- [ ] **H6.2 - Migration preserves all owned histories.**  
  **Check:** pre/post checksums and exact counts for provider subjects, Customer
  Core customers, point entries, Creative parents/children/packages/sessions/
  purchases/receipts/consents, and identity links.  
  **Expected:** no loss, duplicate, reassignment, false entitlement, or balance
  change.  
  **Evidence:** pending.

- [ ] **H6.3 - Retry, rollback, and restore are data-safe.**  
  **Check:** interrupt migrations at each checkpoint, rerun, roll application
  version back, and restore a staging backup.  
  **Expected:** idempotent convergence; old application remains operable; new
  mapping/audit records are retained; documented recovery time/objective pass.
  
  **Evidence:** pending.

## Security, performance, and staging

- [ ] **H7.1 - Authorization and privacy tests pass.**  
  **Check:** IDOR/cross-member matrix, downstream credential exposure check,
  CSRF, CSP, rate limit, cache isolation, log/analytics redaction, and child-data
  allow-list review.  
  **Expected:** no member can access another member's data; secrets/tokens and
  sensitive child/CRM fields do not reach browser logs, server logs, caches, or
  analytics.  
  **Evidence:** pending.

- [ ] **H7.2 - Exact handoff performance targets pass.**  
  **Check:** run the handoff-defined load/browser test at its exact percentile,
  device/network, cache, concurrency, and dataset conditions.  
  **Expected:** every numeric target from
  `45_UNIFIED_SIAMESE_MEMBER_PLATFORM_PLAN.md` passes independently for shell,
  Customer Core, Love Points, and Creative summary.  
  **Evidence:** blocked until the handoff file is readable; numeric targets must
  not be invented.

- [ ] **H7.3 - Staging journeys pass.**  
  **Check:** owner-authorized browser acceptance for both auth methods and new,
  linked, unconnected, ambiguous, changed-email, disabled, partial-outage, and
  recovered members in Thai and English.  
  **Expected:** correct customer mapping, points, Creative state, navigation,
  and error recovery with no duplicate records.  
  **Evidence:** pending; browser access requires action-specific permission.

## Production release

- [ ] **H8.1 - Independent health and kill switches work.**  
  **Check:** failure/recovery drill for provider, mapping, points, Creative API,
  and Hub; toggle product panels independently.  
  **Expected:** health identifies the failing owner; disabling one integration
  preserves the rest of the Hub and all Creative/POS core flows.  
  **Evidence:** pending.

- [ ] **H8.2 - Production rollout and rollback pass.**  
  **Check:** approved canary rollout, public read-only terminal verification,
  separately approved browser acceptance, monitoring window, and application
  rollback.  
  **Expected:** public URL is healthy, error/latency/conflict thresholds remain
  inside the frozen limits, and rollback preserves new data.  
  **Evidence:** pending; deployment, DNS, and browser actions require explicit
  authorization.

- [ ] **H8.3 - Fresh cross-repository reconciliation passes.**  
  **Check:** after the final material change, compare the owner's original
  handoff directly with provider, Customer Core, loyalty, Creative, Hub,
  migrations, tests, deployed contracts, and production health.  
  **Expected:** every invariant and outcome is satisfied or explicitly accepted
  as excluded; no known mismatch and no later change invalidates the audit.  
  **Evidence:** pending.
