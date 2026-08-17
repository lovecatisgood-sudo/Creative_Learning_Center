import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog, memberAccessTokens, memberAccounts } from "@/db/schema";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";
import { memberOrigin } from "@/lib/member-links";
import { expiresFromNow, generateAccessToken, hashAccessToken } from "@/lib/member-tokens";
import { isTrustedMutationOrigin } from "@/lib/request-security";
import { ensureMemberSchemaReady } from "@/lib/member-schema";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationOrigin(request)) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  let adminId: number;
  try {
    adminId = await requireAdminId();
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw error;
  }
  if (!await ensureMemberSchemaReady()) return NextResponse.json({ error: "Member service temporarily unavailable" }, { status: 503 });
  const memberId = Number((await params).id);
  if (!Number.isInteger(memberId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const [member] = await db.select({ id: memberAccounts.id }).from(memberAccounts).where(eq(memberAccounts.id, memberId)).limit(1);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = generateAccessToken();
  const expiresAt = expiresFromNow(24 * 60);
  await db.transaction(async (tx) => {
    const [created] = await tx.insert(memberAccessTokens).values({
      memberAccountId: memberId,
      type: "purchase_claim",
      tokenHash: hashAccessToken(token),
      expiresAt,
      createdByAdmin: adminId > 0 ? adminId : null,
    }).returning({ id: memberAccessTokens.id });
    await tx.insert(auditLog).values({
      adminId: adminId > 0 ? adminId : null,
      action: "member_claim_reissued",
      entity: "member_account",
      entityId: memberId,
      detail: { tokenId: created.id, expiresAt: expiresAt.toISOString() },
    });
  });
  return NextResponse.json({ claimUrl: `${memberOrigin()}/member/claim#token=${encodeURIComponent(token)}`, expiresAt: expiresAt.toISOString() });
}
