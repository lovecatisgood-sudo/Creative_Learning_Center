import { build } from "esbuild";

const androidTestId = "ca-app-pub-3940256099942544/1033173712";
const iosTestId = "ca-app-pub-3940256099942544/4411468910";
const testMode = process.env.ADMOB_TEST_MODE !== "false";

const androidId = process.env.ADMOB_ANDROID_INTERSTITIAL_ID?.trim() || androidTestId;
const iosId = process.env.ADMOB_IOS_INTERSTITIAL_ID?.trim() || iosTestId;

if (!testMode && (androidId === androidTestId || iosId === iosTestId)) {
  throw new Error("Production AdMob builds require Android and iOS interstitial IDs.");
}

await build({
  entryPoints: ["mobile/src/native-bridge.ts"],
  outfile: "game-assets/cat-vs-dog/assets/js/mobile-native-bridge.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome120", "safari17"],
  minify: true,
  legalComments: "none",
  define: {
    __SCVD_ADMOB_ANDROID_INTERSTITIAL_ID__: JSON.stringify(androidId),
    __SCVD_ADMOB_IOS_INTERSTITIAL_ID__: JSON.stringify(iosId),
    __SCVD_ADMOB_TEST_MODE__: JSON.stringify(testMode),
  },
});

console.log(`mobile:bridge -> built in ${testMode ? "test" : "production"} mode`);
