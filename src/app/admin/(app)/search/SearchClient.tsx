"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { QuickAddSheet } from "@/components/QuickAddSheet";

export type SearchResult = {
  childId: number;
  childName: string;
  parentId: number | null;
  parentName: string | null;
  phone: string | null;
  profileComplete: boolean;
  hasRunningSession: boolean;
};

export function SearchClient() {
  const { t } = useLang();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced live search after 2 characters.
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, {
        signal: ctrl.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setSearched(true);
      }
    }, 220);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("navSearch")} right={<LogoutButton />} />

      <div className="sticky top-[56px] z-10 bg-paper px-4 py-3">
        <input
          ref={inputRef}
          className="field"
          placeholder={t("searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="flex-1 px-4 pb-24">
        {q.trim().length < 2 && <p className="py-10 text-center text-[13px] text-meta">{t("searchHint")}</p>}
        {searched && results.length === 0 && (
          <p className="py-10 text-center text-base text-meta">{t("noResults")}</p>
        )}
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li key={r.childId}>
              <button
                onClick={() => router.push(`/admin/child/${r.childId}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-card p-3 text-left active:scale-[.99]"
              >
                {r.hasRunningSession && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold text-ink">{r.childName}</div>
                  <div className="truncate text-[13px] text-meta">
                    {t("parentLabel")}: {r.parentName?.trim() || "—"} · {r.phone || "—"}
                  </div>
                </div>
                {!r.profileComplete && (
                  <span className="chip bg-warnbg text-warn">{t("profileIncomplete")}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
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
