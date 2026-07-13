# Responsive UI + Directory Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. UI tasks additionally require the **frontend-design** skill for visual execution.

**Goal:** Make the admin app responsive across all mobile screens (phone→tablet, both orientations), rebuild the search screen as a browsable parent-grouped directory (orphans pinned on top, paginated), add a Parent detail page, fit the signup form on one phone screen, and tighten + paginate the remaining admin pages.

**Architecture:** The fixed 480px `.app-frame` is kept for the public signup flow but replaced for the admin subtree by a fluid, breakpoint-based container. A new `src/lib/directory.ts` produces a paginated, parent-grouped, orphans-first directory consumed by a new `/api/admin/directory` route and the rebuilt search page. A shared `<Pagination>` component drives the directory, sessions, and overview lists. All UI reuses the existing brand tokens/components; frontend-design guides density and the responsive grid system.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind (existing tokens), Drizzle/pg, existing i18n (`useLang`/`dict`).

## Global Constraints

- **No hardcoded display text.** Every new user-visible string goes in `src/lib/i18n/dictionary.ts` (TH + EN) via `t("key")`. Thai is default. (CLAUDE.md)
- **No business-logic/schema/money changes.** This is presentation + read-only queries only. No new DB columns; no change to orders/hours/credits/receipt logic.
- **Every admin API route calls `requireAdminId()`.** New `/api/admin/directory` included.
- **Client/server split.** Server components fetch via `src/lib/*`; interactivity in `*Client.tsx`. Never import a db-touching module into a `"use client"` file; use `import type`. (CLAUDE.md)
- **Reuse brand system:** tokens in `tailwind.config.ts`, Baloo 2, `.field`/`.btn-primary`/`.btn-ghost`/`.chip`. This is a responsive reshape, not a rebrand.
- **Signup keeps the 480px phone column** (`src/app/signup/layout.tsx` unchanged). Only the **admin** subtree becomes fluid.
- **Touch targets ≥44px.** Both TH (longer) and EN must fit without overflow at phone (~390px), tablet portrait (~810px), landscape (~1080px).
- **No unit-test harness.** Verify by `pnpm build` + driving `pnpm start`/`pnpm dev` against the local Docker DB (`sccc-pg`, `.env.local`) or Neon; inspect rendered HTML/behavior. Never claim pass without running it. Do not run `pnpm dev` + `pnpm build` on the same `.next` concurrently.
- **Package manager is pnpm** (Hostinger-verified config in `pnpm-workspace.yaml`). Use `pnpm`.

---

### Task 1: Responsive admin shell + shared Pagination component

**Files:**
- Modify: `src/app/admin/layout.tsx` (swap the 480px `.app-frame` for a fluid admin container)
- Modify: `src/app/globals.css` (add `.admin-frame` + responsive helpers)
- Modify: `src/components/AppBar.tsx`, `src/components/BottomNav.tsx` (span the fluid width; comfortable on tablet)
- Create: `src/components/Pagination.tsx`
- Modify: `src/lib/i18n/dictionary.ts` (pagination + directory strings — see below)

**Interfaces:**
- Produces: `Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void })` — renders `‹ Prev  1 2 3 … Next ›`, hides itself when `totalPages <= 1`, keyboard/tap accessible, sticky-friendly. Consumed by Tasks 3, 6, 7.
- Produces: `.admin-frame` container class consumed by the admin layout.

- [ ] **Step 1: Add the fluid admin container + i18n keys**

