# Siamese Member Platform — Final Source Reconciliation

**Reconciled:** 2026-08-23  
**Source of truth:** `MEMBER_SYSTEM_PRD_V3.md`  
**Local acceptance:** 23 of 27 gates passed

## Outcome

The repository implementation now matches the V3 universal-identity model.
One provider subject can own email and Google authentication methods, retain
multiple current/historical products, and link to optional Creative and game
profiles without receiving product entitlement from identity alone.

The separate master-admin service is implemented under
`Login_with_Siamese_member_Oauth/apps/member-admin`. It has its own credentials,
cookie, CSRF key, origin, health checks, directory, filters, paginated login
history, Creative/game summaries, conflict queue, disable, transactional merge,
and audit trail. Creative staff/manager sessions do not authorize it.

Creative signup saves its parent, children, and Creative consent before any
optional provider work. Skip, unavailable/pending, retry, and link-later states
are present. Cat vs Dog and Car Maze use distinct confidential clients and the
same shared Google-or-magic-link provider at their existing checkpoints. The
old direct game Google endpoint is retired with an explicit HTTP 410.

## Invariant mapping

| V3 invariant | Repository evidence |
|---|---|
| Identity is not a Creative profile or entitlement | Universal provider tables are independent of `parents`, `children`, packages, scores, and grants; minimal-claim tests pass. |
| Google and email converge safely | Immutable Google `sub`, verified-email convergence, collision quarantine, state/PKCE/nonce/replay checks, and dual-method DB tests pass. |
| Product history is durable | Trusted client-to-product registry, relationship summary, append-only login events, active/historical states, and three-client tests pass. |
| Creative membership is optional | Signup UI/API supports connect/skip; HTTP unavailable test retained both families; link-later preservation test passes. |
| Existing game history survives | Legacy Google player migrates by provider subject; exact player/run counts remain unchanged; each game receives its own profile link. |
| Master administration is separate | Independent service/config/schema/session/CSRF/credential/health; cross-cookie and forced-backend-error tests pass. |
| No silent conflict merge | Provider collisions quarantine; Creative link conflicts roll back; admin merge rejects conflicting auth/profile evidence and audits valid merges. |
| Optional failure cannot masquerade as empty | Creative optional readiness returns pending/retry; master directory returns HTTP 503 with correlation reference. |

## Remaining cutover evidence

Four gates deliberately remain open because they require configured staging or
deployed services, real callback URLs, and an approved browser/operations
session:

1. G4.1 — complete connected Creative signup through both Google and email.
2. G4.5 — execute the complete pre/post Creative staff-manager HTTP matrix.
3. G5.1 — execute Cat vs Dog finish/ad/next-game journeys through both methods.
4. G7.2 — execute deployed provider/Creative/admin failure and recovery drill.

No production hostname, secret, client registration, migration, deployment, or
browser/account surface was changed during local completion.
