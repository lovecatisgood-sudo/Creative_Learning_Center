import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight edge guard: presence of the session cookie gates /admin/* and
// /api/admin/*. Cryptographic verification happens in route handlers via
// getSession(); this only bounces obviously-unauthenticated requests early.
const SESSION_COOKIE = "sccc_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  const hasCookie = req.cookies.has(SESSION_COOKIE);

  // Public: signup pages, login page, login API, everything under /api/public.
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isProtected) return NextResponse.next();

  if (!hasCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
