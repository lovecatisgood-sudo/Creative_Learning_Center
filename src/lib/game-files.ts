// Serves the Cat vs Dog game from game-assets/ instead of public/.
//
// Hostinger's static layer intercepts any request whose path exists on disk
// under the app and then fails to serve it (404), while paths that do not
// exist fall through to Node and work normally. Keeping the game outside
// public/ means the static layer never claims these URLs, so they reach Next
// and are streamed from here.
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "game-assets");

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

export function serveGameFile(segments: string[]): Response {
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
      // to cache hard.
      "cache-control": isHtml
        ? "public, max-age=0, must-revalidate"
        : "public, max-age=604800",
    },
  });
}
