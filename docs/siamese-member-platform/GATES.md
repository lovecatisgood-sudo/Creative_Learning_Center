# Siamese Member Platform — Acceptance Gates

Evidence remains `pending` until the stated check is actually run. A passing
build alone does not satisfy integration or reconciliation gates.

## Active authentication reliability gates — 2026-08-26

- [x] **AR0 — Scope and production invariants are frozen before code.**
  **Check:** reconcile the user request, `MEMORY.md`, PRD V3, provider intent,
  and current repositories. **Expected:** diagnosed causes, exclusions,
  deployment language, identity/data boundaries, and real-journey requirement
  are explicit. **Evidence:** active intent and plan above were written before
  runtime modification.
- [x] **AR1 — Stateful Creative auth responses cannot be shared or replayed by
  the CDN.** **Check:** route contract tests plus built-server requests with and
  without cookies. **Expected:** auth starts/callbacks are dynamically rendered
  and return `private, no-store`, surrogate no-store, and `Vary: Cookie`; two
  callers cannot receive one cached redirect. **Evidence:** the final
  `check:auth-reliability` contract and production-built route probe pass for
  POST/GET starts, trusted and hostile origins, cookies, and all application,
  CDN, surrogate, referrer, and vary headers.
- [x] **AR2 — Creative callbacks use the registered public URL exactly.**
  **Check:** simulate a Hostinger/internal request origin and inspect the URL
  passed to OIDC completion. **Expected:** scheme/host come from configured
  public origin while path/query are preserved; state/PKCE/replay checks still
  pass for member and game callbacks. **Evidence:** canonical callback helpers
  preserve path/query while forcing the configured public origin; member and
  game contracts prove rejected validation retains the bounded transaction and
  successful validation consumes it exactly once.
- [x] **AR3 — Creative legacy email never reports a failed send as success.**
  **Check:** known verified identity, unknown contact-only email, missing
  schema, rejected recipient, and SMTP failure tests. **Expected:** unknown is
  generic; eligible delivery succeeds only with accepted recipient; operational
  failures are retryable non-2xx; client copy follows actual HTTP outcome.
  **Evidence:** the auth reliability and member-release contracts prove the
  verified-email query, enumeration-safe unknown response, accepted-recipient
  requirement, token cleanup plus retryable 503 on mail/schema failure, safe
  fixed-stage logging, and client `response.ok` handling. The known-account
  outage response can reveal eligibility only during an operational failure;
  that explicit tradeoff is retained to prevent the proven false-success bug.
- [x] **AR4 — Signup remains complete when optional auth fails.** **Check:**
  disposable-database registration tests for connect, skip, and provider/error
  pending paths. **Expected:** exact parent/child/consent counts are retained;
  no contact email is marked verified; retry/link-later remains visible.
  **Evidence:** the final production-built `check:signup-auth-isolation` run
  preserves 2 parents, 3 children, 2 member shells, and 4 consents across
  connect/skip, creates no verified identity or link attempt, and rejects a
  hostile origin without writes; optional-schema failure leaves core writes
  available in the Creative link integration.
- [x] **AR5 — Provider email supports mail-app/different-browser handoff safely.**
  **Check:** database-backed OIDC flow requests email, opens the link without
  interaction cookies, then enters the delivered code in the original
  interaction; test invalid attempts, expiry, concurrency, and replay.
  **Expected:** foreign-context link cannot hijack the interaction; original
  context code completes once; neither code nor token is stored or logged in
  plaintext. **Evidence:** the final provider PostgreSQL suite completes the
  foreign-browser link landing and original-interaction code path, then proves
  shared single use, hashed storage, five-attempt lockout, expiry, and replay
  rejection.
- [x] **AR6 — Email throttling and lifetimes recover predictably.** **Check:**
  accepted request followed by suppressed retries and clock advancement;
  mismatched configured TTL fixture. **Expected:** suppressed requests do not
  extend the accepted-request window; effective verifier expiry never exceeds
  interaction expiry; audit remains enumeration-safe. **Evidence:** unit and
  database fixtures prove suppressed retries retain the original accepted
  timestamp, verifier TTL is the minimum of configured and owning interaction
  lifetimes, and safe audit events contain only hashed/fixed-stage fields.
