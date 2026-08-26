# Cat vs Dog Member Score Reliability — Reconciliation

**State:** runtime commit `613c96a` deployed and publicly reconciled

**Reconciled:** 2026-08-27

**Creative runtime:** `613c96a` on production `main`

**Provider snapshot:** clean local and recorded `origin/main` at `60bb334`

## Direct requirement-to-repository audit

| Intended outcome | Exact repository evidence |
|---|---|
| One provider, Google and verified email, six-digit code, stable identity | Unchanged provider tree passed typecheck, lint, 47 unit/flow tests, both builds, and 15 PostgreSQL integrations covering code format, expiry, replay, convergence, and conflict behavior. |
| Creative signup remains independent of optional auth | The production-built disposable test passed connected and skipped signup, retained core records, rejected hostile origin, and kept unverified contact email separate. Optional schema/config failure remained explicit and core-writable. |
| Cat vs Dog guest/sign-in checkpoint is preserved | Both locale shells retain the post-game prompt, shared OIDC start, visible sign-out, established ad transition, and legacy direct-Google compatibility. Static and executable contracts pass. |
| Authenticated Cat vs Dog high scores are not silently lost | Game over now initiates save without waiting for the thank-you-screen click. `score-sync.js` persists the member-bound highest pending run before network I/O, retries transient failure, removes it only after a successful response, and flushes only for the same public player ID. EN/TH expose saving/retry/saved/pending status. |
| Server stores runs and derives each member's best | The unchanged authenticated score route inserts `game_runs` transactionally and returns `MAX(score)`/dense rank. A disposable migrated PostgreSQL check stored three runs for one player and one for another and returned the hand-checked 800/700 maxima and ranks 1/2. |
| Car Maze behavior is unchanged | Executed controller checks pass guest play through stage 19, Stage-20 auth before ads, progress retention, callbacks, retries, and milestone ordering in both locales. |
| No migration or production synthetic data | The release adds no schema file. All mutable tests used disposable local databases that were removed. No production member, identity, family, player, run, email, or interaction was created. |
| Privacy/cache/protocol boundaries remain | Auth reliability and member-release checks pass. Public provider readiness, discovery, JWKS, game configs, and the anonymous game session endpoint returned 200; session/config responses retained private no-store policy, and discovery remained Authorization Code + PKCE S256 + `openid email`. |

## Goal-drift result

The score repair does not change provider code, Creative registration data,
OIDC callback shape, membership consent, Cat vs Dog prompt timing, legacy auth,
Car Maze source, entitlements, or admin authorization. POS Member Hub and Master
Admin remain deferred exactly as required.

## Bounded production evidence

- Runtime commit `613c96a` is on production `main`; after Hostinger's restart,
  Creative readiness and the new `score-sync.js` returned HTTP 200.
- The deployed EN/TH Cat vs Dog shells load the new module and call score saving
  automatically from `gameOver` for an authenticated member.
- Creative signup/sign-in and Car Maze pages in EN/TH, both game auth configs,
  provider readiness/discovery/JWKS, and the leaderboard returned HTTP 200.
- No production member, identity, family, player, score, email, or OIDC
  interaction was created during verification.
- Browser/account/inbox journeys are not rerun because this request did not
  authorize Chrome, Google, inbox, Hostinger dashboard, or authenticated GUI
  access. The previously recorded real six-digit email journey remains valid
  evidence for the unchanged provider tree; terminal evidence cannot replace a
  new real Google journey.
