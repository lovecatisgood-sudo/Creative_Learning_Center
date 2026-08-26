# Cat vs Dog Member Score Reliability — Project Intent

## Goal

Deploy the Cat vs Dog score-persistence repair without changing the established
Siamese Cat signup and sign-in behavior across the currently released apps.

## Authoritative sources

- The owner's 2026-08-27 instruction to verify all released login/signup flows,
  preserve their intended behavior, commit, and deploy.
- Root `MEMORY.md` current authentication checkpoint.
- Root `SIAMESE_AUTH_DEPLOYMENT_STATE_2026-08-24.md` current section.
- `MEMBER_SYSTEM_PRD_V3.md` and `CAR_MAZE_REQUIREMENTS.md`.
- The actual provider, Creative, Cat vs Dog, and Car Maze source and tests.

## Non-negotiable outcomes

- Google and verified email, including the six-digit email code, resolve through
  the Siamese provider to one stable identity without silent duplication.
- Creative registration persists whether membership is connected, skipped, or
  temporarily unavailable; optional authentication never disables core signup.
- Cat vs Dog remains guest-playable. Signed-out players are prompted only at the
  established post-game checkpoint; signed-in players are not re-prompted.
- A completed authenticated Cat vs Dog run saves automatically. Transient
  failures retry, the highest unsaved run survives reload, failures are visible,
  and one member can never inherit another member's pending score.
- Cat vs Dog's legacy compatibility path and sign-out remain available.
- Car Maze remains guest-playable through stages 1–19 and authenticates at
  Stage 20 without losing progress or changing its ad ordering.
- Auth responses remain private/no-store and downstream OIDC scope remains
  `openid email` with Authorization Code and PKCE S256.
- No synthetic production member, identity, family, game player, run, email, or
  OIDC interaction is created for deployment verification.

## Scope and exclusions

In scope: the unchanged identity provider contract, Creative signup/linking,
Cat vs Dog authentication and score persistence, Car Maze Stage-20 auth, build,
commit, deployment, and terminal-only public verification.

Out of scope: POS Member Hub and Master Admin deployment, entitlement changes,
database migration, authenticated staff/admin QA, credential changes, and any
browser, Google-account, inbox, Hostinger-dashboard, or GUI access without new
action-specific permission.