- [x] **AR7 — Provider authentication is independent of Creative tables.**
  **Check:** apply provider migrations into an empty PostgreSQL database with
  no `parents`, `children`, or Creative `member_accounts`; complete new email,
  existing email, Google convergence, and conflict fixtures. **Expected:** all
  pass with stable subjects and no implicit entitlement; legacy provider data
  remains readable after additive migration. **Evidence:** all 15 disposable
  PostgreSQL integrations pass, including forced simultaneous first-time
  email/Google verification converging on one subject. The final exact-entry
  rehearsal reaches schema 5 with five migration rows, one signing key, and no
  Creative operational tables.
- [x] **AR8 — Google failures are safe and stage-specific.** **Check:** token
  transport, token rejection, JWKS, JWT claims, interaction retrieval,
  identity conflict, and OIDC completion fixtures. **Expected:** fixed codes
  distinguish stages; one-time state and PKCE remain enforced; logs contain no
  email, code, state, token, secret, cookie, or Google response body.
  **Evidence:** Google unit/integration fixtures cover each stage and safe-code
  logging; the final built callback probe returns controlled HTTP 400 with
  private/no-store headers and no authorization material.
- [x] **AR9 — Readiness identifies the actual auth release and optional
  dependencies.** **Check:** local built runtime and public health contracts.
  **Expected:** provider and Creative expose non-secret release/auth-readiness
  fields; Creative core health is not failed solely by optional provider
  unavailability; no field claims actual delivery or Google account success.
  **Evidence:** public provider readiness reports release
  `2026-08-26-auth-reliability`, schema 5, database/mail/Google configuration,
  600-second effective verifier/interaction lifetimes, verification-code
  readiness, and no Creative-table dependency. Creative reports the same
  release with core/member/game/Creative-link readiness true. These are
  configuration/transport readiness fields, not delivery or account success.
- [x] **AR10 — Full repository and integration gates pass after the last code
  change.** **Check:** Creative build and release/game/auth scripts; provider
  typecheck, lint, unit, both builds, disposable PostgreSQL suite, repeated
  migrations, and exact Hostinger-entry rehearsal. **Expected:** all exit zero
  with preserved protected-table counts. **Evidence:** Creative's final build
  renders 47 routes and its auth, game, member-release, signup-isolation,
  Creative-link, and member-system checks pass. Provider verification passes
  typecheck, lint, 46 unit tests (27 explicitly database-skipped), both builds,
  and 15 PostgreSQL integrations. The final `hostinger:build`, idempotent
  migration reapply, built `node server.js`, readiness, discovery, public JWKS,
  and controlled callback probe all pass on a disposable provider-only schema.
- [x] **AR11 — Public production behavior matches the candidate.** **Check:**
  after an authorized deployment, no-cache health/discovery/JWKS/auth-start and
  controlled callback-error probes. **Expected:** exact issuer/callback,
  Authorization Code only, PKCE S256, `openid email`, new release marker, and
  non-cacheable Creative redirects. **Evidence:** provider commit `6acaafd` and
  Creative commit `6aeb362` are on production `main` and both public runtimes
  expose the new marker. Discovery is exact Authorization Code/S256/`openid
  email`; JWKS is public RS256 only; the provider callback gives controlled
  no-store 400. Creative trusted POST and compatibility GET return 303 with
  private/CDN/surrogate no-store; hostile POST returns 403; repeated identical
  GETs produced no CDN hit. Public Cat vs Dog and Car Maze auth config is
  enabled against the exact provider issuer.
- [ ] **AR12 — Both real methods complete the Creative journey.** **Check:** one
  controlled real Google login and one controlled real inbox link/code flow
  from Creative signup/member connection through first-party session/link.
  **Expected:** both return to Creative, link one profile to the same stable
  subject when evidence matches, and replay fails. **Evidence:** pending a real
  account/inbox journey; automated substitutes cannot close this gate.
- [x] **AR13 — Final reconciliation is fresh.** **Check:** after the last
  material source or deployment change, compare final repositories and live
  evidence directly to `PROJECT_INTENT.md`, PRD V3, and these gates.
  **Expected:** each item is evidenced, explicitly pending, or excluded; no
  local-only result is represented as production-fixed. **Evidence:** the
  2026-08-26 reconciliation was refreshed after both deployments. AR12 remains
  explicitly open; browser/inbox/account success is not inferred from terminal
  readiness or disposable integration evidence.

