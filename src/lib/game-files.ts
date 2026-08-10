// Serves static game builds from game-assets/ instead of public/.
//
// Hostinger's static layer intercepts any request whose path exists on disk
// under the app and then fails to serve it (404), while paths that do not
// exist fall through to Node and work normally. Keeping the game outside
// public/ means the static layer never claims these URLs, so they reach Next
// and are streamed from here.
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "game-assets");
// Cat vs Dog has a server-generated analytics configuration. Other game
// directories are served directly and need no game-specific routing branch.
const CAT_VS_DOG_ANALYTICS_CONFIG = "cat-vs-dog/assets/js/gameanalytics-config.js";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
  ".map": "application/json",
};

export function serveGameFile(segments: string[]): Response {
  if (segments.join("/") === CAT_VS_DOG_ANALYTICS_CONFIG) {
    const gameKey = process.env.GAMEANALYTICS_GAME_KEY?.trim() ?? "";
    const secretKey = process.env.GAMEANALYTICS_SECRET_KEY?.trim() ?? "";
    const androidGameKey = process.env.GAMEANALYTICS_ANDROID_GAME_KEY?.trim() ?? "";
    const androidSecretKey = process.env.GAMEANALYTICS_ANDROID_SECRET_KEY?.trim() ?? "";
    const iosGameKey = process.env.GAMEANALYTICS_IOS_GAME_KEY?.trim() ?? "";
    const iosSecretKey = process.env.GAMEANALYTICS_IOS_SECRET_KEY?.trim() ?? "";
    const validPair = (key: string, secret: string) =>
      /^[a-f0-9]{32}$/i.test(key) && /^[a-f0-9]{40}$/i.test(secret);
    const mobileConfig = (key: string, secret: string, build: string) =>
      validPair(key, secret) ? { gameKey: key, secretKey: secret, build } : null;
    const config = {
      web: mobileConfig(gameKey, secretKey, process.env.GAMEANALYTICS_BUILD?.trim() || "web-1.0.0"),
      android: mobileConfig(
        androidGameKey,
        androidSecretKey,
        process.env.GAMEANALYTICS_ANDROID_BUILD?.trim() || "android-1.0.0",
      ),
      ios: mobileConfig(
        iosGameKey,
        iosSecretKey,
        process.env.GAMEANALYTICS_IOS_BUILD?.trim() || "ios-1.0.0",
      ),
    };
    return new Response(
      `window.SCVD_GAMEANALYTICS_CONFIG = ${JSON.stringify(config)};\n`,
      {
        headers: {
          "content-type": TYPES[".js"],
          "cache-control": "private, no-store, max-age=0",
        },
      },
    );
  }

  // Resolve inside ROOT only — reject any traversal attempt.
  const target = path.resolve(ROOT, ...segments);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let file = target;
  let isDirIndex = false;
  try {
    if (statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
      isDirIndex = true;
    }
  } catch {
    return new Response("Not found", { status: 404 });
  }

  let body: Buffer;
  try {
    body = readFileSync(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(file).toLowerCase();
  const isHtml = ext === ".html";
  const isMutableRuntimeFile = isHtml || ["sw.js", "registerSW.js", "manifest.webmanifest"].includes(path.basename(file));

  if (isHtml) {
    // The game's markup uses relative asset paths, but Next strips trailing
    // slashes — so at /game/cat-vs-dog/en a relative "assets/x.png" would
    // resolve against /game/cat-vs-dog/. A <base> pins the correct directory.
    const dir = isDirIndex ? segments : segments.slice(0, -1);
    const base = `/game/${dir.join("/")}/`.replace(/\/+/g, "/");
    const html = body
      .toString("utf8")
      .replace(/<head(\s[^>]*)?>/i, (m) => `${m}<base href="${base}">`);
    body = Buffer.from(html, "utf8");
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": TYPES[ext] ?? "application/octet-stream",
      // HTML must revalidate so game updates ship; assets are immutable enough
      // to cache hard. PWA entry files must also revalidate, otherwise a new
      // release can remain pinned behind an old service worker.
      "cache-control": isMutableRuntimeFile
        ? "public, max-age=0, must-revalidate"
        : "public, max-age=604800",
    },
  });
}
