(function (global) {
  "use strict";

  var KEY_PREFIX = "scvd_pending_score_v1:";
  var RETRY_DELAYS = [0, 250, 1000];

  function storageKey(playerId) {
    return KEY_PREFIX + encodeURIComponent(String(playerId || ""));
  }

  function create(options) {
    options = options || {};
    var request = options.fetch || global.fetch.bind(global);
    var storage = options.storage || global.localStorage;
    var wait = options.wait || function (milliseconds) {
      return new Promise(function (resolve) { global.setTimeout(resolve, milliseconds); });
    };
    var onStatus = options.onStatus || function () {};

    function pending(playerId) {
      if (!playerId) return null;
      try {
        var raw = storage.getItem(storageKey(playerId));
        if (!raw) return null;
        var run = JSON.parse(raw);
        return run && Number.isSafeInteger(run.score) ? run : null;
      } catch (_error) {
        return null;
      }
    }

    function remember(playerId, run) {
      if (!playerId || !run || !Number.isSafeInteger(run.score)) throw new Error("Invalid score save request");
      var previous = pending(playerId);
      var selected = previous && previous.score > run.score ? previous : run;
      storage.setItem(storageKey(playerId), JSON.stringify(selected));
      return selected;
    }

    async function submit(run) {
      var lastError = null;
      for (var attempt = 0; attempt < RETRY_DELAYS.length; attempt += 1) {
        if (attempt > 0) {
          onStatus("retrying");
          await wait(RETRY_DELAYS[attempt]);
        }
        try {
          var response = await request("/api/public/game/score", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(run),
          });
          var data = await response.json().catch(function () { return {}; });
          if (response.ok) return data;
          var error = new Error(data.error || "Unable to save score");
          error.retryable = response.status === 429 || response.status >= 500;
          if (!error.retryable) throw error;
          lastError = error;
        } catch (error) {
          lastError = error;
          if (error && error.retryable === false) throw error;
        }
      }
      throw lastError || new Error("Unable to save score");
    }

    async function save(playerId, run) {
      var selected = remember(playerId, run);
      onStatus("saving");
      try {
        var result = await submit(selected);
        storage.removeItem(storageKey(playerId));
        onStatus("saved");
        return result;
      } catch (error) {
        onStatus("pending");
        throw error;
      }
    }

    async function flush(playerId) {
      var run = pending(playerId);
      return run ? save(playerId, run) : null;
    }

    return { save: save, flush: flush, pending: pending };
  }

  global.SCVDScoreSync = { create: create };
})(window);