In `src/app/globals.css`, after the `.app-frame` rule add:
```css
/* Admin app: fluid on all screens (phone → tablet, both orientations). Unlike
   the 480px .app-frame used by public signup, this grows with the viewport. */
.admin-frame {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  min-height: 100%;
  background: var(--paper);
  position: relative;
}
```
In `src/lib/i18n/dictionary.ts` add (inside `dict`):
```ts
  // ── Pagination / directory ──
  pagePrev: { th: "ก่อนหน้า", en: "Prev" },
  pageNext: { th: "ถัดไป", en: "Next" },
  pageOf: { th: "หน้า {a}/{b}", en: "Page {a}/{b}" },
  directoryTitle: { th: "รายชื่อ", en: "Directory" },
  noParentGroup: { th: "ยังไม่มีผู้ปกครอง", en: "No parent registered yet" },
  searchPlaceholder2: { th: "ค้นหาชื่อผู้ปกครอง / บุตร / เบอร์โทร", en: "Search parent / child / phone" },
  emptyDirectory: { th: "ยังไม่มีข้อมูล", en: "No records yet" },
  parentPageTitle: { th: "ข้อมูลผู้ปกครอง", en: "Parent" },
  childrenLabel: { th: "บุตร", en: "Children" },
  historyLabel: { th: "ประวัติการซื้อ", en: "Purchase history" },
```
(`pageOf` uses `{a}/{b}` — the component does a simple string replace, no i18n framework.)

- [ ] **Step 2: Make the admin layout fluid**

Replace the body of `src/app/admin/layout.tsx`:
```tsx
// Admin app is fluid across phone → tablet (both orientations). Public signup
// keeps the 480px column (src/app/signup/layout.tsx).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-frame">{children}</div>;
}
```

- [ ] **Step 3: Pagination component**

Create `src/components/Pagination.tsx`:
```tsx
"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";

// Shared Prev/Next + page-number control. Renders nothing for a single page.
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const { t } = useLang();
  if (totalPages <= 1) return null;
  // window of up to 5 page numbers around the current page
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const nums = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).filter(
    (n) => n >= 1 && n <= totalPages
  );
  const btn =
    "min-h-[40px] min-w-[40px] rounded-lg border border-line px-3 text-sm font-bold disabled:opacity-40";
  return (
    <nav className="flex items-center justify-center gap-1 py-3" aria-label={t("pageOf").replace("{a}", String(page)).replace("{b}", String(totalPages))}>
      <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ {t("pagePrev")}</button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          aria-current={n === page ? "page" : undefined}
          className={btn + (n === page ? " bg-amber text-amber-ink border-amber" : " bg-card text-ink")}
        >
          {n}
        </button>
      ))}
      <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>{t("pageNext")} ›</button>
    </nav>
  );
}
```

- [ ] **Step 4: Make AppBar + BottomNav span the fluid width**

In `src/components/AppBar.tsx` and `src/components/BottomNav.tsx`: they are already `sticky` full-width of their parent. With the fluid `.admin-frame` they now span up to 1120px — acceptable. For the bottom nav on wide screens, cap the tab row and center it: wrap the existing `<nav>` inner content so tabs don't stretch absurdly on landscape. Change `BottomNav`'s `<nav>` to keep `grid-cols-4` but add `mx-auto max-w-[640px] w-full` on an inner wrapper, keeping the bar background full-width. Apply the frontend-design skill for exact sizing. Preserve all tab hrefs/keys/active logic unchanged.

- [ ] **Step 5: Verify**

Run `pnpm build`, then `pnpm dev`. Load `/admin/login` → log in → `/admin/sessions`. Confirm: on a wide (tablet ~810/1080px) viewport the content now uses the width (no skinny 480px strip); on a phone (~390px) it's full-width single column; bottom nav reachable in both. `/signup` still renders the 480px column. Build passes.

- [ ] **Step 6: Commit**
```bash
git add src/app/admin/layout.tsx src/app/globals.css src/components/Pagination.tsx src/components/AppBar.tsx src/components/BottomNav.tsx src/lib/i18n/dictionary.ts
git commit -m "Responsive admin shell + shared Pagination component"
```

---

### Task 2: Directory data layer + API

**Files:**
- Create: `src/lib/directory.ts`
- Create: `src/app/api/admin/directory/route.ts`

**Interfaces:**
- Produces:
```ts
export type DirChild = { id: number; name: string; hasRunningSession: boolean };
export type DirGroup =
  | { kind: "orphans"; children: DirChild[] }
  | { kind: "parent"; parentId: number; parentName: string; phone: string; profileComplete: boolean; children: DirChild[] };
export type DirectoryPage = { groups: DirGroup[]; page: number; totalPages: number; totalGroups: number };
export async function getDirectory(opts: { q?: string; page?: number; pageSize?: number }): Promise<DirectoryPage>;
```
- Consumed by the route (Task 2) and the search page (Task 3).

