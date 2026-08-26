import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runInNewContext } from "node:vm";

const source = await readFile(
  path.join(process.cwd(), "game-assets/cat-vs-dog/assets/js/score-sync.js"),
  "utf8",
).catch(() => "");

assert.ok(source, "Cat vs Dog must ship a browser score-persistence component");

function storageDouble() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function loadScoreSync({ fetch, storage, statuses = [] }) {
  const sandboxWindow = {};
  runInNewContext(source, { window: sandboxWindow });
  const factory = sandboxWindow.SCVDScoreSync?.create;
  assert.equal(typeof factory, "function", "score persistence must expose a browser controller");
  return factory({
    fetch,
    storage,
    wait: async () => {},
    onStatus(status) { statuses.push(status); },
  });
}

const playerA = "PLAYER-A";
const playerB = "PLAYER-B";
const run = {
  score: 98765,
  mode: "hard",
  stage: 12,
  victory: false,
  language: "en",
  durationSeconds: 321,
};

{
  const storage = storageDouble();
  const requests = [];
  const sync = loadScoreSync({
    storage,
    async fetch(url, init) {
      requests.push({ url, init });
      return {
        ok: true,
        status: 201,
        async json() { return { ok: true, personalBest: 98765, rank: 4 }; },
      };
    },
  });

  const saved = await sync.save(playerA, run);
  assert.deepEqual(saved, { ok: true, personalBest: 98765, rank: 4 });
  assert.equal(requests.length, 1, "one successful run must create one score request");
  assert.equal(requests[0].url, "/api/public/game/score");
  assert.equal(requests[0].init.method, "POST");
  assert.deepEqual(JSON.parse(requests[0].init.body), run);
  assert.equal(sync.pending(playerA), null, "a confirmed score must not remain pending");
}

{
  const storage = storageDouble();
  const statuses = [];
  let attempts = 0;
  const sync = loadScoreSync({
    storage,
    statuses,
    async fetch() {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary network failure");
      return {
        ok: true,
        status: 201,
        async json() { return { ok: true, personalBest: 98765, rank: 2 }; },
      };
    },
  });

  const saved = await sync.save(playerA, run);
  assert.equal(saved.personalBest, 98765);
  assert.equal(attempts, 3, "a transient failure must be retried before giving up");
  assert.equal(sync.pending(playerA), null);
  assert.ok(statuses.includes("retrying"), "retrying a score must be observable to the game UI");
  assert.equal(statuses.at(-1), "saved");
}

{
  const storage = storageDouble();
  const statuses = [];
  let online = false;
  let requests = 0;
  const sync = loadScoreSync({
    storage,
    statuses,
    async fetch() {
      requests += 1;
      if (!online) throw new Error("offline");
      return {
        ok: true,
        status: 201,
        async json() { return { ok: true, personalBest: 98765, rank: 1 }; },
      };
    },
  });

  await assert.rejects(sync.save(playerA, run), /offline/);
  assert.equal(JSON.stringify(sync.pending(playerA)), JSON.stringify(run), "an unsaved score must survive a failed request");
  assert.equal(statuses.at(-1), "pending", "a final save failure must be visible to the game UI");

  const beforeOtherPlayerFlush = requests;
  assert.equal(await sync.flush(playerB), null, "one member must never inherit another member's pending score");
  assert.equal(requests, beforeOtherPlayerFlush);

  online = true;
  const recovered = await sync.flush(playerA);
  assert.equal(recovered.personalBest, 98765);
  assert.equal(sync.pending(playerA), null, "a recovered score must be removed only after server confirmation");
}

{
  const storage = storageDouble();
  const sync = loadScoreSync({
    storage,
    async fetch() { throw new Error("offline"); },
  });
  await assert.rejects(sync.save(playerA, run));
  await assert.rejects(sync.save(playerA, { ...run, score: 1000 }));
  assert.equal(sync.pending(playerA).score, 98765, "a lower failed run must not replace a higher pending score");
}

console.log("game:score-persistence -> authenticated saves, retry, recovery, and member isolation are safe");
