# Sign in with Siamese Cat — implementation plan

Status: superseded for current product architecture by
[`../MEMBER_SYSTEM_PRD_V3.md`](../MEMBER_SYSTEM_PRD_V3.md) and
[`siamese-member-platform/PLAN.md`](./siamese-member-platform/PLAN.md)  
Production issuer: `https://id.siamesecat.cafe`  
Initial release: approved, confidential, server-backed web applications  
Identity source in this historical plan: verified Creative member accounts

> This document preserves the original authentication-only provider plan. The
> implemented provider subsequently gained new-email identity creation, and
> the owner has now defined Siamese membership as a universal cross-product
> identity with optional Creative profile linking, Google or magic-link login,
> durable product history, and a separate Member Admin Dashboard. V3 is the
> authoritative source for new work. Protocol-security invariants from this
> document remain applicable where V3 does not supersede the product model.

## 1. Outcome

Build a standalone OpenID Connect identity provider that lets approved Siamese
Cat games and applications authenticate an existing Siamese Cat member without
receiving the member's magic-link token, member-portal cookie, or private Club
data.

Each downstream application will redirect the user to **Sign in with Siamese
Cat**, receive a short-lived signed identity assertion, and create its own local
account and session. A new application must be onboarded through configuration
and client registration; adding it must not require provider code changes.

This is authentication only. It is not a general Siamese Cat API and does not
authorize access to children, guardians, purchases, packages, bookings, scores,
staff roles, or other Club records.

## 2. Locked v1 decisions

- The permanent issuer is exactly `https://id.siamesecat.cafe`.
- The provider is a standalone service and deployment, not routes embedded in
  the Creative Club production application.
- The source identity is an existing `member_accounts` record with a verified
  email address.
- The flow is OpenID Connect Authorization Code with mandatory PKCE S256.
- V1 supports manually approved confidential web clients with a server-side
  backend and `client_secret_basic` authentication.
- Supported scopes are exactly `openid email`.
- Released claims are exactly `sub`, `email`, and `email_verified` plus the
  standard protocol claims such as `iss`, `aud`, `iat`, `exp`, and `nonce`.
- The stable identity key in an application is `(iss, sub)`. Email is mutable
  metadata and must never be the account key by itself.
- The provider issues no refresh token and exposes no UserInfo, dynamic client
  registration, delegated member-data scopes, or global logout in v1.
- Every downstream application owns its local user record, authorization model,
  session cookie, and logout behavior.
- Browser-only games, SPAs without a backend, native apps, agent-to-agent auth,
  and third-party clients are out of v1 and require a separate threat review.

## 3. Production boundaries

The identity service must never become a runtime dependency of these existing
Creative Club flows:

- parent and child signup;
- member registration and the existing member portal;
- admin directory and search;
- checkout, payment, receipts, packages, and sessions;
- health reporting for the Creative Club application.

The provider may be unavailable while all those flows continue to operate. Its
schema must be additive and independently guarded. Failure to prepare its
optional schema must disable only Sign in with Siamese Cat and must produce an
explicit operational error, never a false success or empty result.

The provider should use a dedicated database role with the minimum permissions
needed to:

- read the member identity projection required for authentication;
- write only identity-provider tables and security events;
- never read child, order, payment, health, notes, or staff-password data.

If the current database cannot safely provide this permission boundary, expose
a small authenticated internal identity lookup instead of granting broad table
access. That fallback must be designed before implementation, not improvised at
deployment time.

## 4. Service and repository layout

Create a separate private repository, provisionally named
`Siamese-Cat-Sign-In`, containing:

```text
src/                 identity provider and login interactions
migrations/          additive provider-owned PostgreSQL schema
scripts/             migrate, register, rotate, revoke, key and health tools
packages/client/     reusable server-side OIDC client adapter
examples/nextjs/     production-shaped Next.js integration
examples/express/    production-shaped Express integration
test/                unit, protocol, integration and security tests
docs/                architecture, operations, onboarding and incident guides
skills/              agent-readable integration skill
```

