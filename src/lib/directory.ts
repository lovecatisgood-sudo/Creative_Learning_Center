import { db } from "@/db";
import { children, parents, sessions } from "@/db/schema";
import { sql, ilike, or, isNull, asc, and, eq, inArray } from "drizzle-orm";

export type DirChild = { id: number; name: string; hasRunningSession: boolean };
export type DirGroup =
  | { kind: "orphans"; children: DirChild[] }
  | { kind: "parent"; parentId: number; parentName: string; phone: string; profileComplete: boolean; children: DirChild[] };
export type DirectoryPage = { groups: DirGroup[]; page: number; totalPages: number; totalGroups: number };

// Batched membership check rather than a per-row correlated EXISTS subquery:
// a `sql` template referencing ${children.id} inside a nested subquery
// compiles to an unqualified "id" column, which collides with sessions' own
// "id" PK and silently breaks the correlation (every row then gets the same
// answer, driven by unrelated rows elsewhere in `sessions`). IN-list + Set
// is unambiguous and just as cheap for the small per-page id lists here.
async function runningSessionChildIds(childIds: number[]): Promise<Set<number>> {
  if (!childIds.length) return new Set();
  const rows = await db
    .select({ childId: sessions.childId })
    .from(sessions)
    .where(and(inArray(sessions.childId, childIds), eq(sessions.status, "running")));
  return new Set(rows.map((r) => r.childId));
}

// Parent-grouped directory. Orphan children (no parent) are collapsed into ONE
// group pinned first; parent groups follow, alphabetical by parent name.
// Pagination counts GROUPS (orphan group counts as 1 when present).
export async function getDirectory({
  q = "",
  page = 1,
  pageSize = 12,
}: { q?: string; page?: number; pageSize?: number }): Promise<DirectoryPage> {
  const term = q.trim() ? `%${q.trim()}%` : null;

  // 1) Orphan children (parentId null). Filter by child name when searching.
  const orphanRowsRaw = await db
    .select({ id: children.id, name: children.name })
    .from(children)
    .where(term ? sql`${children.parentId} is null and ${ilike(children.name, term)}` : isNull(children.parentId))
    .orderBy(asc(children.name));
  const orphanRunning = await runningSessionChildIds(orphanRowsRaw.map((c) => c.id));
  const orphanRows: DirChild[] = orphanRowsRaw.map((c) => ({ ...c, hasRunningSession: orphanRunning.has(c.id) }));
  const orphanGroup: DirGroup | null = orphanRows.length
    ? { kind: "orphans", children: orphanRows }
    : null;

  // 2) Parent ids that match (by parent name/phone OR by a child's name), alphabetical.
  const parentRows = await db
    .select({ id: parents.id, name: parents.name, phone: parents.phone, profileComplete: parents.profileComplete })
    .from(parents)
    .where(
      term
        ? or(
            ilike(parents.name, term),
            ilike(parents.phone, term),
            sql`exists (select 1 from ${children} c where c.parent_id = ${parents.id} and c.name ilike ${term})`
          )
        : undefined
    )
    .orderBy(asc(parents.name));

  // All groups in display order: orphans first, then parents.
  const totalGroups = (orphanGroup ? 1 : 0) + parentRows.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  // Build the ordered group list, then slice the page.
  const ordered: (DirGroup | { kind: "parentRef"; id: number; name: string; phone: string; profileComplete: boolean })[] = [];
  if (orphanGroup) ordered.push(orphanGroup);
  for (const p of parentRows) ordered.push({ kind: "parentRef", id: p.id, name: p.name, phone: p.phone, profileComplete: p.profileComplete });
  const pageSlice = ordered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Fetch children only for the parent groups on THIS page.
  const parentIdsOnPage = pageSlice.filter((g: any) => g.kind === "parentRef").map((g: any) => g.id as number);
  const kidsByParent = new Map<number, DirChild[]>();
  if (parentIdsOnPage.length) {
    const kidsRaw = await db
      .select({ id: children.id, name: children.name, parentId: children.parentId })
      .from(children)
      .where(sql`${children.parentId} in (${sql.join(parentIdsOnPage.map((i) => sql`${i}`), sql`, `)})`)
      .orderBy(asc(children.name));
    const kidsRunning = await runningSessionChildIds(kidsRaw.map((k) => k.id));
    for (const k of kidsRaw) {
      const arr = kidsByParent.get(k.parentId!) ?? [];
      arr.push({ id: k.id, name: k.name, hasRunningSession: kidsRunning.has(k.id) });
      kidsByParent.set(k.parentId!, arr);
    }
  }

  const groups: DirGroup[] = pageSlice.map((g: any) =>
    g.kind === "orphans"
      ? g
      : {
          kind: "parent",
          parentId: g.id,
          parentName: g.name,
          phone: g.phone,
          profileComplete: g.profileComplete,
          children: kidsByParent.get(g.id) ?? [],
        }
  );

  return { groups, page: safePage, totalPages, totalGroups };
}
