import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Script } from "node:vm";

const root = process.cwd();
const gameFiles = [
  "game-assets/cat-vs-dog/en/index.html",
  "game-assets/cat-vs-dog/th/index.html",
];

for (const relative of gameFiles) {
  const html = await readFile(path.join(root, relative), "utf8");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.ok(scripts.length > 0, `${relative}: expected an inline game script`);
  for (const source of scripts) new Script(source);
  assert.match(html, /cfg\.loginEnabled/, `${relative}: game login UI must honor the server feature flag`);
  assert.doesNotMatch(html, /Royalty|high-score players get rewards|\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25/, `${relative}: prize-oriented login copy remains`);
  assert.match(html, /HOUSE_AD_BROWSER_COOLDOWN=120000/, `${relative}: browser ad cooldown is missing`);
  assert.match(html, /class="house-ad-label"[^>]*>Ads<\/span>/, `${relative}: visible ad label is missing`);
  assert.match(html, /id="house-ad-progress-value"/, `${relative}: ad progress bar is missing`);
  assert.match(html, /HOUSE_AD_SKIP_SECONDS=10/, `${relative}: ad skip must unlock after 10 seconds`);
  assert.match(html, /HADSKIP\.hidden=false;HADSKIP\.disabled=false/, `${relative}: top-right skip control does not unlock`);
  assert.match(html, /HADVIDEO\.currentTime\/HADVIDEO\.duration/, `${relative}: progress bar does not track playback`);
  assert.match(html, /gameanalytics-5\.0\.0\.min\.js/, `${relative}: pinned GameAnalytics SDK is missing`);
  assert.match(html, /gameanalytics-config\.js/, `${relative}: GameAnalytics runtime config is missing`);
  assert.match(html, /gameanalytics-web\.js/, `${relative}: GameAnalytics consent adapter is missing`);
  assert.match(html, /mobile-native-bridge\.js/, `${relative}: native mobile bridge is missing`);
  assert.match(html, /function showRestartAds\(/, `${relative}: mobile restart-ad sequence is missing`);
  assert.match(html, /consumeFirstInternalAd\(\)/, `${relative}: first-session internal ad gate is missing`);
  assert.match(html, /native\.showRestartAd\(\)/, `${relative}: AdMob restart hook is missing`);
  assert.match(html, /AN\.gameStart\(/, `${relative}: game-start analytics hook is missing`);
  assert.match(html, /AN\.gameOver\(/, `${relative}: game-over analytics hook is missing`);
  assert.match(html, /AN\.difficultySelected\(/, `${relative}: difficulty analytics hook is missing`);
}

for (const relative of [
  "game-assets/cat-vs-dog/assets/js/mobile-native-bridge.js",
  "mobile-shell/index.html",
  "capacitor.config.ts",
]) {
  const file = await stat(path.join(root, relative));
  assert.ok(file.isFile() && file.size > 0, `${relative}: missing or empty mobile app asset`);
}

for (const relative of ["public/game-ads/siamese-cat-cafe-en.mp4", "public/game-ads/creative-club-en.mp4", "public/game-ads/creative-club-th.mp4"]) {
  const file = await stat(path.join(root, relative));
  assert.ok(file.isFile() && file.size > 0, `${relative}: missing or empty video`);
}

const envExample = await readFile(path.join(root, ".env.example"), "utf8");
assert.match(envExample, /^SIAMESE_GAME_AUTH_ENABLED=false$/m);
assert.match(envExample, /^SIAMESE_CAT_VS_DOG_CLIENT_ID=cat-vs-dog-production$/m);
assert.match(envExample, /^SIAMESE_CAR_MAZE_CLIENT_ID=car-maze-production$/m);
assert.doesNotMatch(envExample, /^ROYALTY_/m);
assert.match(envExample, /^HOUSE_ADS_ENABLED=false$/m);
assert.match(envExample, /^GAMEANALYTICS_GAME_KEY=$/m);
assert.match(envExample, /^GAMEANALYTICS_SECRET_KEY=$/m);
assert.match(envExample, /^GAMEANALYTICS_ANDROID_GAME_KEY=$/m);
assert.match(envExample, /^GAMEANALYTICS_ANDROID_SECRET_KEY=$/m);
assert.match(envExample, /^GAMEANALYTICS_IOS_GAME_KEY=$/m);
assert.match(envExample, /^GAMEANALYTICS_IOS_SECRET_KEY=$/m);
assert.match(envExample, /^ADMOB_TEST_MODE=true$/m);

const adMigration = await readFile(path.join(root, "drizzle/0004_massive_scarecrow.sql"), "utf8");
assert.doesNotMatch(adMigration, /true, 100, 10, 0\)/, "seeded campaigns must not deploy active without cooldown");
assert.match(adMigration, /false, 100, 10, 120\)/, "seeded campaigns should be drafts with a cooldown");

console.log("game:features -> scripts parse, assets exist, and launch gates are safe");