The provider should use maintained OIDC provider/client libraries rather than a
home-grown implementation of authorization-code, token, discovery, or JWK
behavior. Dependencies and runtime versions must be pinned through a lockfile
and CI.

## 5. Identity model

### 5.1 Stable subject

Do not use the sequential database ID, verified email, phone number, or visible
`SCM-…` Member ID as the OIDC subject.

Add a provider-owned mapping:

```sql
create table siamese_oidc_subjects (
  member_account_id integer primary key,
  subject uuid not null unique,
  created_at timestamptz not null default now()
);
```

The UUID is created once and never changes or gets reassigned. Member merges
must preserve the surviving member's established subject and record any merge
through an explicit audited procedure. The exact foreign-key choice must be
reviewed against the operational requirement that optional provider schema
cannot break core member writes.

### 5.2 Eligibility

A user may authenticate only when:

- the member account exists;
- `email_normalized` is present;
- `email_verified_at` is present;
- the account has not been explicitly disabled from identity-provider access.

Add an identity-specific disable mechanism rather than inferring eligibility
from purchases or package status. Membership purchases and entitlements are not
authentication claims.

### 5.3 Minimal identity projection

The provider needs only:

- internal member-account reference;
- immutable OIDC subject;
- current verified normalized email;
- preferred language;
- identity-provider enabled/disabled state;
- a session or identity version used to revoke provider sessions when needed.

## 6. Protocol contract

### 6.1 Endpoints

The service will expose:

```text
GET  /.well-known/openid-configuration
GET  /oauth/authorize
POST /oauth/token
GET  /oauth/jwks.json
GET  /interaction/:uid
POST /interaction/:uid/start-email
GET  /interaction/:uid/verify
POST /interaction/:uid/confirm
POST /interaction/:uid/cancel
GET  /health/live
GET  /health/ready
```

Endpoint names may be adjusted to the selected library, but the issuer and
discovery contract may not drift after launch.

### 6.2 Token and code policy

- ID tokens: RS256, five-minute lifetime, stable `kid`.
- Authorization codes: single use, atomic consumption, 60–120 second lifetime.
- PKCE: S256 required for every authorization request.
- State and nonce: generated and validated by every downstream client.
- Access token: if required by the library's conforming token response, keep it
  short-lived and make sure no Siamese Cat API accepts it.
- Refresh tokens: never issued in v1.
- Redirect URIs: exact string match; no wildcards, suffix matching, fragments,
  embedded credentials, or production HTTP callbacks.
- Development HTTP: explicit loopback hosts only and registered separately from
  staging and production.

### 6.3 Discovery invariants

Production startup must fail closed if the configured issuer is not exactly
`https://id.siamesecat.cafe`. Discovery, token `iss`, authorization metadata,
and JWKS URLs must all agree with that issuer.

## 7. Passwordless login interaction

The provider will use a provider-owned passwordless flow rather than sharing or
copying the existing `sccc_member` cookie across subdomains.

1. The application begins OIDC authorization with PKCE, state, and nonce.
2. The provider validates the registered client and exact callback.
3. If no valid provider session exists, it asks for the verified member email.
4. It always returns the same generic response, whether or not the email exists.
5. For an eligible account, it sends a short-lived, single-use magic link.
6. The link returns only to `id.siamesecat.cafe`, consumes the token atomically,
   and creates a host-only provider session.
7. The provider shows the application's verified display name and the exact
   data being released: stable identity and verified email.
8. First use of an application requires confirmation. Remembered confirmation
   may be used on later visits until the client or account is revoked.
9. The provider completes the authorization-code flow.

Magic-link tokens must be random, stored only as hashes, short-lived, single
use, absent from logs and analytics, and removed from browser history as soon as
they are exchanged. Rate limits must apply by normalized email hash, IP hash,
client, and overall service volume without revealing whether an account exists.

## 8. Provider-owned persistence

Use additive, transaction-safe migrations for at least:

- immutable OIDC subjects;
- registered clients and encrypted client credentials;
- client-secret versions to allow overlap during safe rotation;
- authorization/provider artifacts required by the maintained library;
- passwordless login transactions and hashed tokens;
- remembered client confirmations;
- identity disable/session-version state;
- client registration, rotation, revocation, and operator audit events;
- redacted security events and replay/rate-limit records.

Every migration must be idempotent where practical, verified after application,
and tested to prove parent/child/member record counts and core schema are
unchanged. The identity service needs its own runtime readiness guard and health
signal. Do not add provider tables to the Creative Club member-schema bootstrap
or make `ensureMemberSchemaReady()` depend on them.

## 9. Client registry and lifecycle

Dynamic registration remains disabled. An operator CLI will support:

```text
client register
client list
client rotate-secret
client revoke
client inspect
```

Registration requires:

- unique client ID and permanent display name;
- environment: development, staging, or production;
- exact callback URIs;
- application home, privacy, and terms URLs;
- application owner and security contact;
- confirmed confidential server-side client type.

Client secrets are generated with high entropy, displayed once, encrypted at
rest with a dedicated key, redacted from logs, and stored by applications only
in server-side secret storage. Implement overlapping old/new secret versions so
rotation does not require downtime. Revocation must take effect predictably and
be auditable.

## 10. Reusable integration package

Publish or privately distribute a package provisionally named
`@siamesecat/member-auth` with a narrow server-only API:

```ts
beginSiameseCatLogin(callbackUrl, returnTo)
finishSiameseCatLogin(callbackUrl, transaction)
```

The package will:

- discover only the fixed issuer;
- create PKCE verifier/challenge, state, and nonce;
- validate issuer, audience, signature, expiry, nonce, state, and claims;
- reject refresh tokens or unexpected claims;
- return `{ issuer, subject, email }`, not raw tokens;
- provide a serializable one-time transaction for secure server-side storage;
- prevent arbitrary post-login redirects through an internal allowlist helper.

It will not create application sessions or choose how local users are linked.
Examples must store a unique `(issuer, subject)` external identity and must not
silently link an existing local account by email alone.

## 11. Agent-ready onboarding

Add `skills/siamese-cat-sign-in/SKILL.md` to the identity repository. It should
instruct a coding agent to:

1. identify the target application's backend and session model;
2. confirm that the client is a supported confidential web client;
3. collect exact environment-specific callback and legal URLs;
4. request manual client registration;
5. install the supported adapter;
6. implement login and one-attempt callback routes;
7. persist `(issuer, subject)` and mutable email separately;
8. create an application-owned secure session;
9. add logout, retryable errors, tests, and operational documentation;
10. stop and request a threat review for browser-only, native, partner, or
    delegated-data requirements.

The skill must never contain credentials, private keys, production cookies, or
instructions to weaken callback, PKCE, token, or issuer validation.

## 12. Security baseline

Required controls include:

- host-only, Secure, HttpOnly, SameSite=Lax signed cookies;
- no parent-domain `.siamesecat.cafe` authentication cookie;
- CSRF protection on every interaction form;
- restrictive Content Security Policy and `frame-ancestors 'none'`;
- escaped client metadata and script-free provider pages where practical;
- exact callback matching and explicit client environment separation;
- encrypted client secrets and managed private signing keys;
- database-atomic code and magic-link consumption;
- replay detection and generic authentication failures;
- structured logs that redact email, tokens, codes, secrets, cookies, and keys;
- hashed IP/email identifiers for rate-limiting and security correlation;
- signing-key rotation with overlapping public JWKS keys;
- dependency scanning, lockfile review, and automated security tests;
- documented incident response for client, SMTP, database, and signing-key
  compromise.

Use independent secrets for provider cookies, transaction sealing, client
credential encryption, security-event hashing, and signing keys. Production
configuration must reject missing, reused, weak, or example secrets.

## 13. Availability and error behavior