## Design gates

- [x] **G0.1 — Universal identity is separated from product profiles and
  entitlements.**  
  **Check:** inspect PRD sections 1, 5, and 6.  
  **Expected:** no parent, child, phone, package, or entitlement is required for
  an identity-only member.  
  **Evidence:** `MEMBER_SYSTEM_PRD_V3.md` defines universal identity and
  explicitly prohibits fake Creative records and implicit entitlement.

- [x] **G0.2 — Dashboard boundaries are explicit.**  
  **Check:** inspect PRD section 4 and Phase 3.  
  **Expected:** Creative `staff`, Creative `manager`, and Siamese master admin
  use separate authorization; no universal cross-product member-facing
  dashboard is in scope, while the existing Creative member portal is
  preserved.  
  **Evidence:** the three administrative surfaces and separate-session tests
  are specified.

- [x] **G0.3 — Product history is many-to-many and durable.**  
  **Check:** inspect PRD sections 6.3–6.5 and admin requirements.  
  **Expected:** multiple products remain visible with first/last/count and
  append-only successful-login history.  
  **Evidence:** product registry, relationship, and login-event entities are
  specified.

- [x] **G0.4 — Creative registration remains optional to membership.**  
  **Check:** inspect PRD section 8.1 and Phase 4.  
  **Expected:** accept, skip, and provider-unavailable paths all preserve the
  parent/child registration.  
  **Evidence:** all three paths and link-later behavior are specified.

## Data and migration gates

- [x] **G1.1 — Additive schema is exact and idempotent.**  
  **Check:** apply migrations twice to a disposable PostgreSQL database and run
  the schema verifier.  
  **Expected:** second application is a no-op; required tables, columns,
  constraints, indexes, and readiness version match exactly.  
  **Evidence:** provider PostgreSQL integration applies `0004` twice and checks
  schema version 4; `check-siamese-creative-link.ts` reapplies both universal
  and Creative-link additions in a disposable database. Both passed on
  2026-08-23.

- [x] **G1.2 — Existing business and game data is preserved.**  
  **Check:** migration fixture with parents, children, members, purchases,
  packages, sessions, game players, and runs; compare exact pre/post counts and
  ownership links.  
  **Expected:** no row lost, reassigned, or entitled implicitly.  
  **Evidence:** `check-siamese-creative-link.ts` compared exact parent, child,
  member, order, item, package, session, game-player, and game-run counts before
  and after both migrations, link-later, and legacy-player migration. Passed on
  2026-08-23.

- [x] **G1.3 — Optional schema failure is isolated.**  
  **Check:** make membership schema preparation fail in an integration fixture.
  
  **Expected:** Creative signup/directory/checkout still function; membership
  features report a retryable operational error.  
  **Evidence:** disposable-DB integration forced Creative-link preparation to
  fail, then proved the core parent/child transaction remained writable. A
  built-server HTTP test also forced optional Creative auth configuration
  failure and retained both submitted families with explicit pending state.
  Existing directory/checkout dependency guards passed `check-playroom-menu`.

## Identity-provider gates

- [x] **G2.1 — Google and magic link converge safely.**  
  **Check:** end-to-end provider test using one verified email through both
  methods.  
  **Expected:** same issuer/subject; two auth methods; no duplicate member.  
  **Evidence:** provider PostgreSQL integration resolves email first and Google
  second to the same subject and verifies both active method rows. Passed on
  2026-08-23.

- [x] **G2.2 — Google account key is immutable subject, not email.**  
  **Check:** change a Google fixture email after initial link.  
  **Expected:** same member by Google `sub`; email updates under conflict rules.
  
  **Evidence:** provider integration changed the verified Google email while
  holding Google `sub` constant and retained the original Siamese subject.

- [x] **G2.3 — Conflicting evidence never silently merges.**  
  **Check:** Google `sub` mapped to member A while verified email maps to member
  B.  
  **Expected:** authorization stops safely; conflict is recorded for review;
  neither identity is mutated.  
  **Evidence:** provider integration maps Google `sub` and verified email to
  different fixtures, receives `conflict`, and verifies the open quarantine
  record. Master-admin tests also reject incompatible email-identity merges
  without mutating either account.

