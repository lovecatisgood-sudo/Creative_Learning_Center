import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight edge guard: presence of the session cookie gates /admin/* and
// /api/admin/*. Cryptographic verification happens in route handlers via
// getSession(); this only bounces obviously-unauthenticated requests early.
const SESSION_COOKIE = "sccc_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = `/EN${pathname.slice(3) || "/"}`;
    return NextResponse.redirect(url, 308);
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
