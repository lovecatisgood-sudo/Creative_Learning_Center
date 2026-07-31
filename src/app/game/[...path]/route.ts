import { serveGameFile } from "@/lib/game-files";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The path comes from the URL rather than the `params` argument: its type
// differs between Next 14 (sync) and Next 15 (Promise), and this app is built
// against 14 on the server while local node_modules carries 15.
export async function GET(req: Request) {
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return serveGameFile(segments.slice(1)); // drop the leading "game"
}
