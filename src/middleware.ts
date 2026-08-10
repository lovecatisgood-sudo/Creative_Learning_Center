import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_GAME_DIRECTORY_PATHS } from "@/lib/game-routes";

// Lightweight edge guard: presence of the session cookie gates /admin/* and
// /api/admin/*. Cryptographic verification happens in route handlers via
// getSession(); this only bounces obviously-unauthenticated requests early.
const SESSION_COOKIE = "sccc_admin";
const CANONICAL_TRAILING_SLASH_PATHS = new Set(CANONICAL_GAME_DIRECTORY_PATHS);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.headers.get("host") || req.nextUrl.host;
  if (host.toLowerCase() === "www.creative.siamesecat.cafe") {
    const url = new URL(req.url);
    url.hostname = "creative.siamesecat.cafe";
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = new URL(req.url);
    const suffix = pathname.slice(3).replace(/\/$/, "");
    url.pathname = `/EN${suffix}`;
    return NextResponse.redirect(url.toString(), 308);
  }

  // Next's automatic slash redirect is disabled so the static game can keep
  // directory-style canonical URLs. Preserve the site's existing no-slash
  // convention everywhere else.
  if (
    pathname !== "/" &&
    pathname.endsWith("/") &&
    !CANONICAL_TRAILING_SLASH_PATHS.has(pathname)
  ) {
    const url = new URL(req.url);
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url.toString(), 308);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-sccc-language", pathname === "/EN" || pathname.startsWith("/EN/") ? "en" : "th");
  requestHeaders.set("x-sccc-pathname", pathname);
  const nextWithLanguage = () => NextResponse.next({ request: { headers: requestHeaders } });

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  const hasCookie = req.cookies.has(SESSION_COOKIE);

  // Public: signup pages, login page, login API, everything under /api/public.
  if (isLoginPage || isLoginApi) {
    return nextWithLanguage();
  }

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isProtected) return nextWithLanguage();

  if (!hasCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return nextWithLanguage();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon-16.png|favicon-32.png|apple-touch-icon.png|main-site/assets).*)"],
};
