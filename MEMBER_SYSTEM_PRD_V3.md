# Siamese Cat Member Platform — PRD V3

**Status:** product and architecture source of truth for phased implementation  
**Updated:** 2026-08-21  
**Supersedes:** V2 identity coupling between a Siamese member and a Creative Club guardian record  
**Preserves:** existing Creative Club staff/manager permissions, parent/child records, packages, payments, sessions, receipts, audit history, and core availability

## 1. Product definition

A **Siamese Cat Member** is a universal identity and reusable sign-in pass for
public Siamese Cat products. It is not the same thing as a Creative Club parent
registration, child profile, product profile, paid package, booking, or other
entitlement.

One person has one stable Siamese identity and may authenticate with either or
both of these methods:

- Google;
- verified email through a single-use magic link.

The same Siamese identity can be used in multiple products. Every successful
product authorization must preserve which product was accessed, when it was
first and most recently accessed, the login count, and the historical login
events. Product participation is many-to-many; it must never be represented by
one overwriteable category field on the member.

Creating a Siamese identity never grants a Creative Club package, booking,
payment status, game entitlement, staff role, manager role, or master-admin
role.

## 2. Required outcomes

1. `https://id.siamesecat.cafe` presents one account screen with **Continue
   with Google** and **Continue with email**.
2. Google and magic-link authentication resolve to one stable Siamese identity
   when they belong to the same verified person.
3. Cat vs Dog, Car Maze, Creative Club, and future approved public products use
   the same identity provider and stable `(issuer, subject)` key.
4. Every Siamese member appears in the Siamese Cat Member Admin Dashboard,
   including members who have no Creative Club parent/child profile.
5. A member detail view shows every current and historical product
   relationship without erasing earlier products when a new product is used.
6. Creative Club parent/child registration succeeds with or without Siamese
   membership. The interface prompts the parent to create or connect a member,
   but provides a clear skip path.
7. A parent who connects later links the existing Creative profile instead of
   creating a duplicate parent, child, purchase, or member identity.
8. Existing Creative Club staff and manager access remains unchanged.
9. Product/provider failure never loses a submitted Creative parent/child
   registration or disables Creative Club checkout, directory, packages, or
   sessions.

## 3. Scope

### 3.1 In scope

- universal Siamese member identity;
- Google and email magic-link authentication;
- safe identity linking and conflict handling;
- registered product catalogue and per-product OIDC clients;
- durable member/product relationships and successful-login history;
- a separate Siamese Cat Member Admin Dashboard;
- optional Siamese membership during Creative Club parent signup;
- links between a Siamese identity and product-owned profiles;
- Cat vs Dog and Car Maze migration to the shared flow;
- reconciliation of existing provider identities, Creative members, and Google
  game players;
- operational health, audit, privacy, migration, and rollback controls.

### 3.2 Out of scope for this delivery

- the future universal cross-product member-facing self-service dashboard (the
  existing Creative Club member portal remains preserved);
- redesigning Creative Club Staff or Creative Club Admin dashboards;
- changing existing staff/manager permissions;
- granting paid benefits merely because an identity exists;
- public/dynamic OAuth client registration;
- native/public clients without a confidential backend;
- delegated APIs exposing children, purchases, bookings, scores, or staff data
  through OIDC claims;
- a global cross-product logout;
- automatic merging when identity evidence conflicts.

## 4. Dashboard and authorization boundaries

There are exactly three administrative dashboards in this scope.

### 4.1 Creative Club Staff Dashboard

- Uses the existing Creative Club `staff` role and session.
- Preserves the actions and visibility already implemented.
- Operates Creative Club registration, sales, sessions, and other authorized
  store workflows only.
- Receives no network-wide Siamese member access.

### 4.2 Creative Club Admin Dashboard

- Uses the existing Creative Club `manager` role and session. The product owner
  refers to this surface as the Creative Club Admin Dashboard.
- Preserves all current manager-only capabilities and restrictions.
- Manages Creative Club data and team accounts only.
- Creative manager status does not imply Siamese Member Admin access.

### 4.3 Siamese Cat Member Admin Dashboard

- Is a separate application/deployment and security boundary from Creative
  Club and from the identity provider.
- Uses a separate master-admin credential, role, cookie name, signing secret,
  authorization middleware, and least-privileged database role.
- Lists every Siamese member and their current and historical products.
- Provides member search, product filters, identity status, authentication
  methods, product history, linked-profile references, conflict review, and
  audited administrative actions.
- May expose authorized linked product details to a master admin, but never
  OAuth secrets, Google tokens, magic-link tokens, cookies, private signing
  keys, or staff password hashes.

No role or session is inherited between these three dashboards. Separate
authorization tests must prove that a Creative staff or manager session cannot
open the Siamese Member Admin Dashboard and vice versa.

## 5. Domain ownership

### 5.1 Membership backend owns

