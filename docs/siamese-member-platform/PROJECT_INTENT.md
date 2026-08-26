# Siamese Member Platform — Project Intent

## Active production authentication reliability repair — 2026-08-26

### User outcome

Creative Club parents must be able to finish optional Siamese membership
connection after signup and later from the member portal with either Google or
verified email. A failure must identify a safe, retryable operational stage;
it must never be reported as “email sent”, “empty”, or “linked” when that stage
did not succeed.

### Proven incident causes to remove

- Creative's stateful member-connect start response is currently cacheable by
  the production CDN. A cached unauthenticated redirect is served even when a
  valid Creative link cookie is present, so neither provider method is reached.
- Creative's legacy email endpoint treats an unbound contact email and an SMTP
  failure as the same successful response, while its client ignores non-2xx
  status. Existing production registrations therefore see a false success.
- Provider email links depend on the original OIDC interaction browser. Mail
  applications commonly open links in a different browser context, leaving no
  usable completion path in the original interaction.
- Provider throttling records suppressed requests as fresh requests, extending
  the suppression window after retries.
- Provider token lifetime can exceed its owning interaction lifetime.
- Creative callbacks pass the request's potentially rewritten internal origin
  to the OIDC client instead of the configured public callback origin.
- Provider runtime identity resolution still reads Creative operational member
  tables despite the locked boundary that Creative owns those records and the
  provider authenticates independently.
- Current readiness proves configuration presence but not the exact auth
  release or Creative auth-path readiness, obscuring production drift.

### Repair invariants

- Every auth start, callback, and sensitive auth API response is private and
  non-cacheable at both application and surrogate/CDN layers; cookie-varying
  responses explicitly vary on `Cookie`.
- Creative contact email remains unverified product contact data. It is never
  silently promoted into login identity merely to make legacy magic link work.
- Unknown-email responses remain enumeration-safe. A real mail transport
  failure for an eligible account is a visible retryable error, not false
  success, and neither server logs nor responses expose the address or token.
  This deliberately permits a narrow eligibility inference only while the mail
  service is failing; returning the generic success in that case would recreate
  the incident's false-delivery claim.
- The provider continues to offer a single-use email link and also supplies a
  high-entropy one-time code that can be entered in the original interaction
  browser when the mail link opens elsewhere. Code and link share expiry,
  replay protection, attempt limits, and identity-resolution rules.
- Google remains Authorization Code + PKCE S256, requests only `openid email`,
  validates immutable Google `sub` before email, and quarantines conflicts.
- Provider authentication must be ready without `parents`, `children`, or
  Creative `member_accounts` tables. Historical optional link identifiers may
  be retained, but runtime sign-in cannot depend on Creative data.
- The provider owns its verified primary identity email. Creative owns its
  product-local contact/member email and may use it as local compatibility
  evidence, but changing Creative contact data must not silently mutate the
  universal provider identity. A verified Google email update may change the
  provider-owned email while immutable Google `sub` preserves the subject.
- Creative registration, directory, checkout, packages, sessions, and guest
  game progress remain independent of optional provider availability.
- No browser, browser profile, Hostinger dashboard, Google Console, or
  authenticated GUI surface is accessed without new action-specific approval.
- “Fixed” remains reserved for a deployed release plus public verification and
  controlled real Google and email journeys. Until then the result is labelled
  local-only or deployed-but-journey-pending precisely.

### Scope boundaries for this repair

In scope: Creative signup/member connection, Creative legacy member email
sign-in behavior, shared game OIDC handoffs affected by the same response and
callback helpers, provider email/Google runtime, readiness, schema migration,
tests, operations evidence, and a reversible release candidate.

Out of scope: Master Admin, POS Member Hub rollout, entitlement changes,
Creative staff/manager authorization redesign, destructive data repair,
credential rotation, and any account-dashboard action.

## Ultimate goal

Make one Siamese Cat Member identity a universal pass for approved public
Siamese products, with Google and email-magic-link authentication, durable
cross-product history, optional linking during Creative Club registration, and
a separate master membership administration surface.

## Authoritative sources

- Product-owner requirements stated on 2026-08-21 in the current project
  conversation.
- [`MEMBER_SYSTEM_PRD_V3.md`](../../MEMBER_SYSTEM_PRD_V3.md).
- Existing Creative Club authorization and business behavior in this
  repository.
- Root [`MEMORY.md`](../../../MEMORY.md) production safeguards.
- Provider invariants in
  [`Login_with_Siamese_member_Oauth/AGENTS.md`](../../../Login_with_Siamese_member_Oauth/AGENTS.md)
  and the provider repository.
- Car Maze flow in [`CAR_MAZE_REQUIREMENTS.md`](../../CAR_MAZE_REQUIREMENTS.md).

## Non-negotiable invariants

- Siamese membership is universal identity, not a parent profile or product
  entitlement.
- Google and magic link resolve through one provider and stable subject.
- Existing working authentication remains available throughout migration; no
  legacy route is retired until its replacement has passed the complete live
  production journey and a reversible compatibility window.
- Creative parent/child registration is allowed with or without membership.
- Existing Creative `staff` and `manager` authorization is preserved.
- The Siamese Member Admin Dashboard has separate authorization and sessions.
- A member can retain multiple current and historical product relationships.
- Game-only members never require fake parent, child, phone, or package data.
- No silent merge on unverified or conflicting evidence.
- Optional identity/provider failure never takes down Creative core flows.
- Schema changes are additive, guarded, verified, compatible, and observable.
- Failed data requests are explicit operational errors, never empty results.

## Required outcomes

- Provider UI offers Google and email magic link.
- Creative signup prompts for membership and supports skip/pending/link-later.
- Cat vs Dog and Car Maze use the same provider at their established gates.
- Every member appears in the separate master dashboard with full retained
  product relationship history.
- Existing identities and product records migrate without duplication or data
  loss.
- Every intended production app is deployed and verified with both provider
  methods before the platform is represented as complete; local-only or
  prototype behavior is never accepted as the final outcome.

## Explicit exclusions

- Universal cross-product member-facing dashboard in this scope; the existing
  Creative Club member portal remains preserved.
- Creative staff/admin redesign or permission expansion.
- Paid entitlement based on identity alone.
- Sensitive CRM/game data in OIDC tokens.
- Browser-only, public/native, dynamic, or third-party OAuth clients.

## Deferred reversible choices

- Final hostname and repository name for the separate master dashboard.
- Visual design system for the master dashboard.
- The exact compatibility-window duration for legacy member/game sessions.

These choices do not alter the locked data, identity, authorization, or product
boundaries and must be resolved before their owning implementation phase.