- [x] **G2.4 — Claims remain minimal.**  
  **Check:** decode verified ID token from each authentication method.  
  **Expected:** only standard protocol claims plus `sub`, `email`, and
  `email_verified`; no product, child, guardian, score, staff, or entitlement
  data.  
  **Evidence:** OIDC integration decodes the issued token and asserts the exact
  standard/minimal claim set with no product, CRM, game, staff, or entitlement
  claims.

- [x] **G2.5 — Product attribution is trusted and durable.**  
  **Check:** authenticate the same member through three registered product
  clients and attempt a forged browser product name.  
  **Expected:** three relationships remain; trusted client mapping wins;
  first/last/count and exactly one event per success are correct.  
  **Evidence:** provider integration records the same subject through three
  server-registered clients, rejects the duplicate correlation, and verifies
  three relationships and exactly three append-only events. Product identity
  is looked up from the confidential client registry, not request input.

## Dashboard authorization and data gates

- [x] **G3.1 — Dashboard sessions do not cross-authorize.**  
  **Check:** route/API matrix with Creative staff, Creative manager, Siamese
  master admin, and unauthenticated sessions.  
  **Expected:** every role can access only its documented surface.  
  **Evidence:** master-admin HTTP integration rejects unauthenticated and
  Creative-cookie requests and accepts only its encrypted
  `scm_master_admin` session. Creative authorization remains on its separate
  cookie/middleware and passed the existing release checks.

- [x] **G3.2 — Master directory includes every member type.**  
  **Check:** fixtures for identity-only game member, Creative-linked member,
  email-only member, Google-only member, and dual-method member.  
  **Expected:** each appears once with correct filters and product badges.  
  **Evidence:** master-admin PostgreSQL/HTTP fixtures cover identity-only game,
  Creative-linked, email-only, Google-only, and dual-method members and verify
  search, auth, product, and category results.

- [x] **G3.3 — Historical products remain visible.**  
  **Check:** revoke one of a fixture member's products and later use another.
  
  **Expected:** revoked product remains historical; the new product is added;
  neither overwrites the other.  
  **Evidence:** master-admin integration renders the historical Cat vs Dog
  relationship and its retained event; provider integration retains all three
  product relationships. Transactional merge coverage preserves and combines
  relationship counts and moves both event histories.

- [x] **G3.4 — Backend failure is not an empty directory.**  
  **Check:** force member query failure.  
  **Expected:** visible retryable error and correlation reference; no “zero
  members” or empty-state result.  
  **Evidence:** master-admin integration removes the read view, receives HTTP
  503, and verifies the retryable operational-error copy and correlation
  reference instead of an empty member state.

## Creative Club integration gates

- [ ] **G4.1 — Signup works with connected membership.**  
  **Check:** complete parent/child signup through Google and through magic link.
  
  **Expected:** one Creative profile linked to one universal member; staff sees
  existing required data.  
  **Evidence:** implementation and component integrations pass; final
  Google-and-magic-link browser journeys remain a staging cutover check.

- [x] **G4.2 — Signup works when membership is skipped.**  
  **Check:** complete signup through explicit skip.  
  **Expected:** parent/children and consent persist; no universal identity or
  false verified email is created.  
  **Evidence:** terminal-only HTTP test against the production build returned
  `membershipConnection: skipped`; database verification found one parent,
  child, member profile, and two Creative consents with no universal-provider
  table or false identity.

- [x] **G4.3 — Signup works when provider is unavailable.**  
  **Check:** simulate provider timeout during the prompt.  
  **Expected:** entered form data is preserved and Creative registration can
  complete with an explicit pending/retry option.  
  **Evidence:** terminal-only production-build HTTP test forced invalid
  optional auth configuration. The API still returned success/pending and the
  second family and consents were durable.

- [x] **G4.4 — Link-later does not duplicate product data.**  
  **Check:** connect a guest Creative profile after it has children, package,
  and session history.  
  **Expected:** existing rows and ownership remain; one audited profile link is
  added.  
  **Evidence:** disposable PostgreSQL integration linked the same Creative
  profile twice, retained exact family/order/package/session counts and
  ownership, and found one active profile link and one linked attempt.

