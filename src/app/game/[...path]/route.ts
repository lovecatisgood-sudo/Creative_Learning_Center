import { serveGameFile } from "@/lib/game-files";
import {
  canonicalGameDirectoryRedirect,
  canonicalGameIndexRedirect,
} from "@/lib/game-routes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The path comes from the URL rather than the `params` argument: its type
// differs between Next 14 (sync) and Next 15 (Promise), and this app is built
// against 14 on the server while local node_modules carries 15.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const directoryRedirect = canonicalGameDirectoryRedirect(pathname);
  if (directoryRedirect) {
    return new Response(null, {
      status: 308,
      headers: { Location: `${directoryRedirect}${url.search}` },
    });
  }

  const indexRedirect = canonicalGameIndexRedirect(pathname);
  if (indexRedirect) {
    return new Response(null, {
      status: 308,
      headers: { Location: `${indexRedirect}${url.search}` },
    });
  }

  const segments = pathname.split("/").filter(Boolean);
  return serveGameFile(segments.slice(1)); // drop the leading "game"
}
