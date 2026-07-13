"use client";

import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { ParentDetail } from "@/lib/parents";

const RUNNING_DOT = <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-teal" aria-hidden />;

export function ParentClient({ detail }: { detail: ParentDetail }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const { parent, children: kids, receipts } = detail;
  const multiChild = kids.length > 1;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <AppBar title={t("parentPageTitle")} right={<LogoutButton />} />

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 sm:px-6 md:px-8">
        {/* Header card */}
        <div className="my-3 rounded-xl border border-line bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 truncate text-2xl font-extrabold text-ink">
              {parent.name?.trim() ? parent.name : "—"}
            </h2>
            <span className={`chip shrink-0 ${parent.profileComplete ? "bg-okbg text-ok" : "bg-warnbg text-warn"}`}>
              {t(parent.profileComplete ? "profileCompleteChip" : "profileIncomplete")}
            </span>
          </div>
          <div className="mt-1.5 flex flex-col gap-0.5 text-[13px] text-meta">
            <a href={`tel:${parent.phone}`} className="font-semibold text-tealdeep underline">
              {parent.phone || "—"}
            </a>
            {parent.email && <span className="truncate">{parent.email}</span>}
          </div>
        </div>

        {/* Children */}
        <Section title={t("childrenLabel")}>
          {kids.length === 0 ? (
            <Empty text={t("noChildrenYet")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {kids.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => router.push(`/admin/child/${c.id}`)}
                    className="flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-left active:scale-[.99]"
                  >
                    {c.hasRunningSession && RUNNING_DOT}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{c.name}</span>
                    {c.ageYears != null && (
                      <span className="shrink-0 text-[13px] text-meta">
                        {c.ageYears} {t("ageYears")}
                      </span>
                    )}
                    <span className="shrink-0 text-line" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Purchase history */}
        <Section title={t("historyLabel")}>
          {receipts.length === 0 ? (
            <Empty text={t("noHistory")} />
          ) : (
            <ul className="flex flex-col gap-2">
              {receipts.map((r) => (
                <li key={r.orderId}>
                  <button
                    onClick={() => router.push(`/admin/receipt/${r.orderId}`)}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-card p-3 text-left active:scale-[.99]"
                  >
                    <span className="min-w-0 text-[13px] font-semibold text-ink">
                      <div className="truncate">🧾 {r.receiptNo ?? `#${r.orderId}`}</div>
                      {multiChild && r.childName && (
                        <div className="truncate text-[12px] font-normal text-meta">{r.childName}</div>
                      )}
                    </span>
                    <span className="shrink-0 text-[13px] text-meta">
                      {new Date(r.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB")} · {r.totalThb} ฿
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
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
  return (
    <div className="rounded-xl border border-dashed border-line bg-card/50 p-4 text-center text-[13px] text-meta">
      {text}
    </div>
  );
}
