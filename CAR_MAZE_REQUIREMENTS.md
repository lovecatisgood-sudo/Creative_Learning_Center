# Car Maze — Product Requirements

This is the canonical product and acceptance reference for the Car Maze “Learn to Code” game. It applies to both the English and Thai builds under `game-assets/learn_python/` and takes precedence over assumptions made from the current compiled bundle.

Last confirmed: 2026-08-18

## Non-negotiable player flow

### Start immediately as a guest

- A first-time visitor must be able to start the game immediately without creating an account.
- The initial game experience must not require, ask for, or block on an email address, Google sign-in, account role selection, or any other authentication step.
- The first playable course stage must be available in local guest mode.
- Guest progress must remain available on the current device and must not be discarded when an account prompt is eventually shown.

### Authentication starts at Stage 20

- Stages 1–19 are fully playable without signing in.
- No sign-in prompt, account wall, or auth-dependent interruption may appear during stages 1–19.
- Sign-in is required only when the player reaches the Stage 20 checkpoint and wants to continue into Stage 20 or any later stage.
- The checkpoint must be based on the actual course stage number, not a world index, array index, page load, or first visit.
- A returning player who is already signed in must pass the checkpoint without being asked to sign in again.
- The sign-in checkpoint must preserve the player’s existing guest progress and provide a clear path to continue after successful authentication.

## Authentication availability

- Production account access uses Siamese Cat OIDC and the game backend's `/api/public/game/auth/config`, `/api/public/game/auth/siamese/start`, `/api/public/game/auth/siamese/callback`, and `/api/public/game/auth/session` routes.
- The Stage 20 gate may show the Siamese Cat control only when the auth-config response reports login and Siamese enabled. The browser must require Terms and Privacy acceptance, open the OIDC flow, verify the returned first-party session, and continue the pending Stage 20 action.
- A backend auth-config response alone does not make the game account flow available. The static game client, provider callback, account provisioning, session cookie, and return-to-game path must all work together.
- An unconfigured or temporarily unavailable sign-in service must never make the initial game experience unusable or show a misleading working-looking CTA. Stages 1–19 remain playable as a guest, and the Stage 20 message must be explicit and retryable.
- Successful authentication must preserve `car-maze-progress-v1`, remove only the guest identity marker, and allow the player to continue without restarting the course.
- A signed-in player must pass the Stage 20 checkpoint on later visits, and signing out must clear the server session before the game returns to guest mode.

## Milestone advertisements

- A house-ad opportunity occurs after the player completes Stages 10, 20, 30, 40, and 50 and chooses to leave the completion sheet.
- Authentication remains before entry into Stage 20. The Stage 20 sequence is therefore: authenticate after Stage 19, play Stage 20, finish Stage 20, show the milestone ad, then continue to Stage 21.
- Each milestone ad is shown at most once per device for that completed stage. Repeated clicks, revisiting a completed stage, or refreshing must not duplicate a previously shown milestone ad.
- The existing house-ad campaign API, impression/completion/skip/error events, progress bar, CTA, and configured skip delay remain authoritative.
- A missing, disabled, ineligible, or failed campaign must not block course progression or erase progress.

## Performance requirements

- The first playable guest screen must become interactive without preloading optional media such as the stage music. Music may be loaded lazily after the first user interaction, while the existing sound toggle and playback behavior remain available.
- The main ES module, its modulepreload link, the service-worker precache entry, and every lazy chunk that imports it must use one byte-identical URL. Query-string variants of the same hashed module are forbidden because they instantiate React twice and break hooks when a lazy win-sheet component mounts.
- The code runner must distinguish worker startup from program execution. A slow worker download or cold start must not be reported as a bad loop or force the player to rewrite a valid program.
- Execution safety limits remain mandatory: action, replay-frame, interpreter-operation, source-size, and world-call caps must continue to stop runaway programs.
- Entry-flow code must not perform unthrottled whole-document work on every React render or DOM mutation. Performance changes must preserve the guest-first flow, Stage 20 authentication checkpoint, progress handoff, and both locales.

## Acceptance checks before any production deployment

- Fresh browser storage/direct load opens the first playable stage without an auth wall.
- Stages 1–19 can be entered and completed as a guest with no sign-in interruption.
- The first auth checkpoint occurs at Stage 20, and nowhere earlier.
- An unconfigured auth service never produces a broken start screen or a false sign-in success.
- Local guest progress survives the Stage 20 checkpoint and the account handoff.
- With production auth enabled, a real Siamese Cat signup/login creates or updates the game player, establishes the `scvd_player` session, and returns the player to the pending Stage 20 action.
- A valid existing `scvd_player` session passes Stage 20 without a second sign-in prompt; logout clears that session.
- The behavior is identical in the English and Thai builds, with localized copy for the same states.
- Completing Stages 10, 20, 30, 40, and 50 offers exactly one house ad before the next action; other stages do not trigger this milestone placement.
- The deployed HTML references the newly built assets, and service-worker caching does not leave users on an older auth flow.
- Production deployment is not claimed complete until the above checks pass against the built artifacts and the relevant production route.

## Explicitly forbidden regressions

- Do not restore an account-first entry screen.
- Do not put “Create an account” or “Sign in” ahead of the first mission.
- Do not make a failed or missing auth configuration look like an empty game, a generic error, or a successful login.
- Do not patch only one locale or one duplicate compiled bundle when both language builds are deployed.
- Do not deploy a build that disables or removes the Stage 20 sign-in path while production auth is enabled.
