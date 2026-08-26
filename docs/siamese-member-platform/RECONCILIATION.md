# Siamese Member Platform — Authentication Reliability Reconciliation

**Reconciled:** 2026-08-26
**Release state:** provider `6acaafd` and Creative `6aeb362` are deployed on
production `main`; local, disposable-database, and safe public terminal evidence
passes
**Source of truth:** `MEMBER_SYSTEM_PRD_V3.md`, `PROJECT_INTENT.md`, repository
instructions, and the 2026-08-26 incident evidence

## Outcome at this checkpoint

The deployed release satisfies AR0–AR11 and this fresh AR13 reconciliation.
AR12 remains open because a real Google account and real inbox journey were not
run and cannot be inferred from readiness or automated fixtures. Accordingly,
the repaired runtime is deployed and publicly verified, but the complete real
authentication journey is not claimed fixed.

## Final release mapping

| Required outcome | Release evidence |
|---|---|
| Stateful auth is never CDN-shared | Creative starts/callbacks are dynamic; POST is the canonical mutation; GET remains a no-store compatibility route; application, CDN, and surrogate policies are private/no-store and vary on cookies. The production-built route probe passes for trusted/hostile origins and cookie/no-cookie requests. |
| Public callback URL is exact | Member and game callbacks replace internal scheme/host with the configured public origin while preserving path/query. A failed OIDC validation retains the bounded transaction; successful validation consumes it once. |
| Legacy email is truthful | Only a verified Creative member identity is eligible. Unknown email remains generic 202. Schema/SMTP/rejected-recipient failures return retryable 503, remove the new token, log only fixed stage codes, and the UI checks `response.ok`. The narrow outage-only eligibility inference is accepted to avoid false success. |
| Optional auth cannot break signup | A production-built disposable test preserves exact parent/child/member/consent counts for connect and skip, writes no verified identity, and rejects hostile-origin requests without writes. Optional link-schema failure leaves core registration writable. |
| Mail-app handoff is usable and safe | Provider mail includes a one-time link and a hashed ten-character code bound to the original interaction. Cross-context link landing cannot complete another interaction; code entry in the original context shares expiry/replay and locks after five failures. |
| Lifetimes and throttling recover | Suppressed retries no longer refresh the accepted-request timestamp. The verifier expires at the shorter of configured token TTL and owning interaction TTL. Creative and provider transaction/cookie lifetimes cover the bounded flow. |
| Provider is operationally independent | Provider runtime and migrations no longer require Creative `parents`, `children`, or `member_accounts`. Provider-owned email is not silently mutated by Creative contact changes. Simultaneous first-time email and Google verification serialize on the same normalized-email lock and converge on one subject. |
| Google failures are diagnosable without leaking auth material | Token transport, token validation, JWKS/JWT claims, interaction, identity conflict, and completion use fixed safe stage codes. Callback access logs and provider bodies are not emitted. |
| Core and optional readiness are distinct | Both applications expose `2026-08-26-auth-reliability`. Creative reports optional auth configuration/schema/readiness without making provider availability a core-health dependency. Provider reports schema 5, mail/config readiness, verifier TTLs, and that Creative operational tables are not required. |
| Compatibility is preserved | Creative core business flows and game progress remain independent. Legacy game Google compatibility remains available; shared OIDC checkpoints and the Creative legacy member-email path are hardened rather than silently retired. |

## Fresh verification evidence

- Creative production build completes with 47 routes. Final auth-reliability,
  Siamese game, member-release, signup-isolation, Creative-link, and member
  system checks pass; disposable checks preserve protected business/game rows.
- Provider `npm run verify` passes typecheck, lint, 46 unit tests with 27
  database-only skips, and both builds. All 15 disposable PostgreSQL
  integrations pass, including forced simultaneous email/Google convergence.
- The exact provider `hostinger:build` applies migrations 0001–0005 to an empty
  provider-only database and reapplies idempotently. Built `node server.js`
  reports release `2026-08-26-auth-reliability`, schema 5, database/mail/Google
  configuration ready, and no Creative-table dependency. Discovery advertises
  only Authorization Code, PKCE S256, and scopes `openid email`; public JWKS is
  RS256-only; the missing-parameter Google callback is a controlled no-store
  HTTP 400. The disposable database was removed after verification.
- A final security review found no high-severity issue. Three medium findings
  were fixed with regression coverage: CSRF lifetime coverage, callback
  transaction destruction after validation, and reconciliation of stale
  Creative link targets to the current member. The fourth is the documented
  outage-only enumeration tradeoff above.

## Public production evidence

- Provider readiness returns HTTP 200 with release
  `2026-08-26-auth-reliability`, schema 5, eight clients, database/mail/Google
  configuration and verification-code readiness true, 600-second effective
  verifier/interaction lifetimes, and no Creative operational-table dependency.
- Provider discovery uses exact issuer `https://id.siamesecat.cafe`, advertises
  only Authorization Code, PKCE S256, and scopes `openid email`. Public JWKS is
  RS256 public material only. A missing-parameter Google callback returns the
  controlled no-store HTTP 400 page rather than platform 404/503.
- Creative health returns HTTP 200 with the same release marker and core,
  member, game, Creative schema, and Creative auth readiness true. The
  unauthenticated trusted POST and compatibility GET auth starts return 303 to
  first-party sign-in; hostile-origin POST returns 403. Responses carry private,
  application/CDN/surrogate no-store and no-referrer policies. Hostinger did not
  echo the local `Vary: Cookie` header on these redirects, but repeated identical
  GETs without request cache bypass produced `MISS`, never `HIT`; POST is the
  canonical stateful start and was `DYNAMIC`.
- Public game auth config reports shared login enabled for Cat vs Dog and Car
  Maze against the exact provider issuer. Both live Car Maze locale controllers
  exactly match the verified Stage-20 source SHA-256. Both Cat vs Dog locale
  shells exactly match the verified source after the route's documented
  locale-specific `<base>` injection, preserving the post-game/post-ad gate and
  legacy fallback source.
- No production synthetic parent, child, member, identity, game player, OIDC
  interaction, or email was created for verification. No browser, GUI,
  authenticated dashboard, inbox, secret file, or secret value was accessed.

## Deliberately open evidence

- One controlled real Google journey and one controlled real inbox link/code
  journey through Creative remain mandatory. Terminal, mock-mail, or database
  tests cannot close that gate, and no browser/profile/inbox access is implied.
- Master Admin, POS Member Hub rollout, entitlement changes, credential
  rotation, destructive data repair, and account-dashboard work remain outside
  this repair.
