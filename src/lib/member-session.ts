import type { SessionOptions } from "iron-session";

export type MemberSession = {
  memberAccountId?: number;
  sessionVersion?: number;
  access?: "temporary" | "verified";
};

export const MEMBER_SESSION_COOKIE = "sccc_member";

export function getMemberSessionOptions(): SessionOptions {
  const configured = process.env.MEMBER_SESSION_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && (!configured || configured.length < 32)) {
    throw new Error("MEMBER_SESSION_SECRET must be a distinct secret of at least 32 characters");
  }
  return {
    password: configured || "insecure-member-dev-secret-change-32chars",
    cookieName: MEMBER_SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}
