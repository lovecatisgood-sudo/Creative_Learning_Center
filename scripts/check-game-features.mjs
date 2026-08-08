import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const gameFiles = [
  "game-assets/cat-vs-dog/en/index.html",
  "game-assets/cat-vs-dog/th/index.html",
];

for (const relative of gameFiles) {
  const html = await readFile(path.join(root, relative), "utf8");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.ok(scripts.length > 0, `${relative}: expected an inline game script`);
  for (const source of scripts) new Function(source);
  assert.match(html, /cfg\.royaltyEnabled/, `${relative}: Royalty UI must honor the server feature flag`);
  assert.match(html, /HOUSE_AD_BROWSER_COOLDOWN=120000/, `${relative}: browser ad cooldown is missing`);
}

for (const relative of ["public/game-ads/siamese-cat-cafe-en.mp4", "public/game-ads/creative-club-en.mp4"]) {
  const file = await stat(path.join(root, relative));
  assert.ok(file.isFile() && file.size > 0, `${relative}: missing or empty video`);
}

const envExample = await readFile(path.join(root, ".env.example"), "utf8");
assert.match(envExample, /^ROYALTY_LEADERBOARD_ENABLED=false$/m);
assert.match(envExample, /^HOUSE_ADS_ENABLED=false$/m);

const adMigration = await readFile(path.join(root, "drizzle/0004_massive_scarecrow.sql"), "utf8");
assert.doesNotMatch(adMigration, /true, 100, 10, 0\)/, "seeded campaigns must not deploy active without cooldown");
assert.match(adMigration, /false, 100, 10, 120\)/, "seeded campaigns should be drafts with a cooldown");

console.log("game:features -> scripts parse, assets exist, and launch gates are safe");