- `/health/live` proves only that the process can serve requests.
- `/health/ready` verifies database connectivity, provider schema, client
  registry load, signing key availability, and identity lookup readiness.
- Discovery and JWKS should remain cacheable according to a documented policy;
  interactions and token responses must be `no-store`.
- Provider operational failures must display an explicit retryable error and
  correlation ID. They must never be rendered as "account not found".
- A downstream app must show a retryable Sign in with Siamese Cat failure while
  leaving any guest or non-authenticated experience available when its product
  permits that behavior.

## 14. Test strategy

### Unit and component tests

- configuration and permanent issuer validation;
- safe client URL validation;
- secret encryption/decryption and rotation overlap;
- claim allowlist and identity eligibility;
- token hashing, expiry, and constant-behavior responses;
- locale and HTML escaping;
- health/readiness failure modes.

### Protocol and integration tests

- valid Authorization Code + PKCE flow;
- wrong or missing verifier, state, nonce, client secret, audience, or issuer;
- unregistered and near-match redirect URIs;
- expired and concurrently replayed codes;
- magic-link expiry and concurrent replay;
- unverified, missing, disabled, and changed-email accounts;
- stable subject after email change;
- consent grant, cancel, remembered grant, and revocation;
- signing-key overlap and old-key retirement;
- old/new client-secret overlap and revocation;
- database outage and optional-schema absence;
- proof that Creative Club core flows remain independent.

### Client contract tests

Run the same provider contract suite against the Next.js and Express examples.
The second example is the acceptance proof that onboarding a new application
requires no provider code change.

### Security validation before production

- dependency and secret scans;
- OIDC conformance testing appropriate to the supported profile;
- external or independent application-security review;
- abuse/rate-limit tests;
- backup restoration and signing/client-secret rotation drills;
- redaction audit confirming that logs and analytics contain no credentials or
  raw member email.

## 15. Delivery phases and gates

### Phase 0 — decisions and ownership

- Confirm repository owner, service owner, security contact, incident contact,
  and data-retention owner.
- Confirm the first real client and its development/staging/production callback
  URLs.
- Confirm hosting, database boundary, SMTP sender, monitoring, and secret store.
- Record the permanent issuer decision in both repositories.

Gate: ownership and environments are named; no production credentials needed.

### Phase 1 — repository and protocol skeleton

- Create the standalone private repository and CI.
- Add configuration validation, discovery, JWKS, provider routes, live/ready
  health endpoints, and structured redacted logging.
- Add local PostgreSQL development and test setup.

Gate: provider starts locally only with valid configuration; discovery/JWKS and
configuration tests pass.

### Phase 2 — optional schema and identity projection

- Add provider migrations, runtime readiness guard, subject mapping, identity
  eligibility, and least-privilege database access.
- Add schema integrity and core-record-count verification.

Gate: provider schema can be absent or unavailable without affecting any
Creative Club core flow; readiness reports the exact failure.

### Phase 3 — passwordless interactions

- Implement email request, magic-link issue/exchange, provider session,
  bilingual Thai/English views, client confirmation, cancellation, rate limits,
  and audit/security events.

Gate: enumeration, replay, CSRF, redirect, and session tests pass; raw secrets
and email are absent from logs.

### Phase 4 — client operations and key management

- Implement audited registration, inspection, overlapping secret rotation,
  revocation, signing-key generation/rotation, and cleanup jobs.

Gate: rotation and compromise drills pass without provider code edits.

### Phase 5 — reusable package and examples

- Build `@siamesecat/member-auth`, Next.js and Express examples, schema recipe,
  error UX, logout behavior, and contract tests.
- Add the agent skill and new-app checklist.

Gate: a second sample application is integrated from documentation alone.

### Phase 6 — staging

- Provision `id` staging service, database role, secrets, SMTP, monitoring, and
  a staging client.
- Run the full protocol, security, failure, rotation, and recovery matrices.

Gate: staging sign-off includes security, operations, privacy, and rollback.