- [ ] **Step 1: Implement `getDirectory`**

Create `src/lib/directory.ts`:
```ts
import { db } from "@/db";
import { children, parents, sessions } from "@/db/schema";
import { sql, ilike, or, isNull, asc, eq } from "drizzle-orm";

export type DirChild = { id: number; name: string; hasRunningSession: boolean };
export type DirGroup =
  | { kind: "orphans"; children: DirChild[] }
  | { kind: "parent"; parentId: number; parentName: string; phone: string; profileComplete: boolean; children: DirChild[] };
export type DirectoryPage = { groups: DirGroup[]; page: number; totalPages: number; totalGroups: number };

const runningExists = sql<boolean>`exists (
  select 1 from ${sessions} s where s.child_id = ${children.id} and s.status = 'running'
)`;

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
  const orphanRows = await db
    .select({ id: children.id, name: children.name, hasRunningSession: runningExists })
    .from(children)
    .where(term ? sql`${children.parentId} is null and ${ilike(children.name, term)}` : isNull(children.parentId))
    .orderBy(asc(children.name));
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
            sql`exists (select 1 from ${children} c where c.parent_id = ${parents.id} and ${ilike(sql`c.name`, term)})`
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
    const kids = await db
      .select({ id: children.id, name: children.name, parentId: children.parentId, hasRunningSession: runningExists })
      .from(children)
      .where(sql`${children.parentId} in (${sql.join(parentIdsOnPage.map((i) => sql`${i}`), sql`, `)})`)
      .orderBy(asc(children.name));
    for (const k of kids) {
      const arr = kidsByParent.get(k.parentId!) ?? [];
      arr.push({ id: k.id, name: k.name, hasRunningSession: k.hasRunningSession });
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
```

- [ ] **Step 2: Route handler**

Create `src/app/api/admin/directory/route.ts`:
```ts
import { NextResponse } from "next/server";
import { requireAdminId, UnauthorizedError } from "@/lib/auth";
import { getDirectory } from "@/lib/directory";

export async function GET(req: Request) {
  try {
    await requireAdminId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const data = await getDirectory({ q, page });
  return NextResponse.json(data);
}
```

- [ ] **Step 3: Verify against the DB**

`pnpm build`, then `pnpm dev`. Log in (get the session cookie), then:
```bash
# page 1, no query — orphan group should be first if any orphan children exist
curl -s -b cookie.txt 'http://localhost:3000/api/admin/directory?page=1' | head -c 600
# filter
curl -s -b cookie.txt 'http://localhost:3000/api/admin/directory?q=a&page=1' | head -c 600
```
Expected: JSON with `groups` (first group `kind:"orphans"` when orphan children exist), `page`, `totalPages`, `totalGroups`. Parent groups alphabetical by `parentName`; children present only for parents on the page. If the test DB has no orphan children, quick-add a child via the Sell flow (or insert one with null `parent_id`) to confirm it appears in the top group.

- [ ] **Step 4: Commit**
```bash
git add src/lib/directory.ts src/app/api/admin/directory/route.ts
git commit -m "Directory data layer + API (parent-grouped, orphans-first, paginated)"
```

---

### Task 3: Search page → directory browser

**Files:**
- Rewrite: `src/app/admin/(app)/search/SearchClient.tsx`
- (Keep `src/app/admin/(app)/search/page.tsx` — it renders `<SearchClient/>`.)

**Interfaces:**
- Consumes: `GET /api/admin/directory` (Task 2), `Pagination` (Task 1), `useLang`, existing `QuickAddSheet`.

- [ ] **Step 1: Rewrite SearchClient as the directory browser**

