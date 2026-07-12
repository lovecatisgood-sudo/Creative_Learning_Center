"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CompleteParentSheet } from "@/components/CompleteParentSheet";
import { StatusChip } from "@/components/StatusChip";
import { PackageRow } from "@/components/PackageRow";
import type { ChildDetail } from "@/lib/children";
import type { ChildPackage, HistoryItem } from "@/lib/product";
import type { ActiveSession } from "@/lib/sessions";
import { bkkTimeHm } from "@/lib/time";

export function ChildClient({
  child,
  packages,
  activeSession,
  history,
  siblings,
}: {
  child: ChildDetail;
  packages: ChildPackage[];
  activeSession: ActiveSession | null;
  history: HistoryItem[];
  siblings: { id: number; name: string }[];
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [showParentSheet, setShowParentSheet] = useState(false);

  const incomplete = !child.parent || !child.parent.profileComplete;

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={child.name} right={<LogoutButton />} />

      <div className="flex-1 px-4 pb-24">
        {/* Header block */}
        <div className="py-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-extrabold text-ink">{child.name}</h2>
            {child.ageYears != null && (
              <span className="text-base text-meta">
                {child.ageYears} {t("ageYears")}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[13px] text-meta">
            {child.parent?.name?.trim() ? child.parent.name : "—"}
            {child.parent?.phone ? (
              <>
                {" · "}
                <a href={`tel:${child.parent.phone}`} className="font-semibold text-tealdeep underline">
                  {child.parent.phone}
                </a>
              </>
            ) : null}
          </div>
        </div>

        {/* Incomplete banner */}
        {incomplete && (
          <button
            onClick={() => setShowParentSheet(true)}
            className="mb-4 flex w-full items-center justify-between rounded-xl bg-warnbg px-4 py-3 text-left"
          >
            <span className="text-[13px] font-semibold text-warn">{t("noParentYet")}</span>
            <span className="text-[13px] font-bold text-warn">{t("addParentDetails")}</span>
          </button>
        )}

        {/* Active session */}
        {activeSession && (
          <Section title={t("sectionActiveSession")}>
            <button
              onClick={() => router.push(`/admin/session/${activeSession.id}`)}
              className="flex w-full items-center justify-between rounded-xl border-2 border-teal bg-tealbg p-3 text-left"
            >
              <div>
                <div className="font-bold text-ink">
                  {lang === "th" ? activeSession.nameTh : activeSession.nameEn}
                </div>
                <div className="text-[13px] text-tealdeep">
                  {bkkTimeHm(new Date(activeSession.startedAt))} → {bkkTimeHm(new Date(activeSession.plannedEndAt))}
                </div>
              </div>
              <StatusChip status="active" />
            </button>
          </Section>
        )}

        {/* Packages */}
        <Section title={t("sectionPackages")}>
          {packages.length === 0 ? (
            <Empty text={t("noPackages")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {packages.map((p) => (
                <PackageRow
                  key={p.id}
                  pkg={p}
                  childId={child.id}
                  siblings={siblings}
                  activeSessionId={activeSession?.id ?? null}
                />
              ))}
            </ul>
          )}
        </Section>

        {/* History */}
        <Section title={t("sectionHistory")}>
          {history.length === 0 ? (
            <Empty text={t("noHistory")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  {h.kind === "receipt" ? (
                    <button
                      onClick={() => router.push(`/admin/receipt/${h.id}`)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-card p-3 text-left"
                    >
                      <span className="text-[13px] font-semibold text-ink">
                        🧾 {h.receiptNo ?? `#${h.id}`}
                      </span>
                      <span className="text-[13px] text-meta">{h.totalThb} ฿</span>
                    </button>
                  ) : (
                    <div className="rounded-xl border border-line bg-card p-3 text-[13px] text-meta">
                      ⏱ {new Date(h.at).toLocaleString(lang === "th" ? "th-TH" : "en-GB")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Sticky Sell footer */}
      <div className="sticky bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <button className="btn-primary" onClick={() => router.push(`/admin/sell?childId=${child.id}`)}>
          {t("sell")}
        </button>
      </div>

      {showParentSheet && (
        <CompleteParentSheet
          childId={child.id}
          onClose={() => setShowParentSheet(false)}
          onSaved={() => {
            setShowParentSheet(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-meta">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-line bg-card/50 p-4 text-center text-[13px] text-meta">{text}</div>;
}
