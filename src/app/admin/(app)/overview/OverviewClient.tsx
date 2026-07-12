"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { productName } from "@/lib/product";
import type { OverviewData, Unit } from "@/lib/overview";

const SHOP = process.env.NEXT_PUBLIC_SHOP_NAME || "Siamese Cat Creative Club";

export function OverviewClient({ initial }: { initial: OverviewData }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [offset, setOffset] = useState(initial.offset);
  const [data, setData] = useState<OverviewData>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip the redundant fetch for the initial Day/0 already rendered on the server.
    if (unit === initial.unit && offset === initial.offset && data === initial) return;
    let active = true;
    setLoading(true);
    fetch(`/api/admin/overview?unit=${unit}&offset=${offset}`)
      .then((r) => r.json())
      .then((d) => active && setData(d))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit, offset]);

  const locale = lang === "th" ? "th-TH" : "en-GB";
  const label = periodLabel(data, locale, { today: t("today"), yesterday: t("yesterday"), thisWeek: t("thisWeek"), thisMonth: t("thisMonth") });
  const atCurrent = offset >= 0;

  function switchUnit(u: Unit) {
    setUnit(u);
    setOffset(0); // jump to the current period of the new unit
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar title={t("navOverview")} right={<LogoutButton />} />

      <div className="flex-1 px-4 py-3">
        {/* Unit switcher */}
        <div className="mb-3 flex rounded-xl border border-line bg-card p-1">
          {(["day", "week", "month"] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => switchUnit(u)}
              className={
                "flex-1 rounded-lg py-2 text-[15px] font-bold transition " +
                (unit === u ? "bg-brown text-cream" : "text-meta")
              }
            >
              {t(u === "day" ? "unitDay" : u === "week" ? "unitWeek" : "unitMonth")}
            </button>
          ))}
        </div>

        {/* Period navigator */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setOffset((o) => o - 1)} className="rounded-full bg-card px-4 py-2 text-xl font-bold text-ink">
            ◀
          </button>
          <div className="text-center text-[15px] font-bold text-ink">{label}</div>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={atCurrent}
            className="rounded-full bg-card px-4 py-2 text-xl font-bold text-ink disabled:opacity-30"
          >
            ▶
          </button>
        </div>

        {/* Printable summary block */}
        <div className="receipt-ticket">
          <div className="print-only text-center">
            <div className="font-display text-base font-extrabold">{SHOP}</div>
            <div className="text-[12px]">{label}</div>
          </div>

          {/* Totals strip */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <TotalTile label={t("methodCash")} value={data.totals.cash} />
            <TotalTile label={t("methodPromptpay")} value={data.totals.promptpay} />
            <TotalTile label={t("methodBank")} value={data.totals.bank} />
            <TotalTile label={t("totalLabel")} value={data.totals.grand} strong />
          </div>

          {/* Counts row */}
          <div className="mb-4 text-center text-[13px] text-meta">
            {data.counts.orders} {t("ordersCount")} · {data.counts.sessions} {t("sessionsStarted")} ·{" "}
            {data.counts.credits} {t("creditsConsumed")}
          </div>

          {/* Order list */}
          {data.orders.length === 0 ? (
            <p className="py-8 text-center text-[15px] text-meta">{t("noTransactions")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.orders.map((o) => {
                const showDate = unit !== "day";
                const when = new Date(o.at).toLocaleString(locale, {
                  timeZone: "Asia/Bangkok",
                  ...(showDate ? { day: "numeric", month: "short" } : {}),
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const summary = o.items.map((i) => `${productName(i, lang)}${i.qty > 1 ? `×${i.qty}` : ""}`).join(", ");
                return (
                  <li key={o.orderId}>
                    <button
                      onClick={() => router.push(`/admin/receipt/${o.orderId}`)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-card p-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-semibold text-ink">
                          {o.childName ?? "—"} · <span className="text-meta">{summary}</span>
                        </div>
                        <div className="text-[13px] text-meta">
                          {when} · {methodIcon(o.method)}
                        </div>
                      </div>
                      <span className="shrink-0 text-base font-bold text-ink">{o.amountThb} ฿</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {loading && <p className="mt-3 text-center text-[13px] text-meta">{t("loading")}</p>}
      </div>

      {/* Footer */}
      <div className="no-print sticky bottom-0 border-t border-line bg-paper/95 p-4 backdrop-blur">
        <button className="btn-ghost" onClick={() => window.print()}>
          🖨 {t("printSummary")}
        </button>
      </div>
    </div>
  );
}

function TotalTile({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={"rounded-xl border p-3 " + (strong ? "border-teal bg-tealbg" : "border-line bg-card")}>
      <div className="text-[13px] font-semibold text-meta">{label}</div>
      <div className={"font-extrabold text-ink " + (strong ? "text-2xl" : "text-xl")}>{value} ฿</div>
    </div>
  );
}

function methodIcon(m: string | null): string {
  return m === "cash" ? "💵" : m === "promptpay" ? "📱" : m === "bank" ? "🏦" : "—";
}

// Localized period label: "Today · 12 Jul", "This week · 6–12 Jul", "This month · July".
function periodLabel(
  data: OverviewData,
  locale: string,
  words: { today: string; yesterday: string; thisWeek: string; thisMonth: string }
): string {
  const start = new Date(data.startUtc);
  const dOpts: Intl.DateTimeFormatOptions = { timeZone: "Asia/Bangkok", day: "numeric", month: "short" };
  if (data.unit === "day") {
    const rel = data.offset === 0 ? words.today : data.offset === -1 ? words.yesterday : null;
    const dstr = start.toLocaleDateString(locale, dOpts);
    return rel ? `${rel} · ${dstr}` : dstr;
  }
  if (data.unit === "week") {
    const endInclusive = new Date(new Date(data.endUtc).getTime() - 24 * 3600 * 1000);
    const s = start.toLocaleDateString(locale, dOpts);
    const e = endInclusive.toLocaleDateString(locale, dOpts);
    const prefix = data.offset === 0 ? `${words.thisWeek} · ` : "";
    return `${prefix}${s} – ${e}`;
  }
  const m = start.toLocaleDateString(locale, { timeZone: "Asia/Bangkok", month: "long", year: "numeric" });
  const prefix = data.offset === 0 ? `${words.thisMonth} · ` : "";
  return `${prefix}${m}`;
}