Replace `src/app/admin/(app)/search/SearchClient.tsx` with a component that:
- Holds state `{ q, page, data: DirectoryPage | null, loading }`.
- On mount and whenever `q` (debounced ~250ms) or `page` changes, fetches `/api/admin/directory?q=&page=` (AbortController to cancel stale requests). Changing `q` resets `page` to 1.
- Renders, in order:
  1. `<AppBar title={t("directoryTitle")} right={<LogoutButton/>} />`
  2. A sticky search `<input className="field" placeholder={t("searchPlaceholder2")}>` bound to `q`.
  3. The groups: for each group render a **group block**:
     - `orphans` group → a labeled section header `t("noParentGroup")` (visually distinct — warn/amber accent) then each orphan child as a **child row** → `router.push('/admin/child/' + id)`, with the running-session green dot.
     - `parent` group → a **parent row (primary)**: parent name (bold), phone (meta), `profileComplete` chip; tapping the parent row → `router.push('/admin/parent/' + parentId)`. Beneath it, each child as an indented **child row** → `router.push('/admin/child/' + id)` with green dot.
  4. `<Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />`
  5. Keep the existing **Quick-add** affordance (button opening `QuickAddSheet`).
- Empty state: if `totalGroups === 0`, show `t("emptyDirectory")`.
- **Responsive (frontend-design):** single column on phones; on tablets use the width — e.g. two columns of parent groups, larger touch rows. Child row = clearly a subset (indent / left border under the parent). Green running dot preserved. Both TH/EN fit.
- Reuse the `SearchResult` green-dot styling; drop the old `q.length < 2` empty behaviour entirely.

Keep imports client-safe (`import type { DirectoryPage, DirGroup }` from `@/lib/directory` — types only; the file must not pull the db module. NOTE: `@/lib/directory` imports the db, so import ONLY its **types** with `import type`, and fetch data via the API route, never by calling `getDirectory` from the client.)

- [ ] **Step 2: Verify**

`pnpm build`, `pnpm dev`, `/admin/search`:
- Loads **non-empty** with the directory (orphan group first if any).
- Parent row shows children nested; tap parent → `/admin/parent/[id]` (page exists after Task 4; until then it may 404 — acceptable mid-build, re-verify after Task 4), tap child → `/admin/child/[id]`.
- Typing filters live; clearing restores full directory; Prev/Next + page numbers work and reset on new query.
- Green dots correct for running sessions. Works at phone + tablet widths.

- [ ] **Step 3: Commit**
```bash
git add "src/app/admin/(app)/search/SearchClient.tsx"
git commit -m "Rebuild search as paginated parent-grouped directory (orphans on top)"
```

---

### Task 4: Parent detail page

**Files:**
- Create: `src/lib/parents.ts` (read-only parent + children + history aggregation)
- Create: `src/app/admin/(app)/parent/[id]/page.tsx` (server)
- Create: `src/app/admin/(app)/parent/[id]/ParentClient.tsx` (client)

**Interfaces:**
- Produces: `getParentDetail(id: number): Promise<{ parent: {...}; children: {...}[]; receipts: {...}[] } | null>` in `src/lib/parents.ts`.
- Consumes: existing child/receipt query helpers where available (read `src/lib/children.ts` and `src/lib/receipt.ts` first and REUSE their queries/shapes rather than duplicating).

- [ ] **Step 1: Read existing helpers, then implement `getParentDetail`**

Read `src/lib/children.ts`, `src/lib/receipt.ts`, and the child page (`src/app/admin/(app)/child/[id]/*`) to reuse query shapes. Then create `src/lib/parents.ts` exporting `getParentDetail(id)` that returns: the parent row (name/phone/email/profileComplete), the parent's children (id, name, dob/age, running-session flag), and the parent's purchase history (receipts/orders tied to the parent's children — reuse the receipt list query; join via the parent's children/orders). Return `null` if no such parent.

- [ ] **Step 2: Server page + client**

`src/app/admin/(app)/parent/[id]/page.tsx` (server): parse `id`, call `getParentDetail`, `notFound()` if null, render `<ParentClient detail={...} />`.
`ParentClient.tsx` (`"use client"`): `<AppBar title={t("parentPageTitle")} right={<LogoutButton/>} />`, then:
- Header card: parent name, phone, email, `profileComplete` chip.
- `t("childrenLabel")` section: each child a row → `/admin/child/[id]` (name, age, running dot).
- `t("historyLabel")` section: receipts list → `/admin/receipt/[id]` (reuse receipt-row styling).
- Responsive + tightened to fit one screen for a typical parent (few children). frontend-design for layout.
- Types imported with `import type` from `@/lib/parents`; no db import in the client.

