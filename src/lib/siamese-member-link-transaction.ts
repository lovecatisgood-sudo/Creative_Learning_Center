import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { SiameseCatLoginTransaction } from "@siamesecat/member-auth";
import { getSiameseCreativeAuthConfig } from "@/lib/siamese-creative-auth";

export type MemberLinkTransaction = {
  transaction?: SiameseCatLoginTransaction;
  memberAccountId?: number;
  correlationId?: string;
  language?: "en" | "th";
  returnTo?: string;
};

export async function getMemberLinkTransactionSession() {
  const config = getSiameseCreativeAuthConfig();
  if (config.transactionSecret.length < 32) throw new Error("SIAMESE_CREATIVE_TRANSACTION_SECRET must contain at least 32 characters");
  return getIronSession<MemberLinkTransaction>(await cookies(), {
    password: config.transactionSecret,
    cookieName: "sccc_siamese_link",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/public/member/connect",
      maxAge: 20 * 60,
    },
  });
}

export function bindMemberLinkToCurrentMember(
  session: MemberLinkTransaction,
  member: { id: number; preferredLanguage: string },
): asserts session is MemberLinkTransaction & { memberAccountId: number; correlationId: string } {
  if (session.memberAccountId === member.id && session.correlationId) return;
  const language = member.preferredLanguage === "en" ? "en" : "th";
  session.memberAccountId = member.id;
  session.correlationId = randomUUID();
  session.language = language;
  session.returnTo = language === "en" ? "/EN/member?membership=linked" : "/member?membership=linked";
}

export async function prepareMemberLink(memberAccountId: number, language: "en" | "th", returnTo: string): Promise<string> {
  const session = await getMemberLinkTransactionSession();
  session.memberAccountId = memberAccountId;
  session.correlationId = randomUUID();
  session.language = language;
  session.returnTo = returnTo;
  await session.save();
  return `/api/public/member/connect/start?flow=${encodeURIComponent(session.correlationId)}`;
}
