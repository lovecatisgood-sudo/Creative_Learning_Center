import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext, runInContext } from "node:vm";
import path from "node:path";

const root = process.cwd();
const locales = [
  { code: "en", bundle: "index-CvTslmIN.js", css: "index-Cknk1RR5.css", sponsored: "SponsoredSlot-dU0F2JxT.js", removeAds: "RemoveAdsControl-DvH8rqTn.js" },
  { code: "th", bundle: "index-CDysuM6h.js", css: "index-BaFdOubp.css", sponsored: "SponsoredSlot-D2PvIXtS.js", removeAds: "RemoveAdsControl-0m7BaJUc.js" },
];
const performanceRelease = "20260818-perf-v1";
const milestoneRelease = "20260821-siamese-milestones-v1";
const localTransitionRelease = "20260821-local-transition-v1";
const fontRelease = "20260819-fonts-v2";
const localeGuestScripts = new Map();

for (const { code, bundle, css, sponsored, removeAds } of locales) {
  const base = path.join(root, "game-assets", "learn_python", code);
  const html = await readFile(path.join(base, "index.html"), "utf8");
  const guestScript = await readFile(path.join(base, "assets", "guest-first-entry-v1.js"), "utf8");
  localeGuestScripts.set(code, guestScript);
  const serviceWorker = await readFile(path.join(base, "sw.js"), "utf8");
  const registrationScript = await readFile(path.join(base, "registerSW.js"), "utf8");
  const compiledBundle = await readFile(path.join(base, "assets", bundle), "utf8");
  const sponsoredChunk = await readFile(path.join(base, "assets", sponsored), "utf8");
  const removeAdsChunk = await readFile(path.join(base, "assets", removeAds), "utf8");
  const executionWorker = await readFile(path.join(base, "assets", "execution.worker-BEyBRiev.js"), "utf8");

  new Script(guestScript);
  new Script(serviceWorker);
  new Script(registrationScript);
  assert.match(html, new RegExp(`guest-first-entry-v1\\.js\\?release=${milestoneRelease}`), `${code}: auth/milestone bootstrap cache-buster is missing`);
  assert.match(html, new RegExp(`registerSW\\.js\\?release=${localTransitionRelease}`), `${code}: local service-worker cleanup cache-buster is missing`);
  assert.ok(html.includes(`<link rel="modulepreload" crossorigin href="/game/learn_python/${code}/assets/${bundle}"`), `${code}: game shell modulepreload is missing`);
  assert.ok(html.includes(`<script type="module" crossorigin src="/game/learn_python/${code}/assets/${bundle}"></script>`), `${code}: game shell module entry is missing`);
  assert.doesNotMatch(html, new RegExp(`${bundle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?`), `${code}: query string splits the main React module identity`);
  assert.match(sponsoredChunk, new RegExp(`from"\\./${bundle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${code}: sponsored chunk does not share the main React module`);
  assert.match(removeAdsChunk, new RegExp(`from"\\./${bundle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${code}: remove-ads chunk does not share the main React module`);
  assert.doesNotMatch(html, /rel="preload"[^>]+as="audio"/i, `${code}: stage music must not block the initial page load`);
  assert.ok(html.indexOf(`<script src="/game/learn_python/${code}/assets/guest-first-entry-v1.js`) < html.indexOf(`<script type="module"`), `${code}: guest bootstrap must execute before the game bundle`);
  assert.ok(html.includes(`${css}?release=${fontRelease}`), `${code}: font-optimized stylesheet cache-buster is missing`);
  assert.match(html, new RegExp(`assets/${css.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${code}: expected current stylesheet reference`);
  const stylesheet = await readFile(path.join(base, "assets", css), "utf8");
  assert.match(stylesheet, /NotoSans(?:Thai)?-[^)]+\.woff2\)format\("woff2"\)/, `${code}: compressed Noto Sans webfont is missing`);
  assert.match(guestScript, /car-maze-guest-identity-v1/, `${code}: guest identity key is missing`);
  assert.doesNotMatch(guestScript, /accounts\.google\.com|auth\/google|google\.accounts/, `${code}: retired Google checkpoint remains in the client`);
  assert.match(guestScript, /Stages 1–19|ด่าน 1–19/, `${code}: pre-stage-20 copy is missing`);
  assert.match(guestScript, /target >= 20/, `${code}: stage-20 click checkpoint is missing`);
  assert.match(guestScript, /stage >= 20/, `${code}: direct stage-20 checkpoint is missing`);
  assert.match(guestScript, /\/api\/public\/game\/auth\/config/, `${code}: auth configuration check is missing`);
  assert.match(guestScript, /\/api\/public\/game\/auth\/siamese\/start/, `${code}: Siamese Cat OIDC start is missing`);
  assert.match(guestScript, /config\?\.loginEnabled && config\?\.siameseEnabled/, `${code}: Siamese availability gate is missing`);
  assert.match(guestScript, /car-maze-auth-gate__terms input/, `${code}: required Terms acceptance is missing`);
  assert.match(guestScript, /credentials: "same-origin"/, `${code}: auth requests must carry the first-party session`);
  assert.match(guestScript, /localStorage\.removeItem\(GUEST_KEY\)/, `${code}: account handoff does not clear guest identity`);
  assert.match(guestScript, /MutationObserver\(scheduleStageCheck\)/, `${code}: stage observer is not throttled`);
  assert.doesNotMatch(guestScript, /observer\.observe\(document\.documentElement/, `${code}: stage observer still watches the whole document root`);
  assert.match(guestScript, /new Set\(\[10, 20, 30, 40, 50\]\)/, `${code}: ten-stage ad milestones are missing`);
  assert.match(guestScript, /car-maze-house-ad-milestones-v1/, `${code}: milestone deduplication key is missing`);
  assert.match(guestScript, /handledMilestones\.add\(stage\)/, `${code}: storage failure has no in-memory milestone fallback`);
  assert.match(guestScript, /car_maze_stage_milestone/, `${code}: milestone ad event placement is missing`);
  assert.match(guestScript, /MILESTONE_STAGES\.has\(current\).*isMilestoneExitButton/s, `${code}: milestone ad is not tied to completion-sheet continuation`);
  assert.match(guestScript, /Math\.max\(10, Math\.min\(300/, `${code}: configured skip delay is not safely bounded`);
  const milestoneFunctionAt = guestScript.indexOf("async function showMilestoneAd");
  const milestoneHandledAt = guestScript.indexOf("markMilestoneShown(stage);", milestoneFunctionAt);
  const campaignRequestAt = guestScript.indexOf("/api/public/game/ad?language=", milestoneFunctionAt);
  assert.ok(milestoneHandledAt > milestoneFunctionAt && milestoneHandledAt < campaignRequestAt, `${code}: failed or unavailable ads can retrigger the same milestone`);
  const authBoundaryAt = guestScript.indexOf("if ((target >= 20");
  const adBoundaryAt = guestScript.indexOf("if (MILESTONE_STAGES.has(current)");
  assert.ok(authBoundaryAt > 0 && authBoundaryAt < adBoundaryAt, `${code}: Stage 20 ad can run before the authentication checkpoint`);
  assert.match(serviceWorker, new RegExp(`assets/guest-first-entry-v1\\.js\\?release=${milestoneRelease}`), `${code}: service worker does not precache the cache-busted auth/milestone bootstrap`);
  assert.match(serviceWorker, new RegExp(`registerSW\\.js",revision:"${localTransitionRelease}`), `${code}: service worker can retain the old registration script`);
  assert.match(serviceWorker, /index\.html",revision:"20260821-siamese-milestones-(?:en|th)-v3/, `${code}: service worker can retain the old game shell`);
  assert.match(registrationScript, /\["localhost", "127\.0\.0\.1", "::1"\]/, `${code}: loopback service-worker guard is missing`);
  assert.match(registrationScript, /registration\.unregister\(\)/, `${code}: local service workers are not unregistered`);
  assert.match(registrationScript, /window\.caches\.delete\(name\)/, `${code}: local stale Car Maze caches are not cleared`);
  assert.match(registrationScript, /navigator\.serviceWorker\.register/, `${code}: production PWA registration was removed`);

  let localLoadHandler = null;
  let unregisterCount = 0;
  let reloadCount = 0;
  const deletedCaches = [];
  const localSession = new Map();
  runInContext(registrationScript, createContext({
    URL,
    navigator: {
      serviceWorker: {
        controller: {},
        async getRegistrations() {
          return [{
            scope: `http://localhost/game/learn_python/${code}/`,
            async unregister() { unregisterCount += 1; },
          }];
        },
        async register() { throw new Error("loopback must not register a service worker"); },
      },
    },
    sessionStorage: {
      getItem(key) { return localSession.get(key) ?? null; },
      setItem(key, value) { localSession.set(key, value); },
      removeItem(key) { localSession.delete(key); },
    },
    window: {
      location: { hostname: "localhost", reload() { reloadCount += 1; } },
      addEventListener(type, handler) { if (type === "load") localLoadHandler = handler; },
      caches: {
        async keys() { return ["workbox-precache-local", "car-maze-world-media-v1", "unrelated-cache"]; },
        async delete(name) { deletedCaches.push(name); return true; },
      },
    },
  }));
  assert.equal(typeof localLoadHandler, "function", `${code}: local service-worker cleanup has no load handler`);
  await localLoadHandler();
  assert.equal(unregisterCount, 1, `${code}: local Car Maze service worker was not unregistered`);
  assert.deepEqual(deletedCaches.sort(), ["car-maze-world-media-v1", "workbox-precache-local"], `${code}: local stale cache cleanup is incorrectly scoped`);
  assert.equal(reloadCount, 1, `${code}: a controlled stale local page is not reloaded after cleanup`);

  let productionLoadHandler = null;
  let productionRegistration = null;
  runInContext(registrationScript, createContext({
    URL,
    navigator: {
      serviceWorker: {
        controller: null,
        async getRegistrations() { throw new Error("production must not run local cleanup"); },
        async register(url, options) { productionRegistration = { url, options }; },
      },
    },
    sessionStorage: {},
    window: {
      location: { hostname: "creative.siamesecat.cafe" },
      addEventListener(type, handler) { if (type === "load") productionLoadHandler = handler; },
    },
  }));
  assert.equal(typeof productionLoadHandler, "function", `${code}: production service-worker registration has no load handler`);
  await productionLoadHandler();
  assert.equal(productionRegistration?.url, `/game/learn_python/${code}/sw.js`, `${code}: production service-worker URL changed`);
  assert.equal(productionRegistration?.options?.scope, `/game/learn_python/${code}/`, `${code}: production service-worker scope changed`);
  assert.ok(serviceWorker.includes(`assets/${bundle}`), `${code}: service worker does not precache the game bundle`);
  assert.ok(!serviceWorker.includes(`assets/${bundle}?`), `${code}: service worker precaches a second React module URL`);
  assert.ok(serviceWorker.includes(`assets/${css}?release=${fontRelease}`), `${code}: service worker does not precache the font-optimized stylesheet`);
  assert.match(serviceWorker, new RegExp(`assets/execution\\.worker-BEyBRiev\\.js\\?release=${performanceRelease}`), `${code}: service worker does not precache the performance worker`);
  assert.match(compiledBundle, /car-maze-guest-identity-v1/, `${code}: compiled game no longer recognizes guest identities`);
  assert.match(compiledBundle, /ji=15e3/, `${code}: execution timeout budget was not updated`);
  assert.match(compiledBundle, /type===`ready`/, `${code}: compiled client does not handle worker readiness`);
  assert.match(compiledBundle, /worker_start_timeout/, `${code}: worker startup has no distinct failure state`);
  assert.match(compiledBundle, /The program runner is still starting/, `${code}: worker startup error is not explicit`);
  assert.match(compiledBundle, /requestIdleCallback/, `${code}: execution worker warmup is missing`);
  assert.match(compiledBundle, /function po\(\)\{[^}]*;B=!0;let e=/, `${code}: music is still initialized before user interaction`);
  assert.doesNotMatch(compiledBundle, /;B=!0,_o\(\);/, `${code}: music still initializes eagerly at mount`);
  assert.match(executionWorker, /postMessage\(\{type:`ready`\}\)/, `${code}: execution worker does not announce readiness`);
  for (const cap of ["actionCap", "frameCap", "operationCap", "sourceCharacterCap", "worldCallCap"]) {
    assert.match(executionWorker, new RegExp(`${cap}:Q\\(`), `${code}: ${cap} safety cap is missing`);
  }

  const store = new Map();
  const document = {
    documentElement: { dataset: { defaultLocale: code } },
    head: { appendChild() {} },
    body: { appendChild() {} },
    querySelector() { return null; },
    createElement() { return { dataset: {}, style: {}, setAttribute() {}, addEventListener() {}, appendChild() {}, remove() {} }; },
    addEventListener() {},
  };
  class Observer { observe() {} disconnect() {} }
  const context = createContext({
    document,
    localStorage: {
      getItem(key) { return store.get(key) ?? null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); },
    },
    crypto: { randomUUID: () => "test-guest-id" },
    MutationObserver: Observer,
    Element: class Element {},
    fetch() { throw new Error("fetch must not run before Stage 20"); },
    window: { setTimeout(callback) { callback(); } },
    console,
  });
  runInContext(guestScript, context);
  const guest = JSON.parse(store.get("car-maze-guest-identity-v1"));
  assert.equal(guest.role, "guest", `${code}: fresh load did not create guest identity`);
  assert.equal(guest.locale, code, `${code}: guest identity locale is wrong`);
}

assert.equal(localeGuestScripts.get("en"), localeGuestScripts.get("th"), "EN and TH must run the same locale-aware auth/ad controller");

console.log("car-maze: guest-first entry and Stage 20 checkpoint checks passed");
