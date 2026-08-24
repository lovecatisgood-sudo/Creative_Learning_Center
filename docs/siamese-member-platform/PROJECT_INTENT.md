# Siamese Member Platform — Project Intent

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