- [ ] **G4.5 — Existing Creative permissions are unchanged.**  
  **Check:** pre/post staff-manager authorization regression suite.  
  **Expected:** identical allowed/denied route and action matrix.  
  **Evidence:** source-level permission/release checks pass; the complete
  pre/post staff-manager HTTP matrix remains a staging cutover check.

## Game integration gates

- [ ] **G5.1 — Cat vs Dog uses shared identity at the established gate.**  
  **Check:** finish game, complete finish ad, start next game through Google and
  magic link.  
  **Expected:** correct player/session; existing runs preserved; Cat vs Dog
  product recorded.  
  **Evidence:** implementation/static flow checks pass, but the full finish-ad
  plus both-provider production journeys remain pending. The established
  direct-Google endpoint must remain operational until those live journeys
  pass and therefore must not return 410 during the compatibility window.

- [ ] **G5.3 — Working legacy authentication is not retired prematurely.**  
  **Check:** exercise the deployed direct-Google compatibility route before
  and after enabling the shared provider, then inspect the rollback flag.  
  **Expected:** existing users can still authenticate while shared Google and
  magic-link journeys are being proven; retirement occurs only in a later
  reversible release after G5.1 passes.  
  **Evidence:** pending; the dirty source currently violates this gate and is
  being corrected before any Creative deployment.

- [x] **G5.2 — Existing Google player migrates by Google subject.**  
  **Check:** legacy `game_players.google_sub` fixture authenticates through the
  provider.  
  **Expected:** existing player receives Siamese subject; no duplicate player
  or member.  
  **Evidence:** disposable PostgreSQL integration resolves the provider-side
  Google subject, attaches the existing game player to Siamese issuer/subject,
  adds two product links, and retains exactly one player and one prior run.

- [x] **G6.1 — Car Maze checkpoint and ads remain correct.**  
  **Check:** stages 1–20 with successful and failed auth plus ad counters.  
  **Expected:** stages 1–19 guest-first; ads every 10 stages; first auth at Stage
  20; progress survives callback/error.  
  **Evidence:** `check-car-maze-flow.mjs` executes the guest controller for both
  locales and verifies no auth before Stage 20, Stage-20 ordering, ten-stage ad
  milestones, guest-progress retention, callback handoff, and failure retry.
  Shared player/profile linking passed the PostgreSQL integration.

## Release and reconciliation gates

- [x] **G7.1 — Build, test, and migration suite passes.**  
  **Check:** repository verification commands documented by each service.  
  **Expected:** typecheck, lint, unit, integration, security, build, migration
  retry, and exact-entry startup checks exit 0.  
  **Evidence:** 2026-08-23: provider verify passed (26 unit tests), provider DB
  passed (13), member-admin DB/HTTP passed (12), Creative production build and
  typecheck passed, member-system DB passed, Creative/game link DB passed, and
  all member/game/release static checks passed. Provider and Creative
  production dependency audits reported no known vulnerabilities.

- [ ] **G7.2 — Independent health and rollback work.**  
  **Check:** provider, Creative, and member-admin failure/recovery drill.  
  **Expected:** independent readiness, no Creative core outage, and documented
  rollback that preserves new data.  
  **Evidence:** independent health endpoints and rollback procedure are
  implemented/documented; the deployed failure/recovery drill remains a
  production-cutover action.

- [ ] **G7.4 — Every intended app is live, not local or prototype.**  
  **Check:** verify provider, Creative Club, Cat vs Dog, Car Maze, POS Member
  Hub, and Master Admin on their public production URLs, including both real
  authentication methods wherever member sign-in is required.  
  **Expected:** public deployment, callback, first-party session, preserved
  data/progress, explicit failure behavior, and rollback evidence all pass.  
  **Evidence:** pending. Local builds and fixtures are supporting evidence only
  and cannot complete this gate.

- [x] **G7.3 — Fresh PRD-to-repository reconciliation passes.**  
  **Check:** audit original owner requirements and V3 directly against final
  schemas, source, tests, and deployed contracts after the final change.  
  **Expected:** every invariant/outcome is implemented or explicitly accepted
  as excluded; no stale reconciliation.  
  **Evidence:** `RECONCILIATION.md`, refreshed after the final implementation
  and verification changes on 2026-08-23, maps every V3 invariant and records
  the four remaining staging/production gates without representing them as
  complete.
