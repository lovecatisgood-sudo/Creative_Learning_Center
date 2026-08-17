import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberAccounts } from "@/db/schema";
import { getMemberSessionOptions, type MemberSession } from "@/lib/member-session";
import { ensureMemberSchemaReady } from "@/lib/member-schema";

export type CurrentMember = {
  id: number;
  parentId: number;
  publicUid: string;
  emailNormalized: string | null;
  emailVerifiedAt: Date | null;
  preferredLanguage: string;
  access: "temporary" | "verified";
};

export async function getMemberSession() {
  return getIronSession<MemberSession>(await cookies(), getMemberSessionOptions());
}

export async function establishMemberSession(
  memberAccountId: number,
  sessionVersion: number,
  access: "temporary" | "verified",
) {
  const session = await getMemberSession();
  session.memberAccountId = memberAccountId;
  session.sessionVersion = sessionVersion;
  session.access = access;
  await session.save();
}

export async function getCurrentMember(): Promise<CurrentMember | null> {
  if (!await ensureMemberSchemaReady()) return null;
  const session = await getMemberSession();
  if (!session.memberAccountId || !session.sessionVersion) return null;

  const [account] = await db
    .select()
    .from(memberAccounts)
    .where(eq(memberAccounts.id, session.memberAccountId))
    .limit(1);
  if (!account || account.sessionVersion !== session.sessionVersion) {
    session.destroy();
    return null;
  }

  const verified = Boolean(account.emailNormalized && account.emailVerifiedAt);
  if (session.access === "verified" && !verified) {
    session.destroy();
    return null;
  }

  return {
    id: account.id,
    parentId: account.parentId,
    publicUid: account.publicUid,
    emailNormalized: account.emailNormalized,
    emailVerifiedAt: account.emailVerifiedAt,
    preferredLanguage: account.preferredLanguage,
    access: verified && session.access === "verified" ? "verified" : "temporary",
  };
}

export async function requireMember(): Promise<CurrentMember> {
  const member = await getCurrentMember();
  if (!member) throw new MemberUnauthorizedError();
  return member;
}

export class MemberUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "MemberUnauthorizedError";
  }
}
