import { NextResponse } from "next/server";
import { db } from "@/db";
import { children, parents, sessions } from "@/db/schema";
import { sql, or, ilike, eq, desc } from "drizzle-orm";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";

// A2 — live search across child name / parent name / phone. ILIKE on UTF-8 text
// handles Thai script with no special collation (PRD §5). Returns child rows
// with their parent and a running-session flag (green dot in the UI).
export async function GET(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const term = `%${q}%`;
  const runningExists = sql<boolean>`exists (
    select 1 from ${sessions} s
    where s.child_id = ${children.id} and s.status = 'running'
  )`;

  const rows = await db
    .select({
      childId: children.id,
      childName: children.name,
      parentId: parents.id,
      parentName: parents.name,
      phone: parents.phone,
      profileComplete: parents.profileComplete,
      hasRunningSession: runningExists,
    })
    .from(children)
    .leftJoin(parents, eq(children.parentId, parents.id))
    .where(
      or(
        ilike(children.name, term),
        ilike(parents.name, term),
        ilike(parents.phone, term)
      )
    )
    .orderBy(desc(children.createdAt))
    .limit(50);

  // A fast-created child has no parent row yet → profile is incomplete.
  const results = rows.map((r) => ({
    ...r,
    profileComplete: r.parentId ? r.profileComplete : false,
  }));

  return NextResponse.json({ results });
}
