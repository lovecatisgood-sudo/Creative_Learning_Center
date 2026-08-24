import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createSiameseCatAuth, internalDestination } from "@siamesecat/member-auth";
import { getSiameseGameLoginConfig } from "../src/lib/game-features";

async function main() {
  const root = process.cwd();
  assert.equal(internalDestination("/game-assets/cat-vs-dog/en/"), "/game-assets/cat-vs-dog/en/");
  assert.equal(internalDestination("//attacker.example"), "/");
  assert.doesNotThrow(() => createSiameseCatAuth({ clientId: "local-test", clientSecret: "secret", issuer: "http://localhost:3000", allowInsecureLocalIssuer: true }));
  assert.throws(() => createSiameseCatAuth({ clientId: "local-test", clientSecret: "secret", issuer: "http://attacker.example", allowInsecureLocalIssuer: true }), /loopback/);

  const environmentKeys = ["NODE_ENV", "SIAMESE_GAME_AUTH_ENABLED", "SIAMESE_GAME_AUTH_ENV", "SIAMESE_OIDC_ISSUER", "SIAMESE_CAT_VS_DOG_CLIENT_ID", "SIAMESE_CAT_VS_DOG_CLIENT_SECRET", "SIAMESE_CAR_MAZE_CLIENT_ID", "SIAMESE_CAR_MAZE_CLIENT_SECRET", "SIAMESE_GAME_TRANSACTION_SECRET", "SIAMESE_GAME_SCHEMA_READY"] as const;
  const mutableEnvironment = process.env as Record<string, string | undefined>;
  const savedEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  try {
    mutableEnvironment.NODE_ENV = "production";
    process.env.SIAMESE_GAME_AUTH_ENABLED = "true";
    process.env.SIAMESE_GAME_AUTH_ENV = "staging";
    process.env.SIAMESE_OIDC_ISSUER = "https://id-staging.siamesecat.cafe";
    process.env.SIAMESE_CAT_VS_DOG_CLIENT_ID = "cat-vs-dog-staging";
    process.env.SIAMESE_CAT_VS_DOG_CLIENT_SECRET = "test-client-secret";
    process.env.SIAMESE_CAR_MAZE_CLIENT_ID = "car-maze-staging";
    process.env.SIAMESE_CAR_MAZE_CLIENT_SECRET = "car-maze-test-secret";
    process.env.SIAMESE_GAME_TRANSACTION_SECRET = "t".repeat(32);
    process.env.SIAMESE_GAME_SCHEMA_READY = "1";
    assert.equal(getSiameseGameLoginConfig().allowStagingIssuer, true);
    assert.equal(getSiameseGameLoginConfig().clientId, "cat-vs-dog-staging");
    assert.equal(getSiameseGameLoginConfig("car-maze").clientId, "car-maze-staging");
    assert.equal(getSiameseGameLoginConfig("car-maze").target, "car-maze");
    delete process.env.SIAMESE_CAR_MAZE_CLIENT_ID;
    delete process.env.SIAMESE_CAR_MAZE_CLIENT_SECRET;
    assert.equal(getSiameseGameLoginConfig("car-maze").clientId, "");
    assert.equal(getSiameseGameLoginConfig("car-maze").enabled, false);
    process.env.SIAMESE_GAME_SCHEMA_READY = "0";
    assert.equal(getSiameseGameLoginConfig("car-maze").enabled, false);
    process.env.SIAMESE_GAME_SCHEMA_READY = "1";
    process.env.SIAMESE_OIDC_ISSUER = "https://id-preview.siamesecat.cafe";
    assert.throws(() => getSiameseGameLoginConfig(), /Staging Siamese Cat issuer/);
    process.env.SIAMESE_OIDC_ISSUER = "https://id-staging.siamesecat.cafe";
    mutableEnvironment.NODE_ENV = "development";
    assert.throws(() => getSiameseGameLoginConfig(), /requires NODE_ENV=production/);

    process.env.SIAMESE_GAME_AUTH_ENV = "development";
    process.env.SIAMESE_OIDC_ISSUER = "https://id.siamesecat.cafe";
    assert.equal(getSiameseGameLoginConfig().issuer, "https://id.siamesecat.cafe");
    assert.equal(getSiameseGameLoginConfig().allowInsecureLocalIssuer, false);
    process.env.SIAMESE_OIDC_ISSUER = "https://id-preview.siamesecat.cafe";
    assert.throws(() => getSiameseGameLoginConfig(), /must use loopback or exactly/);
  } finally {
    for (const key of environmentKeys) {
      const value = savedEnvironment[key];
      if (value === undefined) delete mutableEnvironment[key];
      else mutableEnvironment[key] = value;
    }
  }

  const callbackSource = await readFile(path.join(root, "src/app/api/public/game/auth/siamese/callback/route.ts"), "utf8");
  const destroyAt = callbackSource.indexOf("transactionSession.destroy()");
  const finishAt = callbackSource.indexOf(".finish(new URL(request.url), transaction)");
  assert.ok(destroyAt >= 0 && finishAt > destroyAt, "OIDC transaction must be cleared before code exchange");
  assert.match(callbackSource, /gameSession\.playerPublicId = player\.publicId/);
  assert.match(callbackSource, /createSiameseCatAuth\(config\)/);
  assert.match(callbackSource, /transactionSession\.game/);

  const configRouteSource = await readFile(path.join(root, "src/app/api/public/game/auth/config/route.ts"), "utf8");
  assert.match(configRouteSource, /siameseGameAuthTarget\(game\)/);
  assert.match(configRouteSource, /getSiameseGameLoginConfig\(target\)/);
  assert.doesNotMatch(configRouteSource, /getGoogleGameLoginConfig/);

  const featureSource = await readFile(path.join(root, "src/lib/game-features.ts"), "utf8");
  assert.match(featureSource, /export function getGameLoginConfig\(\)[\s\S]*return getSiameseGameLoginConfig\("cat-vs-dog"\)/);
  assert.doesNotMatch(featureSource, /SIAMESE_GAME_CLIENT_ID/);

  const startSource = await readFile(path.join(root, "src/app/api/public/game/auth/siamese/start/route.ts"), "utf8");
  assert.match(startSource, /session\.game = game/);
  assert.match(startSource, /siameseGameAuthTarget/);

  const serverSource = await readFile(path.join(root, "server.js"), "utf8");
  assert.match(serverSource, /add column if not exists "siamese_issuer"/i);
  assert.match(serverSource, /create unique index if not exists "game_players_siamese_identity_unique"/i);
  assert.match(serverSource, /process\.env\.SIAMESE_GAME_SCHEMA_READY = "0"/);

  const healthSource = await readFile(path.join(root, "src/app/api/public/health/route.ts"), "utf8");
  assert.match(healthSource, /siameseGameSchemaReady/);
  assert.match(healthSource, /siameseGameAuthReady/);
  assert.match(healthSource, /await ensureSiameseGameSchemaReady\(\)/);

  const schemaGuardSource = await readFile(path.join(root, "src/lib/siamese-game-schema.ts"), "utf8");
  assert.match(schemaGuardSource, /pg_advisory_lock/);
  assert.match(schemaGuardSource, /add column if not exists "siamese_issuer"/i);
  assert.match(schemaGuardSource, /create unique index if not exists "game_players_siamese_identity_unique"/i);
  assert.match(schemaGuardSource, /CORE_CUSTOMER_COUNTS_CHANGED/);

  const playerSource = await readFile(path.join(root, "src/lib/siamese-game-player.ts"), "utf8");
  assert.match(playerSource, /siameseIssuer/);
  assert.match(playerSource, /siameseSubject/);
  assert.match(playerSource, /if \(emailOwner\) throw new SiameseAccountConflictError\(\)/);

  for (const locale of ["en", "th"]) {
    const html = await readFile(path.join(root, `game-assets/cat-vs-dog/${locale}/index.html`), "utf8");
    assert.match(html, /auth\/config\?game=cat-vs-dog/);
    assert.match(html, /auth\/siamese\/start\?game=cat-vs-dog/);
    assert.match(html, /Google or an email magic link|Google หรือลิงก์วิเศษทางอีเมล/);
    assert.doesNotMatch(html, /auth\/google|accounts\.google\.com|google\.accounts/);
    assert.ok(html.indexOf("afterThanks()") < html.lastIndexOf("showRestartAds(startNewRun)"), `${locale}: shared sign-in must remain at the established post-game gate before the next-run ad transition`);
  }

  const compatibilityGoogleRoute = await readFile(path.join(root, "src/app/api/public/game/auth/google/route.ts"), "utf8");
  assert.match(compatibilityGoogleRoute, /verifyIdToken/);
  assert.match(compatibilityGoogleRoute, /gamePlayers/);
  assert.doesNotMatch(compatibilityGoogleRoute, /status:\s*410/);

  console.log("game:siamese-auth -> OIDC, post-ad checkpoint, and legacy Google compatibility contracts are safe");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
