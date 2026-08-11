# Cat vs Dog 1986 mobile app

The Android and iOS containers use Capacitor with the bundle identifier
`cafe.siamesecat.catvsdog1986`. During development they load the published game
URL so the website and app share one game build.

## Development commands

```sh
pnpm mobile:bridge
pnpm mobile:sync
pnpm mobile:android
pnpm mobile:ios
```

Android builds require Android Studio, Android SDK 36, and Java 21. iOS builds
must be signed and archived on macOS with Xcode.

## AdMob release configuration

Development uses Google's official demo app and interstitial IDs. Never publish
those IDs. Before a release:

1. Replace `admob_app_id` in Android `strings.xml` and
   `GADApplicationIdentifier` in iOS `Info.plist` with the platform app IDs.
2. Build the bridge with `ADMOB_TEST_MODE=false`,
   `ADMOB_ANDROID_INTERSTITIAL_ID`, and `ADMOB_IOS_INTERSTITIAL_ID` set.
3. Complete the AdMob privacy/consent configuration and confirm the intended
   audience treatment before requesting production ads.

The first restart in each in-memory app session plays the internal house ad and
then the AdMob interstitial. Later restarts play the AdMob interstitial only.
Failures time out safely and the next run starts.

## GameAnalytics

Create separate Android and iOS games in GameAnalytics. Set the six mobile
GameAnalytics environment variables documented in `.env.example`. If either
platform pair is absent or malformed, analytics is disabled on that platform;
the HTML5 credentials are never reused by the native app.
