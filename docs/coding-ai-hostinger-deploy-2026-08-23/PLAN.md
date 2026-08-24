# Execution plan

- [completed] Reproduce the reported Hostinger prebuild from a clean `origin/main` checkout and identify the source/config mismatch.
- [completed] Implement the smallest source-controlled fix that validates evaluated rewrites and touches the stale route configuration without weakening validation.
- [completed] Run frozen install, exact prebuild, full Next.js build, and focused route/source gates in the clean worktree.
- [in progress] Commit and push only the scoped repair to `main`.
- [pending] Confirm Hostinger build success and independently verify all public production routes/content.
- [pending] Perform fresh source-to-production reconciliation.
