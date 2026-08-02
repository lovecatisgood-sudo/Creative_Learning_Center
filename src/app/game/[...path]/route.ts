import { serveGameFile } from "@/lib/game-files";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The path comes from the URL rather than the `params` argument: its type
// differs between Next 14 (sync) and Next 15 (Promise), and this app is built
// against 14 on the server while local node_modules carries 15.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const canonicalDirectory = new Set([
    "/game/cat-vs-dog",
    "/game/cat-vs-dog/en",
    "/game/cat-vs-dog/th",
  ]);

  if (canonicalDirectory.has(pathname)) {
    url.pathname = `${pathname}/`;
    return Response.redirect(url, 308);
  }

  const indexDirectory = pathname.match(/^(\/game\/cat-vs-dog(?:\/en|\/th)?)\/index\.html$/);
  if (indexDirectory) {
    url.pathname = `${indexDirectory[1]}/`;
    return Response.redirect(url, 308);
  }

  const segments = pathname.split("/").filter(Boolean);
  return serveGameFile(segments.slice(1)); // drop the leading "game"
}
