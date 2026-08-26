# Cat vs Dog Member Score Reliability — Plan

1. **Goal lock and source reconciliation** — complete
   - Reconcile owner request, project memory, provider contract, Creative
     signup, Cat vs Dog checkpoint, and Car Maze Stage-20 invariants.
2. **Score reliability implementation** — complete
   - Add per-member pending-high-score persistence, automatic game-over save,
     bounded retry, recovery, visible status, and EN/TH integration.
3. **Pre-deployment gates** — complete
   - Run focused score/game/auth checks, provider verify and PostgreSQL tests,
     Creative signup/member/link database checks, Car Maze flow, and full build.
4. **Fresh reconciliation and commit** — complete
   - Compare the final repository directly to `PROJECT_INTENT.md`, inspect the
     exact diff, record evidence, and commit only the reviewed release files.
5. **Production promotion and terminal verification** — complete
   - Push the verified commit to `origin/main`; verify deployed health, provider
     protocol, both game auth configs, Cat vs Dog source, released signup/sign-in
     pages, and score/leaderboard availability without creating production data.