- universal member identity and stable subject;
- public Siamese Member ID;
- verified primary email and supported authentication methods;
- preferred language and identity profile metadata;
- identity status, creation source, creation time, and last authentication;
- registered products and their trusted OIDC-client mapping;
- member/product relationship summaries;
- successful product-login history;
- identity-linking conflicts, merges, and their audit history.

### 5.2 Creative Club owns

- guest and member-linked parent registrations;
- children and guardian/contact information;
- consent captured for Creative Club registration;
- packages, orders, payments, bookings/sessions, receipts, and operational
  audit history;
- existing staff/manager accounts and permissions.

### 5.3 Games own

- application player profile;
- progress, checkpoints, scores, runs, settings, and game-specific activity;
- their own secure application session.

Products store the stable Siamese `(issuer, subject)` as the external identity
key. Email is mutable metadata and is never the downstream account key.

## 6. Logical data model

Physical table names may reuse and migrate the existing provider tables, but
the following logical entities and constraints are required.

### 6.1 Universal member

`siamese_members`

- immutable internal ID and OIDC subject;
- unique, random, non-secret public Member ID (`SCM-…`);
- normalized verified primary email;
- display name, avatar URL, preferred language, and their provenance;
- status (`active`, `disabled`, `merge_pending`, `merged`);
- created source, created time, updated time, and last authenticated time;
- optional link to an existing Creative operational member account.

An identity-only game user is a valid Siamese member. It must not require a
fake parent row, fake child, fake phone number, or Creative package.

### 6.2 Authentication identities

`member_auth_identities`

- member ID;
- provider (`google` or `email`);
- immutable provider subject where one exists;
- verified email at link time;
- linked time, last used time, and status;
- unique `(provider, provider_subject)`;
- audited link, unlink, conflict, and recovery operations.

Raw Google tokens and consumed magic-link tokens are not stored as member
profile data.

### 6.3 Product registry

`siamese_products`

- stable product ID and slug;
- public display name;
- category such as `creative_center` or `game`;
- environment and active/revoked state;
- trusted OIDC client ID mapping;
- owner/security contact and timestamps.

Each production product receives a distinct confidential OIDC client. Initial
production products are:

- Siamese Cat Creative Club (product category `creative_center`);
- Cat vs Dog;
- Car Maze.

The provider derives the product from the validated client registration. A
browser-supplied product name is never trusted as the source of history.

### 6.4 Member/product relationship

`member_product_relationships`

- member ID and product ID, unique as a pair;
- first authenticated time;
- most recent authenticated time;
- successful login count;
- first registration/connection source;
- most recent authentication method;
- status (`active`, `revoked`, `historical`);
- optional product-profile reference;
- created and updated timestamps.

Using a new product inserts or updates only that product relationship. It never
overwrites or deletes a previous product relationship.

### 6.5 Product login history

`member_product_login_events`

- member ID, product ID, and trusted client ID;
- successful authorization time;
- authentication method used for that provider session;
- non-sensitive correlation/audit reference;
- environment and event version.

Successful events are append-only except for a controlled privacy erasure or
audited data repair. They contain no raw email address, token, authorization
code, cookie, IP address, or provider secret. Lists are indexed and paginated.

### 6.6 Product profile links

A link connects a Siamese member to a product-owned profile without moving all
product data into the identity tables. For Creative Club this links to the
existing parent/member record. For a game it links to the application player
record. Link creation, replacement, conflict, and removal are audited.

## 7. Identity resolution

### 7.1 Email magic link

1. The user submits a normalized email at `id.siamesecat.cafe`.
2. The response is generic and does not reveal account existence.
3. A short-lived, hashed, single-use token proves control of the address.
4. After consumption, the provider resolves an existing identity by verified
   email or creates one identity atomically.
5. The provider never grants product entitlements from verification alone.

### 7.2 Google

1. Google authorization occurs through the provider's server-side callback.
2. State, nonce, exact redirect URI, issuer, audience, signature, expiry, and
   `email_verified` are validated.
3. The immutable Google `sub` is resolved before email.
4. If that Google `sub` is new and its verified email belongs to exactly one
   compatible Siamese identity, the provider links it in one audited
   transaction.
5. If Google `sub` and verified email point to different identities, login does
   not merge them. It creates a retryable conflict for master-admin review.

### 7.3 Shared identity behavior

A member may use Google on one visit and a magic link on another. Both methods
must return the same stable Siamese subject after they are safely linked.
Downstream products never perform their own silent email-based merge.

## 8. Product flows

### 8.1 Creative Club parent signup

Parent/child registration is a Creative product flow, not proof of universal
membership.

1. Collect and validate the required parent, phone, child, Creative consent,
   and product-interest data.
2. Prompt the parent to create or connect a Siamese member using Google or an
   email magic link.
3. Present a clear **Continue without Siamese membership** option.
4. Save the Creative registration whether the prompt is accepted, skipped, or
   temporarily unavailable.
5. When authentication succeeds, link the verified identity to the Creative
   profile transactionally.
