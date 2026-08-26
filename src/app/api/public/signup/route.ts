import { NextResponse } from "next/server";
import { withPrivateAuthHeaders } from "@/lib/auth-response";
import { db } from "@/db";
import { parents, children, memberAccounts, memberConsents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toBkk } from "@/lib/time";
import { generateMemberUid, normalizeEmail, normalizePhone } from "@/lib/member-identity";
import { establishMemberSession } from "@/lib/member-auth";
import { PROGRAM_INTEREST_VALUES } from "@/lib/program-options";
import { isTrustedMutationOrigin } from "@/lib/request-security";
import { ensureMemberSchemaReady } from "@/lib/member-schema";
import { prepareMemberLink } from "@/lib/siamese-member-link-transaction";

// Public (no auth) parent self-registration — PRD §6.1. Creates a full parent
// record (profile_complete = true) plus one or more children in a transaction.
// Duplicate phone is allowed (staff resolves later); the client shows the warning.
type ChildInput = { name: string; dob: string; gender: "male" | "female" };

// Mirrors the client-side checks in src/app/signup/page.tsx validate() —
// never trust the client.
const PHONE_RE = /^[0-9+\-\s]{6,20}$/;
function isPlausiblePhone(phone: string): boolean {
  if (!PHONE_RE.test(phone)) return false;
  return (phone.match(/\d/g) ?? []).length >= 6;
}
// Today's date (Asia/Bangkok) as YYYY-MM-DD, for future-DOB comparisons.
function bkkTodayISO(): string {
  const b = toBkk(new Date());
  const y = b.getUTCFullYear();
  const m = String(b.getUTCMonth() + 1).padStart(2, "0");
  const d = String(b.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
  if (!isTrustedMutationOrigin(req)) return privateJson({ error: "Forbidden origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body) return privateJson({ error: "Bad request" }, { status: 400 });

  const parentName = String(body.parentName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const rawEmail = String(body.email ?? "").trim();
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  const phoneNormalized = normalizePhone(phone);
  const language = body.language === "en" ? "en" : "th";
  const programInterest = String(body.programInterest ?? "").trim();
  const consent = body.consent === true;
  const membershipChoice = body.membershipChoice === "connect" ? "connect" : "skip";
  const kids: ChildInput[] = Array.isArray(body.children) ? body.children : [];

  // Server-side validation mirrors the required fields; never trust the client.
  if (!parentName || !phone || !consent || kids.length === 0) {
    return privateJson({ error: "Missing required fields" }, { status: 422 });
  }
  if (!isPlausiblePhone(phone) || !phoneNormalized) {
    return privateJson({ error: "Invalid phone number" }, { status: 422 });
  }
  if (rawEmail && !email) {
    return privateJson({ error: "Invalid email address" }, { status: 422 });
  }
  if (programInterest && !PROGRAM_INTEREST_VALUES.has(programInterest)) {
    return privateJson({ error: "Invalid program interest" }, { status: 422 });
  }
  const today = bkkTodayISO();
  for (const k of kids) {
    if (!k?.name?.trim() || !k?.dob || (k.gender !== "male" && k.gender !== "female")) {
      return privateJson({ error: "Invalid child data" }, { status: 422 });
    }
    if (k.dob > today) {
      return privateJson({ error: "Date of birth can't be in the future" }, { status: 422 });
    }
  }

  // Registration is a core business path. If member provisioning is not
  // available, retain the established parent/child write path so the durable
  // registration is never lost.
  if (!await ensureMemberSchemaReady()) {
    const existing = await db.select({ id: parents.id }).from(parents).where(eq(parents.phone, phone)).limit(1);
    const result = await db.transaction(async (tx) => {
      const [parent] = await tx.insert(parents).values({ name: parentName, phone, email, profileComplete: true }).returning();
      const insertedChildren = await tx.insert(children).values(kids.map((k) => ({
        parentId: parent.id,
        name: k.name.trim(),
        dob: k.dob,
        gender: k.gender,
        notes: programInterest ? `Package interest: ${programInterest}` : null,
      }))).returning();
      return { parent, children: insertedChildren };
    });
    return privateJson({
      ok: true,
      memberUid: null,
      parentName: result.parent.name,
      childNames: result.children.map((child) => child.name),
      duplicatePhone: existing.length > 0,
      memberProvisioningPending: true,
      membershipConnection: membershipChoice === "connect" ? "pending" : "skipped",
    });
  }

  // Detect (but never block) a duplicate phone — staff resolves later. The flag
  // is returned to the staff-facing success screen, not exposed as a public
  // lookup endpoint (avoids phone-number enumeration).
  const existing = await db
    .select({ id: parents.id })
    .from(memberAccounts)
    .innerJoin(parents, eq(memberAccounts.parentId, parents.id))
    .where(eq(memberAccounts.phoneNormalized, phoneNormalized))
    .limit(1);
  const duplicatePhone = existing.length > 0;

  const publicUid = generateMemberUid();
  const result = await db.transaction(async (tx) => {
    const [parent] = await tx
      .insert(parents)
      .values({ name: parentName, phone, email, profileComplete: true })
      .returning();

    const [member] = await tx
      .insert(memberAccounts)
      .values({
        parentId: parent.id,
        publicUid,
        phoneNormalized,
        preferredLanguage: language,
      })
      .returning();

    await tx.insert(memberConsents).values([
      {
        memberAccountId: member.id,
        type: "terms",
        policyVersion: process.env.TERMS_VERSION || "2026-08-11",
        source: "signup",
      },
      {
        memberAccountId: member.id,
        type: "privacy",
        policyVersion: process.env.PRIVACY_VERSION || "2026-08-11",
        source: "signup",
      },
    ]);

    const insertedChildren = await tx
      .insert(children)
      .values(
        kids.map((k) => ({
          parentId: parent.id,
          name: k.name.trim(),
          dob: k.dob,
          gender: k.gender,
          notes: programInterest ? `Package interest: ${programInterest}` : null,
        }))
      )
      .returning();

    return { parent, member, children: insertedChildren };
  });

  await establishMemberSession(result.member.id, result.member.sessionVersion, "temporary");

  let membershipStartUrl: string | undefined;
  let membershipConnection: "pending" | "skipped" = membershipChoice === "connect" ? "pending" : "skipped";
  if (membershipChoice === "connect") {
    try {
      membershipStartUrl = await prepareMemberLink(
        result.member.id,
        language,
        `${language === "en" ? "/EN" : ""}/signup/success`,
      );
    } catch {
      console.error("Creative registration saved but optional Siamese connection could not be prepared", {
        code: "CREATIVE_LINK_PREPARATION_FAILED",
      });
    }
  }

  return privateJson({
    ok: true,
    memberUid: result.member.publicUid,
    parentName: result.parent.name,
    childNames: result.children.map((c) => c.name),
    duplicatePhone,
    membershipConnection,
    ...(membershipStartUrl ? { membershipStartUrl } : {}),
  });
}

function privateJson(body: object, init?: ResponseInit) {
  return withPrivateAuthHeaders(NextResponse.json(body, init));
}
