# Cat vs Dog Member Score Reliability — Gates

- [x] **G1 — Score persistence is durable and member-isolated.**
  - Check: `node scripts/check-game-score-persistence.mjs`
  - Expect: automatic submission contract, retry, recovery, highest-pending
    preservation, and cross-member isolation pass.
  - Evidence: focused VM contract passed automatic submission, three-attempt
    transient recovery, durable pending recovery, highest-score preservation,
    visible status events, and cross-member isolation.
- [x] **G2 — Cat vs Dog auth and game behavior remain intact in EN and TH.**
  - Check: game feature, Siamese auth, and route checks.
  - Expect: guest flow, post-game prompt, sign-out, legacy fallback, ads,
    analytics, assets, and route serving pass.
  - Evidence: game feature, Siamese game auth, and generic route checks passed
    for both locales after the score integration.
- [x] **G3 — Provider signup/sign-in remains intact.**
  - Check: provider `npm run verify` and PostgreSQL integrations.
  - Expect: typecheck, lint, builds, six-digit code, Google/email convergence,
    consent, expiry, replay, conflict, and protocol tests pass.
  - Evidence: provider typecheck, lint, 47 unit/flow tests, both builds, and all
    15 PostgreSQL integration tests passed from the clean `60bb334` snapshot.
- [x] **G4 — Creative signup and member linking remain failure-isolated.**
  - Check: auth reliability, signup isolation, member system/release, and
    Creative-link checks against disposable databases.
  - Expect: connect/skip/pending paths, core record preservation, explicit
    errors, and identity linking pass.
  - Evidence: auth reliability and member-release contracts passed. Disposable
    PostgreSQL checks passed member ownership/consent/tokens, production-build
    signup connect/skip durability and hostile-origin rejection, optional-auth
    isolation, link-later preservation, migration, and conflict handling.
- [x] **G5 — Car Maze retains its established checkpoint.**
  - Check: `node scripts/check-car-maze-flow.mjs`.
  - Expect: guest stages 1–19, Stage-20 auth, progress, and ad ordering pass.
  - Evidence: both-locale controller execution passed guest-first stages 1–19,
    Stage-20 auth ordering, progress retention, and ten-stage ad milestones.
- [x] **G6 — Production build and repository hygiene pass.**
  - Check: `npm run build`, `git diff --check`, status/diff inspection, and
    secret-pattern review.
  - Expect: 47-route build, no whitespace errors, no unintended/generated
    changes, and no credentials or personal data in the commit.
  - Evidence: full Next.js production build compiled, linted, typechecked, and
    generated all 47 routes. `git diff --check` passed; exact status/diff review
    found only the intended score implementation, tests, package script, and
    release evidence files. The disposable database was removed.
- [x] **G7 — Production promotion is publicly observable without mutations.**
  - Check: push to `origin/main`, poll public health/source/config/protocol and
    released signup/sign-in pages.
  - Expect: deployed commit source is served, both apps report ready, provider
    advertises Authorization Code + PKCE S256 + `openid email`, and no synthetic
    production data is created.
  - Evidence: runtime commit `613c96a` was pushed to production `main`.
    Creative and provider readiness returned 200; provider discovery advertised
    only Authorization Code, PKCE S256, and `openid email`; JWKS, both game auth
    configs, leaderboard, and all released signup/sign-in/game pages returned
    200. The deployed EN/TH shells and score-sync asset matched the reviewed
    automatic-save/retry/member-isolation source. No production write was made.
- [x] **G8 — Fresh intent-to-repository reconciliation passes.**
  - Check: direct audit of authoritative sources against the exact final tree
    and public deployment after the last material change.
  - Expect: all in-scope outcomes pass; browser-only/authenticated limitations
    remain explicitly bounded rather than inferred.
  - Evidence: the post-deployment direct audit found every in-scope outcome
    satisfied. Authenticated browser/account/inbox journeys remain explicitly
    bounded; the provider source is unchanged from its previously recorded real
    six-digit email journey, and terminal evidence is not represented as a new
    real Google journey.
