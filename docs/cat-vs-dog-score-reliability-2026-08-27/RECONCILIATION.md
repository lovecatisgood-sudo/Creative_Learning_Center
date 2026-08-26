# Cat vs Dog Member Score Reliability — Reconciliation

**State:** pre-deployment source reconciliation passes; production gate pending

**Reconciled:** 2026-08-27

**Creative base:** `a2bb8bb` / freshly fetched `origin/main`

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
| Privacy/cache/protocol boundaries remain | Auth reliability and member-release checks pass. Provider claims/scopes and no-store behavior are unchanged; public production confirmation remains G7. |

## Goal-drift result

The score repair does not change provider code, Creative registration data,
OIDC callback shape, membership consent, Cat vs Dog prompt timing, legacy auth,
Car Maze source, entitlements, or admin authorization. POS Member Hub and Master
Admin remain deferred exactly as required.

## Remaining gates before a live completion claim

- Commit and push the reviewed Creative tree to production `main`.
- Observe the deployed score-sync asset and EN/TH shell integration publicly.
- Recheck provider/Creative health, discovery, JWKS, game configs, sanitized
  auth starts, leaderboard availability, and cache policy without mutations.
- Browser/account/inbox journeys are not rerun because this request did not
  authorize Chrome, Google, inbox, Hostinger dashboard, or authenticated GUI
  access. The previously recorded real six-digit email journey remains valid
  evidence for the unchanged provider tree; terminal evidence cannot replace a
  new real Google journey.
