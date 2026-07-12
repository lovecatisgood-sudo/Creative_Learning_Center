import type { SessionOptions } from "iron-session";

export type AdminSession = {
  adminId?: number;
  email?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "insecure-dev-secret-change-me-32chars!!",
  cookieName: "sccc_admin",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h shift
  },
};

// Cookie name is also referenced by middleware for a lightweight presence check.
export const SESSION_COOKIE = sessionOptions.cookieName;