- [ ] **Step 3: Verify**

`pnpm build`, `pnpm dev`. From `/admin/search`, tap a parent → `/admin/parent/[id]` renders header + children + history; child rows → child page; receipts → receipt page. A bad id → notFound. Re-verify Task 3's parent tap now lands correctly.

- [ ] **Step 4: Commit**
```bash
git add src/lib/parents.ts "src/app/admin/(app)/parent"
git commit -m "Add Parent detail page (children + purchase history)"
```

---

### Task 5: Signup form — fit one phone screen

**Files:**
- Modify: `src/app/signup/page.tsx`
- Possibly modify: `src/lib/i18n/dictionary.ts` (only if a label is shortened; keep existing keys)

- [ ] **Step 1: Compact the default (1-child) layout**

Read the full `src/app/signup/page.tsx`. Restructure the JSX (NOT the state/validation/submit logic) so the default state (parent name, phone, optional email, ONE child block [name, DOB, gender], consent, submit) fits a ~360×640 phone with **no vertical scroll**:
- Tighter vertical spacing/section headers; group parent fields; put **DOB + gender side-by-side** (`grid grid-cols-2 gap-2`); compact the consent line; keep submit reachable (sticky bottom is acceptable).
- Keep every field, the i18n labels, validation, error display, the "add another child" control, and the POST body **identical**.
- Adding a 2nd+ child grows the form → scrolling then is fine.
- Apply frontend-design for the phone layout; keep ≥44px targets.

- [ ] **Step 2: Verify**

`pnpm build`, `pnpm dev`, load `/signup` in a phone viewport (DevTools ~360×640 and ~390×844). Confirm the 1-child form fits with no scroll; add a child → it scrolls; submit a full registration end-to-end (reaches success). TH and EN both fit.

- [ ] **Step 3: Commit**
```bash
git add src/app/signup/page.tsx
git commit -m "Compact signup form to fit one phone screen (1-child default)"
```

---

### Task 6: Sessions page — responsive grid + pagination

**Files:**
- Modify: `src/app/admin/(app)/sessions/SessionsClient.tsx`

- [ ] **Step 1: Grid + paginate**

Read `SessionsClient.tsx`. Keep the data/countdown/overdue logic. Presentation changes only:
- Render running-session cards in a **responsive grid** (1 col phone, 2–3 cols tablet via `sm:grid-cols-2 lg:grid-cols-3`), tightened so a short list fills the screen without wasted space.
- If sessions exceed one screen, **paginate** client-side with `<Pagination>` (page size ~ a screenful, e.g. 8 on phone context / more on tablet — a fixed constant like 12 is fine). Sort unchanged (soonest-pickup first; OVERDUE red preserved).

- [ ] **Step 2: Verify**

`pnpm build`, `pnpm dev`, `/admin/sessions`. Cards in a grid on tablet, single column on phone; overdue red + countdown still work; with many sessions, pagination appears and works. Build passes.

- [ ] **Step 3: Commit**
```bash
git add "src/app/admin/(app)/sessions/SessionsClient.tsx"
git commit -m "Sessions: responsive card grid + pagination"
```

---

### Task 7: Overview — paginate order list + tighten

**Files:**
- Modify: `src/app/admin/(app)/overview/OverviewClient.tsx`

- [ ] **Step 1: Tighten totals, paginate the order list**

Read `OverviewClient.tsx`. Keep the Day/Week/Month switcher, period nav, totals/counts logic, and print/save. Presentation only:
- Tighten the totals/counts block so it + the first orders fit without wasted space; on tablet lay totals out horizontally.
- **Paginate the order list** with `<Pagination>` (client-side over the already-fetched period orders; page size ~12). Period totals/counts stay pinned above the paged list.

- [ ] **Step 2: Verify**

`pnpm build`, `pnpm dev`, `/admin/overview`. Totals tighten; a long order list paginates; switching period/unit resets to page 1; print/save still work (verify the print CSS still targets the summary). Build passes.

- [ ] **Step 3: Commit**
```bash
git add "src/app/admin/(app)/overview/OverviewClient.tsx"
git commit -m "Overview: tighten totals + paginate order list"
```

