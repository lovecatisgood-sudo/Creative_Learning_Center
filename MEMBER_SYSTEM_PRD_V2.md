# Siamese Cat Member System — PRD V2

**Status:** implementation source of truth
**Updated:** 2026-08-11
**Supersedes:** the V1 statements that parents have no account, portal, or email flow.

## 1. Product contract

Every registered guardian is a **Siamese Cat Member**. A member owns one or
more child profiles; paid package instances remain bound to the child they were
sold for. Registration is intentionally fast and email is optional at first.

Every member receives a stable, random, non-secret public identifier such as
`SCM-8K4P-29QX`. The identifier is for receipts and staff lookup. It is never an
authentication credential.

Member access has two states:

- **Temporary:** access is limited to a short-lived, device-bound session
  established by signup or by a single-use purchase-claim link.
- **Verified:** a verified primary email enables durable, cross-device
  passwordless sign-in.

Losing temporary access never deletes the member, children, purchases, package
balances, sessions, or receipts. Staff can issue a new claim link after an
identity check.

## 2. Roles and boundaries

- **Member:** read-only access to their own guardian profile, children,
  packages, usage, active sessions, and receipts. Cannot start/end sessions,
  redeem credits, alter balances, view payment-proof photos, or merge accounts.
- **Staff:** search and create members, sell packages, operate sessions, complete
  profiles, and issue replacement claim links.
- **Manager:** all staff abilities plus member merge and account-status tools.
- **Team account:** an employee credential. It is never a member credential.

## 3. Registration and purchase claim

### Customer-device signup

1. The guardian enters their name, phone, optional email, child details, and
   accepts the current privacy/terms versions.
2. The server creates the member and children and establishes a temporary
   member session on that device.
3. The success screen shows the Member ID and links to the member dashboard.
4. Staff locates the record by Member ID, phone, guardian name, or child name.
5. A confirmed purchase appears in the member dashboard without a new login.

### Staff-device creation

1. Staff searches for an existing member before creating a record.
2. If none exists, Quick Add creates a temporary member with child name and
   phone and marks the profile incomplete.
3. Confirming payment may issue a single-use purchase-claim link/QR.
4. Scanning the link establishes a temporary member session on the customer's
   device. The staff browser never receives a member session.

Default lifetimes:

- unused purchase-claim link: 24 hours;
- temporary member session: 7 days;
- email sign-in/verification link: 20 minutes.

## 4. Email binding and sign-in

Email is optional at registration and required for durable portal access.

- Normalize with trim + lowercase and validate server-side.
- An entered address remains unverified until its single-use email link is
  consumed.
- Verification and sign-in endpoints return generic responses to prevent
  account enumeration.
- Token values contain at least 128 bits of entropy, are stored only as hashes,
  expire, and can be consumed once.
- Requests are rate-limited by member, destination, and request origin.
- An email already bound to another member enters recovery/manager merge flow;
  it never silently moves data or creates a second verified identity.

## 5. Member portal

The portal is mobile-first, Thai/English, and read-only for launch.

- **Home:** Member ID, temporary/verified state, bind-email prompt, active
  session with prominent pickup time, urgent expiry notices.
- **Packages:** grouped by child; status, total/remaining hours, remaining
  credits, expiry, and last use.
- **History:** completed sessions, redemptions, purchases, and customer-safe
  receipt details.
- **Profile:** guardian contact, children, language, verification state,
  privacy/terms records, sign out.

All member responses are scoped through the authenticated member-to-parent
relationship and use `Cache-Control: no-store`. Arbitrary child/member IDs from
the client never determine authorization.

## 6. Staff and manager member tools

Search accepts Member ID, normalized phone, email, guardian name, and child
name. Results show temporary/verified and complete/incomplete states.

Member detail aggregates children, package balances, current sessions, usage,
and receipts. Staff can complete profiles and issue claim links. Managers can
merge duplicates in a transaction with a full audit record; phone equality
alone is never sufficient for an automatic merge.

Manager metrics include total/new members, temporary/verified members,
incomplete profiles, possible duplicates, unclaimed purchases, active packages,
and packages expiring within 30 days.

## 7. Consent and privacy

Terms/privacy acceptance is versioned and timestamped with source (`signup`,
`staff`, or `email_binding`) and optional acting staff ID. Marketing consent is
separate and optional. Analytics and logs must not contain names, phone numbers,
emails, Member IDs, child IDs, or access tokens.

Member authentication uses a cookie and secret separate from admin auth.
Payment-proof images remain admin-only. Claim/verification issuance and
consumption, profile edits, and merges are audited.

## 8. Mobile and accessibility launch rules

- One-column fields below 380px; inputs remain at least 16px and controls at
  least 44px.
- Fixed/sticky controls and bottom navigation honor device safe-area insets and
  do not hide behind the software keyboard.
- First invalid field receives focus and is scrolled into view.
- Status is communicated with text/icon as well as color.
- Thai and English text wrap without clipping at 320px, 360px, 390px, 430px,
  tablet portrait, and tablet landscape widths.
- Network failure preserves entered form data and offers a retry.
- Member pages provide loading, empty, expired-session, and signed-out states.

## 9. Launch exclusions

Online purchase/payment, booking, capacity management, customer-initiated
session controls, package transfer, push/SMS notifications, multiple guardian
logins, and customer viewing of payment proofs are not part of this release.

## 10. Launch gates

- Registration without email creates a Member ID and temporary session.
- A confirmed purchase appears only for its owning member and child.
- A staff-created member can claim access with a single-use expiring link.
- UID or phone knowledge alone cannot reveal member data.
- Email verification enables cross-device sign-in without account enumeration.
- Temporary expiry never deletes business records.
- Duplicate recovery and manager merge preserve balances and audit history.
- Consent versions and relevant staff actions are auditable.
- Member APIs reject cross-family identifier manipulation.
- Production build, migration, type checks, dependency/security checks, and
  mobile/accessibility checks pass before deployment.
