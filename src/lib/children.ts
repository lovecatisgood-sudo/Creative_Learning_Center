import { db } from "@/db";
import { children, parents } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ChildDetail = {
  id: number;
  name: string;
  dob: string | null;
  gender: "male" | "female" | null;
  ageYears: number | null;
  notes: string | null;
  parent: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    profileComplete: boolean;
  } | null;
};

// Whole-year age from a YYYY-MM-DD date of birth, or null if unknown.
export function ageFromDob(dob: string | null, now = new Date()): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = now.getUTCFullYear() - y;
  const beforeBirthday =
    now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

// Siblings sharing the same parent (for the family-pass child selector, A7/V7).
export async function getSiblings(childId: number): Promise<{ id: number; name: string }[]> {
  const [self] = await db
    .select({ parentId: children.parentId })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);
  if (!self?.parentId) return [];
  return db
    .select({ id: children.id, name: children.name })
    .from(children)
    .where(eq(children.parentId, self.parentId));
}

// Core child + parent record (packages/sessions/history are layered on in M3/M4).
export async function getChildCore(id: number): Promise<ChildDetail | null> {
  const [row] = await db
    .select({
      id: children.id,
      name: children.name,
      dob: children.dob,
      gender: children.gender,
      notes: children.notes,
      parentId: parents.id,
      parentName: parents.name,
      phone: parents.phone,
      email: parents.email,
      profileComplete: parents.profileComplete,
    })
    .from(children)
    .leftJoin(parents, eq(children.parentId, parents.id))
    .where(eq(children.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    dob: row.dob,
    gender: row.gender,
    ageYears: ageFromDob(row.dob),
    notes: row.notes,
    parent: row.parentId
      ? {
          id: row.parentId,
          name: row.parentName ?? "",
          phone: row.phone ?? "",
          email: row.email,
          // A stub parent (name blank) is treated as incomplete regardless.
          profileComplete: Boolean(row.profileComplete) && Boolean(row.parentName?.trim()),
        }
      : null,
  };
}
