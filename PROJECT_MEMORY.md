# Project memory — Cat vs Dog 1986

Last updated: 10 August 2026

## Product and platforms

- Game: Siamese Cat vs Dog 1986
- Website: `creative.siamesecat.cafe`
- Native bundle ID: `cafe.siamesecat.catvsdog1986`
- Mobile stack: Capacitor 8.5, Android, iOS, and
  `@capacitor-community/admob` 8.0
- The development native containers load the published game URL so web,
  Android, and iOS share the same game build.

## Advertising decisions

- Browser version keeps its existing internal house-ad restart behavior.
- Native first restart in each in-memory app session plays the internal house
  ad first and then an AdMob interstitial.
- Later native restarts play an AdMob interstitial only.
- Ad failures and timeouts must never block the next game run.
- Development uses Google's official Android and iOS demo AdMob IDs.
- Production AdMob app IDs, interstitial IDs, audience treatment, and consent
  configuration are still required before release.

## Analytics decisions

- GameAnalytics is integrated into the English and Thai HTML5 game.
- Events cover difficulty selection, game start, result, score, and stage.
- Analytics requires consent and sends no player name or email.
- Web, Android, and iOS use separate GameAnalytics game/secret key pairs.
- All six local credentials are valid and the three game keys are distinct.
- Credentials live only in ignored `.env` files; never copy their values into
  this memory file or commit them.
- Expected mobile variable names:
  - `GAMEANALYTICS_ANDROID_GAME_KEY`
  - `GAMEANALYTICS_ANDROID_SECRET_KEY`
  - `GAMEANALYTICS_IOS_GAME_KEY`
  - `GAMEANALYTICS_IOS_SECRET_KEY`
- The four mobile variables must also be configured in production hosting.

## Current implementation state

- Previous committed web analytics integration:
  `770c0cc feat: integrate GameAnalytics into web game`
- Android and iOS Capacitor projects have been generated.
- Android debug APK builds successfully with Java 21 and Android SDK 36.
- iOS project is generated but requires macOS/Xcode for compilation and
  signing.
- Web production build, TypeScript, game-feature checks, platform analytics
  isolation, and dependency audit pass.
- Mobile/native changes after commit `770c0cc` are currently uncommitted.

## Remaining release work

- Add production AdMob app and interstitial IDs.
- Complete AdMob privacy/consent and audience configuration.
- Build and sign Android release AAB.
- Build, sign, and archive iOS on macOS with Xcode.
- Replace generated app icon/splash assets and prepare store media.
- Update public privacy disclosures for GameAnalytics and AdMob.
- Perform physical-device gameplay and ad-flow testing.
