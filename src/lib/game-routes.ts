/**
 * Public, directory-style game routes hosted by the Creative Club site.
 *
 * Keep this module edge-safe: it is shared by middleware, the Node route
 * handler, and the sitemap. Game build files themselves live in
 * `game-assets/<slug>/` and are streamed by `serveGameFile`.
 */
export const HOSTED_GAMES = [
  {
    slug: "cat-vs-dog",
    lastModified: "2026-08-02T00:00:00+07:00",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    slug: "learn_python",
    lastModified: "2026-08-10T00:00:00+07:00",
    changeFrequency: "monthly",
    priority: 0.8,
  },
] as const;

export type HostedGame = (typeof HOSTED_GAMES)[number];

export type LocalizedGameUrls = {
  landing: string;
  en: string;
  th: string;
};

export const CANONICAL_GAME_DIRECTORY_PATHS = HOSTED_GAMES.flatMap(({ slug }) => [
  `/game/${slug}/`,
  `/game/${slug}/en/`,
  `/game/${slug}/th/`,
]);

export function gameLocalizedUrls(siteUrl: string, slug: HostedGame["slug"]): LocalizedGameUrls {
  const root = `${siteUrl}/game/${slug}`;
  return {
    landing: `${root}/`,
    en: `${root}/en/`,
    th: `${root}/th/`,
  };
}

/**
 * Returns the canonical directory URL when a game directory is missing its
 * trailing slash. Other routes deliberately retain the site's no-slash rule.
 */
export function canonicalGameDirectoryRedirect(pathname: string): string | null {
  const canonical = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return CANONICAL_GAME_DIRECTORY_PATHS.includes(canonical) && pathname !== canonical
    ? canonical
    : null;
}

/** Converts a game `index.html` request to its canonical directory URL. */
export function canonicalGameIndexRedirect(pathname: string): string | null {
  const indexSuffix = "/index.html";
  if (!pathname.endsWith(indexSuffix)) return null;

  const directory = pathname.slice(0, -"index.html".length);
  return CANONICAL_GAME_DIRECTORY_PATHS.includes(directory) ? directory : null;
}