### Phase 7 — controlled production launch

- Provision DNS/TLS and production infrastructure for
  `id.siamesecat.cafe` through separately authorized account-side changes.
- Register one production client and expose its login behind an application
  feature flag.
- Launch to an internal/test cohort, then a limited percentage, then all users.
- Keep the downstream feature flag and client revocation as immediate rollback
  controls.

Gate: discovery, JWKS, health, real passwordless login, token validation,
replay rejection, monitoring, and core-flow independence are verified.

### Phase 8 — operational handoff

- Complete runbooks for onboarding, revocation, key rotation, client-secret
  rotation, database recovery, SMTP failure, member disable, and incidents.
- Schedule retention cleanup, dependency maintenance, access review, restore
  drills, and signing-key rotation.

Gate: an operator who did not build the system completes a supervised client
onboarding and rollback using only the runbooks.

## 16. Production prerequisites

Production launch requires all of the following and is not authorized merely by
merging code:

- DNS and valid TLS for `id.siamesecat.cafe`;
- production hosting with supported Node.js runtime, rolling deploys, health
  probes, and log redaction;
- managed PostgreSQL with TLS, backups, restore testing, and least privilege;
- managed SMTP with authenticated domain, deliverability monitoring, and
  passwordless-email templates;
- managed secret storage and independent encryption/signing keys;
- monitoring and alerting for readiness, errors, latency, email delivery,
  replay, rate limiting, and abnormal client activity;
- updated privacy disclosures and retention schedule;
- first client owner, security contact, exact callbacks, privacy, and terms;
- reviewed staging evidence, incident procedure, and rollback owner;
- explicit authorization for DNS, hosting, production secrets, database role,
  SMTP, and live client-registration changes.

## 17. Rollback model

Rollback must not require a database downgrade.

- Downstream app: disable the Sign in with Siamese Cat feature flag and preserve
  existing app-local sessions according to that app's policy.
- Client compromise: revoke the client, disable its login entry point, rotate
  the secret if recovery is appropriate, and investigate callbacks.
- Provider release failure: roll back the service image while preserving
  additive schema and compatible signing keys.
- Signing-key concern: add a new key, deploy overlapping JWKS, switch signing,
  wait past maximum token/cache lifetime, then retire the old key.
- Email-provider failure: display a retryable outage; do not claim that a link
  was delivered if the operational send failed after request acceptance.
- Provider database failure: fail readiness and authentication explicitly while
  leaving the Creative Club production application and member portal intact.

## 18. Definition of done

The first release is complete only when:

- `https://id.siamesecat.cafe/.well-known/openid-configuration` and JWKS are
  internally consistent and production monitored;
- an eligible member can sign in through the first registered application;
- the application receives only stable subject and verified email identity;
- the app stores identity by `(iss, sub)` and creates its own secure session;
- email change preserves the same subject;
- unverified, disabled, expired, replayed, malformed, wrong-client, and
  wrong-callback attempts are rejected;
- client and signing-key rotation procedures have been exercised;
- no provider secret, token, code, cookie, or raw email appears in logs or
  analytics;
- provider outage and optional-schema absence do not disable signup, member
  access, directory/search, checkout, or health reporting;
- the second example app integrates without provider code changes;
- the agent skill and operator runbooks are sufficient for repeat onboarding;
- staging, security, privacy, operations, rollback, and production smoke-test
  evidence are recorded and approved.

## 19. Immediate next implementation milestone

Before writing provider code, complete Phase 0 with these concrete inputs:

1. select the standalone repository owner/name;
2. name the first real application that will prove the integration;
3. record its development and staging callback URLs;
4. choose the identity service hosting and managed PostgreSQL boundary;
5. choose the SMTP sender and secret-management mechanism;
6. name the operational/security owner;
7. decide the initial retention periods for login transactions, confirmations,
   client audit, and security events.

Once those inputs are recorded, implementation can begin locally without DNS,
hosting-dashboard, production-database, or other account-side access.
