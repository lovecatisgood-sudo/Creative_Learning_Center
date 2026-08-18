import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext, runInContext } from "node:vm";
import path from "node:path";

const root = process.cwd();
const locales = [
  { code: "en", bundle: "index-CvTslmIN.js", css: "index-Cknk1RR5.css" },
  { code: "th", bundle: "index-CDysuM6h.js", css: "index-BaFdOubp.css" },
];

for (const { code, bundle, css } of locales) {
  const base = path.join(root, "game-assets", "learn_python", code);
  const html = await readFile(path.join(base, "index.html"), "utf8");
  const guestScript = await readFile(path.join(base, "assets", "guest-first-entry-v1.js"), "utf8");
  const serviceWorker = await readFile(path.join(base, "sw.js"), "utf8");
  const compiledBundle = await readFile(path.join(base, "assets", bundle), "utf8");

  new Script(guestScript);
  new Script(serviceWorker);
  assert.ok(html.indexOf("guest-first-entry-v1.js") < html.indexOf(`${bundle}`), `${code}: guest bootstrap must load before the game bundle`);
  assert.match(html, new RegExp(`assets/${css.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${code}: expected current stylesheet reference`);
  assert.match(html, /accounts\.google\.com/, `${code}: Google auth origin is missing from the page policy`);
  assert.match(guestScript, /car-maze-guest-identity-v1/, `${code}: guest identity key is missing`);
  assert.doesNotMatch(guestScript, /ACCOUNT_FLOW_READY\s*=\s*false/, `${code}: production Google sign-in was disabled in the client`);
  assert.match(guestScript, /Stages 1–19|ด่าน 1–19/, `${code}: pre-stage-20 copy is missing`);
  assert.match(guestScript, /target >= 20/, `${code}: stage-20 click checkpoint is missing`);
  assert.match(guestScript, /stage >= 20/, `${code}: direct stage-20 checkpoint is missing`);
  assert.match(guestScript, /\/api\/public\/game\/auth\/config/, `${code}: auth configuration check is missing`);
  assert.match(guestScript, /\/api\/public\/game\/auth\/google/, `${code}: Google credential handoff is missing`);
  assert.match(guestScript, /google\.accounts\.id\.renderButton/, `${code}: Google sign-in control is missing`);
  assert.match(guestScript, /acceptTerms: true/, `${code}: required Terms acceptance is missing`);
  assert.match(guestScript, /credentials: "same-origin"/, `${code}: auth requests must carry the first-party session`);
  assert.match(guestScript, /localStorage\.removeItem\(GUEST_KEY\)/, `${code}: account handoff does not clear guest identity`);
  assert.match(serviceWorker, /assets\/guest-first-entry-v1\.js/, `${code}: service worker does not precache the guest bootstrap`);
  assert.match(serviceWorker, /20260818-guest-first-stage20-v4/, `${code}: service worker cache revision was not bumped for the auth flow`);
  assert.match(compiledBundle, /car-maze-guest-identity-v1/, `${code}: compiled game no longer recognizes guest identities`);

  const store = new Map();
  const document = {
    documentElement: { dataset: { defaultLocale: code } },
    head: { appendChild() {} },
    body: { appendChild() {} },
    querySelector() { return null; },
    createElement() { return { dataset: {}, style: {}, setAttribute() {}, addEventListener() {}, appendChild() {}, remove() {} }; },
    addEventListener() {},
  };
  class Observer { observe() {} }
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

console.log("car-maze: guest-first entry and Stage 20 checkpoint checks passed");