6. When a guest connects later, link the existing profile after identity and
   conflict checks; do not duplicate children, purchases, packages, or history.

An unverified contact email on a guest Creative registration remains product
contact data. It does not become a Siamese login until ownership is verified.

### 8.2 Cat vs Dog

- Remains guest-first.
- At the established post-game/post-finish-ad transition, authentication opens
  the shared Siamese provider.
- The provider offers Google and email magic link.
- The game links its player and run history by stable Siamese subject.

### 8.3 Car Maze

- Remains guest-first for stages 1–19.
- The first authentication checkpoint remains Stage 20.
- Ads remain scheduled every 10 stages independently of authentication.
- The provider offers Google and email magic link.
- The game links progress by stable Siamese subject without resetting guest
  progress after successful authentication.

## 9. Siamese Cat Member Admin Dashboard requirements

### 9.1 Directory

- Search by public Member ID, verified email, display name, and linked product
  reference where authorized.
- Filter by product, product category, authentication method, identity status,
  profile-link status, first seen, and last login.
- Show explicit operational errors with retry; a failed query is never rendered
  as an empty member list.
- Paginate all unbounded results.

### 9.2 Member detail

- identity summary and public Member ID;
- verified email and authentication methods;
- created source/date, last login, language, and status;
- all active and historical product badges;
- per-product first login, last login, count, status, and linked profile;
- paginated successful-login timeline;
- linked Creative parent/child summary where one exists and access is allowed;
- linked game profile/activity summary where one exists;
- conflict, merge, disable, and repair history.

### 9.3 Administrative safety

- Master-admin actions require re-authentication where risk warrants it.
- Disabling authentication does not delete member, product, Creative, or game
  history.
- Merge is transactional, preserves the surviving subject and Member ID,
  reconciles every product relationship, and writes a complete audit record.
- No automatic merge occurs from phone equality, display-name equality, or an
  unverified email.

## 10. Consent, privacy, and audit

- First Siamese identity creation records current Siamese membership terms and
  privacy acceptance; marketing consent is separate and off by default.
- Creative Club registration consent remains product-specific and is recorded
  even when membership is skipped.
- Authentication and product-link records preserve source and policy version.
- Analytics and general logs do not contain raw email, names, Member IDs,
  children, tokens, codes, secrets, or cookies.
- Security/rate-limit identifiers use keyed hashes and a documented retention
  policy.
- Product access history is visible only to authorized master admins and the
  relevant product where required.
- Privacy erasure or correction is explicit, scoped, and audited; it never
  silently destroys financial or legally required Creative records.

## 11. Availability and failure behavior

- Creative parent/child submission remains available if the membership
  provider or optional membership schema is unavailable.
- A failed optional membership link returns a visible, retryable pending state;
  it never reports success as linked.
- Creative search, checkout, packages, sessions, and receipts do not depend on
  member-provider readiness.
- Games show a retryable authentication error at their checkpoint while
  preserving guest progress.
- The Siamese Member Admin Dashboard reports membership-backend failures as
  operational errors, never as zero members.
- Provider, membership admin, and Creative health signals remain independent.

## 12. Migration and compatibility

Migration is additive, idempotent, transaction-safe, and count-verified.

1. Preserve every existing `parents`, `children`, `member_accounts`, package,
   order, payment, session, game player, and game run row.
2. Backfill existing linked/verified Creative member identities without
   changing their established OIDC subject or public Member ID.
3. Promote existing standalone provider identities into universal member
   records without creating fake Creative profiles or entitlements.
4. Migrate existing Google game players on their next verified Google login by
   matching their stored Google `sub`; do not bulk merge by email alone.
5. Keep a reconciliation queue for ambiguous email, subject, Google, or profile
   relationships.
6. Preserve existing member magic-link and game sessions through a documented
   compatibility window; do not invalidate all users during deployment.
7. Verify exact pre/post counts and schema shape, and expose runtime readiness
   independently from Creative core readiness.

## 13. Success measures

- one stable Siamese subject per safely resolved person;
- no fake parent/child rows created for game-only members;
- no product relationship lost when another product is used;
- every successful production product authorization updates its relationship
  and creates one history event;
- Creative registration completion rate remains available with membership
  accepted, skipped, or temporarily unavailable;
- zero expansion of existing Creative staff/manager permissions;
- zero implicit paid entitlements from identity creation;
- all ambiguous legacy links are visible for review rather than silently
  merged;
- the master directory reports failures explicitly and never as an empty list.

## 14. Delivery phases

The executable phase plan and acceptance ledger are maintained in
[`docs/siamese-member-platform/PLAN.md`](./docs/siamese-member-platform/PLAN.md)
and [`docs/siamese-member-platform/GATES.md`](./docs/siamese-member-platform/GATES.md).

The future member-facing dashboard starts only after this PRD's provider,
product-history, Creative linking, game integration, and master-admin gates are
complete and freshly reconciled.
