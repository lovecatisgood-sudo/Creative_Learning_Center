"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { Pagination } from "@/components/Pagination";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import type { DirectoryPage, DirGroup } from "@/lib/directory";

const RUNNING_DOT = <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal" aria-hidden />;

export function SearchClient() {
  const { t } = useLang();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<DirectoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced fetch: any change to q resets to page 1; page changes fetch directly.
  useEffect(() => {
    const ctrl = new AbortController();
    const delay = page === 1 ? 250 : 0;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/directory?q=${encodeURIComponent(q.trim())}&page=${page}`,
          { signal: ctrl.signal }
        );
        if (res.ok) {
          const json: DirectoryPage = await res.json();
          setData(json);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") throw e;
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, delay);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  function onQueryChange(v: string) {
    setQ(v);
    setPage(1);
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <AppBar title={t("directoryTitle")} right={<LogoutButton />} />

      {/* Search bar sits above the scrollable list below, so it never needs to
          stick — it simply isn't part of the scrolling region. */}
      <div className="bg-paper px-4 py-3 sm:px-6 md:px-8">
        <input
          ref={inputRef}
          className="field"
          placeholder={t("searchPlaceholder2")}
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 sm:px-6 md:px-8">
        {!data && loading && (
          <p className="py-10 text-center text-[13px] text-meta">{t("loading")}</p>
        )}
        {data && data.totalGroups === 0 && (
          <p className="py-10 text-center text-base text-meta">{t("emptyDirectory")}</p>
        )}
        {data && data.totalGroups > 0 && (
          <ul className="md:columns-2 md:gap-4">
            {data.groups.map((g) => (
              <li key={groupKey(g)} className="mb-3 break-inside-avoid md:mb-4">
                {g.kind === "orphans" ? <OrphanGroup group={g} onOpenChild={(id) => router.push(`/admin/child/${id}`)} /> : (
                  <ParentGroup
                    group={g}
                    onOpenParent={(id) => router.push(`/admin/parent/${id}`)}
                    onOpenChild={(id) => router.push(`/admin/child/${id}`)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
      </div>

      {/* Last flex child, sits directly above the BottomNav */}
      <div className="border-t border-line bg-paper/95 p-4 backdrop-blur sm:px-6 md:px-8">
        <button className="btn-primary" onClick={() => setShowQuickAdd(true)}>
          ＋ {t("quickAddChild")}
        </button>
      </div>

      {showQuickAdd && (
        <QuickAddSheet
          onClose={() => setShowQuickAdd(false)}
          onCreated={(childId) => router.push(`/admin/child/${childId}`)}
        />
      )}
    </div>
  );
}

function groupKey(g: DirGroup) {
  return g.kind === "orphans" ? "orphans" : `parent-${g.parentId}`;
}

function OrphanGroup({
  group,
  onOpenChild,
}: {
  group: Extract<DirGroup, { kind: "orphans" }>;
  onOpenChild: (id: number) => void;
}) {
  const { t } = useLang();
  return (
    <div className="overflow-hidden rounded-xl border border-warn/50 bg-card">
      <div className="flex items-center gap-2 border-l-4 border-warn bg-warnbg px-3 py-2">
        <span aria-hidden>⚠</span>
        <span className="text-[12px] font-bold uppercase tracking-wide text-warn">{t("noParentGroup")}</span>
      </div>
      <div className="px-1 py-1">
        {group.children.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpenChild(c.id)}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left active:scale-[.99] md:min-h-[48px] md:py-2.5"
          >
            {c.hasRunningSession && RUNNING_DOT}
            <span className="truncate text-sm font-semibold text-ink">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ParentGroup({
  group,
  onOpenParent,
  onOpenChild,
}: {
  group: Extract<DirGroup, { kind: "parent" }>;
  onOpenParent: (id: number) => void;
  onOpenChild: (id: number) => void;
}) {
  const { t } = useLang();
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <button
        onClick={() => onOpenParent(group.parentId)}
        className="flex min-h-[44px] w-full items-center gap-3 p-3 text-left active:scale-[.99] md:min-h-[52px] md:p-4"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold text-ink">{group.parentName}</div>
          <div className="truncate text-[13px] text-meta">{group.phone || "—"}</div>
        </div>
        {!group.profileComplete && (
          <span className="chip shrink-0 bg-warnbg text-warn">{t("profileIncomplete")}</span>
        )}
        <span className="shrink-0 text-line" aria-hidden>›</span>
      </button>
      {group.children.length > 0 && (
        <div className="ml-5 border-l-2 border-line py-1 pl-3 pr-1 md:ml-6">
          {group.children.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenChild(c.id)}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2 py-2 text-left active:scale-[.99] md:min-h-[48px] md:py-2.5"
            >
              {c.hasRunningSession && RUNNING_DOT}
              <span className="truncate text-sm font-semibold text-ink">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
