"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import type { SearchResult } from "@/app/admin/(app)/search/SearchClient";

export type PickedChild = {
  id: number;
  name: string;
  parentName: string;
  hasRunningSession: boolean;
};

// Inline child search + quick-add for the Sell tab (A4 "Change" / initial pick).
export function ChildPicker({ onPick }: { onPick: (c: PickedChild) => void }) {
  const { t } = useLang();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
      if (res.ok) setResults((await res.json()).results);
    }, 220);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  async function pickById(childId: number) {
    // Fetch to confirm the child + its running-session status for EXTRA_1H gating.
    const res = await fetch(`/api/admin/children/${childId}`);
    const data = res.ok ? await res.json() : null;
    const found = results.find((r) => r.childId === childId);
    onPick({
      id: childId,
      name: data?.child?.name ?? found?.childName ?? "",
      parentName: data?.child?.parent?.name ?? found?.parentName ?? "",
      hasRunningSession: found?.hasRunningSession ?? false,
    });
  }

  return (
    <div className="px-4 py-3">
      <input
        ref={inputRef}
        className="field"
        placeholder={t("searchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="mt-2 flex flex-col gap-2">
        {results.map((r) => (
          <li key={r.childId}>
            <button
              onClick={() => pickById(r.childId)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-card p-3 text-left"
            >
              {r.hasRunningSession && <span className="h-2.5 w-2.5 rounded-full bg-teal" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-ink">{r.childName}</div>
                <div className="truncate text-[13px] text-meta">
                  {r.parentName?.trim() || "—"} · {r.phone || "—"}
                </div>
              </div>
              {!r.profileComplete && <span className="chip bg-warnbg text-warn">{t("profileIncomplete")}</span>}
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-ghost mt-3 border-dashed" onClick={() => setShowQuickAdd(true)}>
        ＋ {t("quickAddChild")}
      </button>

      {showQuickAdd && (
        <QuickAddSheet
          onClose={() => setShowQuickAdd(false)}
          onCreated={(childId) => pickById(childId)}
        />
      )}
    </div>
  );
}
