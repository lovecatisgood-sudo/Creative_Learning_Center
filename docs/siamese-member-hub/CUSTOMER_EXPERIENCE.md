# Siamese Cat Member Hub - Customer Experience

**Status:** design direction for owner review  
**Preview:** [`assets/customer-portal-concept-v1.png`](./assets/customer-portal-concept-v1.png)  
**Data shown in the preview:** example data only

## Design read

A customer membership wallet for families and café visitors, with a warm,
trustworthy Siamese Cat identity and a clear mobile-first product interface.

- Design variance: 5. Familiar navigation with a distinctive membership card.
- Motion intensity: 3. Only interaction and state feedback.
- Visual density: 6. Enough information for daily use without an admin feel.
- Brand foundation: preserve the existing Creative Club logo-derived brown,
  cream, teal, paper, and status tokens. Use the real approved logo in the
  implementation. The generated cat mark is a concept placeholder only.
- Shape rule: 16px content surfaces, pill actions, 8px form controls.
- Theme: system light/dark modes in implementation; the first concept shows the
  light mode.

## Primary navigation

### Mobile

The bottom navigation contains four destinations:

1. Home
2. Points
3. Coupons
4. Account

Creative Club, Cat Café, Cat Hotel, and games appear as connected services on
Home. This keeps the daily member actions easy to reach without turning every
product into a competing primary tab.

### Desktop

The left navigation contains Home, Love Points, Coupons, connected products,
Account, and Privacy. Sign out remains easy to find but visually secondary.

## Home

The member sees, in this order:

1. Membership identity with public Member ID and account status.
2. Authoritative Love Points balance and freshness time.
3. Available coupons and benefits that can be used now.
4. Creative Club family summary when a verified connection exists.
5. Recent membership activity across approved products.
6. Connected and available Siamese Cat services.

Every remote panel supports loading, unavailable, not connected, no activity,
real zero, and stale-data states. An unavailable service never appears as an
empty balance or missing membership.

## Love Points

The Points screen contains:

- available balance;
- pending balance when the owning ledger supports it;
- expiry information when supplied by the ledger;
- recent earning, redemption, adjustment, reversal, and expiration activity;
- a plain explanation of how points work;
- support path for a disputed transaction.

The Hub displays the loyalty system's authoritative values. It does not derive
points from Creative purchases or mutate the ledger in the first release.

## Coupons and membership benefits

The Coupons screen separates:

- Available: currently eligible and unused.
- Saved: intentionally saved by the member if the owning service supports it.
- Used: redeemed benefits with date and location.
- Expired: retained for understandable history when permitted.

Each coupon displays title, concise benefit, eligibility, expiry, participating
location or product, and terms. A coupon action must use a server-created,
short-lived, single-use redemption presentation. A static coupon ID, screenshot,
or public Member ID is never sufficient to redeem value.

The Hub does not invent eligibility or redemption state. A named coupon/benefit
service must own campaign rules, issuance, reservation, redemption, reversal,
and audit before implementation begins.

## Creative Club

The Home summary may show only the fields allowed by the versioned Creative
member-summary contract, such as:

- connected family status;
- child display names if the approved policy allows them;
- active package name and remaining entitlement summary;
- active or next session summary;
- link to the Creative product portal for details and actions.

The Hub never edits children, packages, sessions, purchases, receipts, or
consents. The existing Creative `/member` experience remains the product-level
source until a separate migration is approved.

## Account, security, and privacy

The Account screen includes:

- Member ID and verified sign-in methods;
- connected Siamese Cat products;
- preferred language;
- session and sign-out controls;
- contact/support route;
- privacy information and a verified privacy-request entry point.

Email and phone are account attributes, not cross-system identity keys. Account
merge, unlink, recovery, and deletion require separate verified workflows and
auditable safety rules.

## Copy and data rules

- Thai and English receive equal information and error coverage.
- Currency, dates, and times use the member's locale and Asia/Bangkok business
  context where appropriate.
- Preview numbers, names, coupons, and dates are examples only.
- Production never labels stale information as current.
- Internal database IDs, raw OIDC tokens, service credentials, health notes,
  sensitive child data, and staff-only notes never reach the browser.