---

### Task 8: Tighten Sell, Child, Session, Receipt for the responsive shell

**Files:**
- Modify: `src/app/admin/(app)/sell/SellClient.tsx`
- Modify: `src/app/admin/(app)/child/[id]/*Client.tsx`
- Modify: `src/app/admin/(app)/session/[id]/*Client.tsx`
- Modify: `src/app/admin/(app)/receipt/[id]/*Client.tsx`

- [ ] **Step 1: Tighten each to the responsive shell**

For each page (read it first): remove wasted vertical space so short content fits one screen; use the tablet width (e.g. Sell: product grid wider with more columns on tablet + cart beside it on landscape; Child: profile + packages laid out using the width; Session: countdown + consumables comfortable; Receipt: unchanged print CSS, just fit the on-screen view). No logic/data changes; presentation + responsive classes only. Apply frontend-design. Keep the receipt **print** output (`.receipt-ticket` @media print) byte-for-byte unchanged.

- [ ] **Step 2: Verify**

`pnpm build`, `pnpm dev`. Drive each page at phone + tablet widths: short content fits without scroll; Sell can complete a cart→payment→receipt; Child shows packages/credits; Session countdown works; Receipt prints/saves correctly (print CSS intact). Build passes.

- [ ] **Step 3: Commit**
```bash
git add "src/app/admin/(app)/sell" "src/app/admin/(app)/child" "src/app/admin/(app)/session" "src/app/admin/(app)/receipt"
git commit -m "Tighten Sell/Child/Session/Receipt for the responsive shell"
```

---

### Task 9: Final regression + docs

- [ ] **Step 1: Full regression sweep**

`rm -rf .next && pnpm build`, then `pnpm start`. Against the DB, walk: register (`/signup`, 1-child fits phone) → login → directory (`/admin/search`, orphans-first, paginate, filter) → parent page → child page → sell → pay → session → overview. Confirm at phone (~390), tablet portrait (~810), landscape (~1080): no wasted-space scroll on short pages; long lists paginate; TH+EN fit. Cross-check WALKTHROUGH.md acceptance items still hold.

- [ ] **Step 2: Update docs + memory**

Update `CLAUDE.md` architecture note (admin is fluid `.admin-frame`, not 480px; new `/admin/parent/[id]`; `/api/admin/directory` + `src/lib/directory.ts`; shared `Pagination`). Note the change in `sccc-uiux` interpretation in `DECISIONS.md` if the 480px column was spec-mandated. Update memory `sccc-build-state.md`.

- [ ] **Step 3: Commit**
```bash
git add CLAUDE.md DECISIONS.md
git commit -m "Docs: responsive admin shell + directory/parent additions"
```

---

## Self-Review

**Spec coverage:** §4.0 shell → Task 1; §4.1 directory API → Task 2; §4.2 search → Task 3; §4.3 parent page → Task 4; §4.4 signup → Task 5; §4.5 tighten+paginate → Tasks 6–8; §6 verification → each task + Task 9. ✓

**Placeholder scan:** No "TBD/implement later". The two intentionally under-specified areas are the *visual* details of UI tasks (deliberately deferred to the frontend-design skill at build time, with explicit acceptance criteria + responsive breakpoints given) and the exact page-size constants (stated as tunable, default 12) — both flagged, neither a code placeholder. Deterministic code (directory lib/API, Pagination) is given in full.

**Type consistency:** `DirGroup`/`DirChild`/`DirectoryPage` defined in Task 2, imported as types in Task 3. `Pagination({page,totalPages,onPage})` defined Task 1, used in Tasks 3/6/7. `getDirectory`/`getParentDetail` signatures fixed. Client files import lib **types only** (`import type`) and fetch via API — called out in Tasks 3 & 4 to preserve the client/server split.

**Open risks (resolve during build):** (1) exact tablet container width (1120px start) + per-page counts (12 start) tuned on a real device; (2) `getParentDetail` history join must reuse the existing receipt query — Task 4 Step 1 requires reading `src/lib/receipt.ts`/`children.ts` first, not inventing a new aggregation.
