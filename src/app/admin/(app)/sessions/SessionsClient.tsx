"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Countdown, useNow, isOverdue } from "@/components/Countdown";
import { bkkTimeHm } from "@/lib/time";
import type { ActiveSession } from "@/lib/sessions";

export function SessionsClient({ initialSessions }: { initialSessions: ActiveSession[] }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const now = useNow(1000);
  const [list, setList] = useState<ActiveSession[]>(initialSessions);

  // Poll every 30s for check-ins/check-outs made elsewhere (PRD §6.8).
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch("/api/admin/sessions");
      if (res.ok) setList((await res.json()).sessions);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Keep soonest-pickup-first even as +1h extensions re-order live.
  const sorted = [...list].sort(
    (a, b) => new Date(a.plannedEndAt).getTime() - new Date(b.plannedEndAt).getTime()
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("navSessions")} right={<LogoutButton />} />

      <div className="flex-1 px-4 py-3">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-24 text-center">
            <span className="text-4xl">😺</span>
            <p className="text-base text-meta">{t("sessionsEmpty")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((s) => {
              const over = isOverdue(s.plannedEndAt, now);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => router.push(`/admin/session/${s.id}`)}
                    className={
                      "w-full rounded-2xl border-2 bg-card p-4 text-left transition active:scale-[.99] " +
                      (over ? "border-danger" : "border-teal")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-lg font-extrabold text-ink">{s.childName}</span>
                      <span className="chip bg-tealbg text-tealdeep">
                        {lang === "th" ? s.nameTh : s.nameEn}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div className="text-[13px] text-meta">
                        {t("start")} {bkkTimeHm(new Date(s.startedAt))} → {t("pickup")}{" "}
                        {bkkTimeHm(new Date(s.plannedEndAt))}
                      </div>
                      <Countdown
                        plannedEndAt={s.plannedEndAt}
                        now={now}
                        overdueLabel={t("overdue")}
                        className="text-2xl font-extrabold tabular-nums"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
