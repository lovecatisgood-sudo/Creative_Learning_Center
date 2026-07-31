// TEMPORARY diagnostic route. Reports what the running Node process actually
// sees on disk under public/, so we can tell "file missing" apart from "file
// present but unreadable by the web server". Delete once /game/cat-vs-dog is
// confirmed live. Exposes only filenames + permission bits of public assets.
import { NextResponse } from "next/server";
import { accessSync, constants, readdirSync, statSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function probe(rel: string) {
  const abs = path.join(process.cwd(), "public", rel);
  try {
    const s = statSync(abs);
    let readable = true;
    try {
      accessSync(abs, constants.R_OK);
    } catch {
      readable = false;
    }
    return {
      rel,
      exists: true,
      kind: s.isDirectory() ? "dir" : "file",
      mode: (s.mode & 0o777).toString(8),
      uid: s.uid,
      gid: s.gid,
      size: s.size,
      readable,
    };
  } catch (err) {
    return { rel, exists: false, code: (err as NodeJS.ErrnoException).code };
  }
}

function list(rel: string) {
  try {
    return readdirSync(path.join(process.cwd(), "public", rel)).slice(0, 60);
  } catch (err) {
    return `ERROR: ${(err as NodeJS.ErrnoException).code}`;
  }
}

export async function GET() {
  return NextResponse.json({
    cwd: process.cwd(),
    processUid: typeof process.getuid === "function" ? process.getuid() : null,
    publicTop: list(""),
    gameDir: list("game"),
    gameInner: list("game/cat-vs-dog"),
    probes: [
      "logo.png",
      "deploy-check.txt",
      "game",
      "game/cat-vs-dog",
      "game/cat-vs-dog/index.html",
      "game/cat-vs-dog/en/index.html",
      "game/cat-vs-dog/assets/img/logo.png",
    ].map(probe),
  });
}
