import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_GAME_DIRECTORY_PATHS,
  canonicalGameDirectoryRedirect,
  canonicalGameIndexRedirect,
  gameLocalizedUrls,
  HOSTED_GAMES,
} from "../src/lib/game-routes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const siteUrl = "https://creative.siamesecat.cafe";
const expectedSlugs = ["cat-vs-dog", "learn_python"];

assert(HOSTED_GAMES.map(({ slug }) => slug).join(",") === expectedSlugs.join(","), "Hosted game registry is missing or reordering a public game");
assert(new Set(CANONICAL_GAME_DIRECTORY_PATHS).size === expectedSlugs.length * 3, "Game directory registry contains duplicate paths");

for (const slug of expectedSlugs) {
  const urls = gameLocalizedUrls(siteUrl, slug as (typeof HOSTED_GAMES)[number]["slug"]);
  assert(urls.landing === `${siteUrl}/game/${slug}/`, `${slug} landing URL is incorrect`);
  assert(urls.en === `${siteUrl}/game/${slug}/en/`, `${slug} English URL is incorrect`);
  assert(urls.th === `${siteUrl}/game/${slug}/th/`, `${slug} Thai URL is incorrect`);

  for (const url of Object.values(urls)) {
    const pathname = new URL(url).pathname;
    assert(CANONICAL_GAME_DIRECTORY_PATHS.includes(pathname), `${pathname} is not a canonical game directory`);
    assert(canonicalGameDirectoryRedirect(pathname.slice(0, -1)) === pathname, `${pathname} does not restore its trailing slash`);
    assert(canonicalGameIndexRedirect(`${pathname}index.html`) === pathname, `${pathname}index.html does not redirect to its directory`);
  }
}

assert(canonicalGameDirectoryRedirect("/playgroup") === null, "Non-game routes must keep the site's no-slash convention");
assert(canonicalGameIndexRedirect("/game/learn_python/fr/index.html") === null, "Unregistered game locales must not gain canonical redirects");

const root = process.cwd();
const routeHandler = readFileSync(join(root, "src/app/game/[...path]/route.ts"), "utf8");
const middleware = readFileSync(join(root, "src/middleware.ts"), "utf8");
const sitemap = readFileSync(join(root, "src/app/sitemap.ts"), "utf8");
const gameFiles = readFileSync(join(root, "src/lib/game-files.ts"), "utf8");

assert(routeHandler.includes("canonicalGameDirectoryRedirect") && routeHandler.includes("canonicalGameIndexRedirect"), "Game route handler is not using the shared canonical redirect contract");
assert(!routeHandler.includes("cat-vs-dog"), "Game route handler still hard-codes the Cat vs Dog surface");
assert(middleware.includes("CANONICAL_GAME_DIRECTORY_PATHS"), "Middleware does not preserve every hosted game's trailing slash");
assert(sitemap.includes("HOSTED_GAMES") && sitemap.includes("gameLocalizedUrls"), "Sitemap does not derive game hreflang entries from the shared registry");
assert(gameFiles.includes("path.resolve(ROOT, ...segments)") && gameFiles.includes('".webmanifest"'), "Game file serving is not generic enough for a Vite/PWA game build");

console.log("game-routes → hosted game paths, redirects, sitemap alternates, and generic file serving verified");
