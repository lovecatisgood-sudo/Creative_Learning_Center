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

- The game sign-in service is currently not configured for production. The current configuration derives availability from `GAME_LOGIN_ENABLED` and `GOOGLE_CLIENT_ID`; both the UI and gating logic must respect that state.
- An unconfigured sign-in service must never make the initial game experience unusable or show a broken sign-in flow.
- While sign-in is unavailable, the game must still open in guest mode and keep stages 1–19 playable.
- If a player reaches the Stage 20 checkpoint while authentication is unavailable, show an explicit, retryable operational message explaining that account sign-in is not currently available. Do not show a misleading working-looking CTA, silently fail, crash, or erase local progress.
- The Stage 20+ account gate may only be enabled as a working production feature after the provider, redirect URLs, environment configuration, and end-to-end sign-in path have been verified.

## Acceptance checks before any production deployment

- Fresh browser storage/direct load opens the first playable stage without an auth wall.
- Stages 1–19 can be entered and completed as a guest with no sign-in interruption.
- The first auth checkpoint occurs at Stage 20, and nowhere earlier.
- An unconfigured auth service never produces a broken start screen or a false sign-in success.
- Local guest progress survives the Stage 20 checkpoint and the account handoff.
- The behavior is identical in the English and Thai builds, with localized copy for the same states.
- The deployed HTML references the newly built assets, and service-worker caching does not leave users on an older auth flow.
- Production deployment is not claimed complete until the above checks pass against the built artifacts and the relevant production route.

## Explicitly forbidden regressions

- Do not restore an account-first entry screen.
- Do not put “Create an account” or “Sign in” ahead of the first mission.
- Do not make a failed or missing auth configuration look like an empty game, a generic error, or a successful login.
- Do not patch only one locale or one duplicate compiled bundle when both language builds are deployed.
- Do not promote or deploy a build whose sign-in path has not been configured and verified.
