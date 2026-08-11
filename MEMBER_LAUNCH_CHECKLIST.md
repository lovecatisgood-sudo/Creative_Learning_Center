# Siamese Cat Member — launch checklist

This is the operational gate for the temporary-UID member system described in
`MEMBER_SYSTEM_PRD_V2.md`. Code completion alone is not approval to change the
production database or deploy.

## Automated gates

- [x] TypeScript typecheck
- [x] Production Next.js build
- [x] Static ownership, privacy, token, migration, and mobile contract checks
- [x] Fresh-database migrations
- [x] Legacy-parent backfill migration check
- [x] Isolated PostgreSQL member/package/receipt/consent integration checks
- [x] Main-site, family-tool, game-route, and deployment-hygiene checks
- [x] Dependency audit reports no known vulnerabilities

Re-run immediately before release:

```bash
pnpm install --frozen-lockfile
pnpm security:check
pnpm check:member-release
pnpm build
```

## Production configuration

- [ ] Take/verify a restorable database backup before migration.
- [ ] Set a unique 32+ character `MEMBER_SESSION_SECRET` (not `SESSION_SECRET`).
- [ ] Set `APP_ORIGIN=https://creative.siamesecat.cafe`.
- [ ] Verify SMTP sender/domain authentication and delivery to a real inbox.
- [ ] Set versioned `TERMS_VERSION` and `PRIVACY_VERSION` values.
- [ ] Confirm HTTPS, secure cookies, reverse-proxy headers, and upload backups.
- [ ] Schedule the guarded `member:prune-tokens` job.

## Human acceptance on a staging deployment

- [ ] Test Thai and English signup on a small phone (320/360 px), modern iPhone,
      Android phone, tablet, and desktop.
- [ ] Confirm optional email behavior and record the displayed `SCM-…` UID.
- [ ] Complete a staff sale; scan the single-use QR on the customer's device.
- [ ] Confirm the package, balance, usage history, and customer-safe receipt.
- [ ] Confirm the same claim link fails on second use and after expiry.
- [ ] Bind an email, follow the magic link, sign out, and sign back in.
- [ ] Confirm invalid/cross-member receipt IDs reveal no customer data.
- [ ] Complete and link a staff-created profile; verify the old UID still resolves.
- [ ] Merge a deliberate duplicate as manager and verify source sessions/tokens fail.
- [ ] Check keyboard, safe-area, zoom, focus, screen-reader labels, and contrast.
- [ ] Review logs/analytics to confirm token fragments and member pages are absent.

## Controlled rollout

- [ ] Deploy migration and application in one maintenance window.
- [ ] Run a staff training purchase using a test customer and reverse it per policy.
- [ ] Monitor 4xx/5xx, email delivery, duplicate phones, and claim-link failures.
- [ ] Keep rollback application artifact and database restore instructions ready.
- [ ] Obtain product owner approval after the staging evidence above is recorded.
