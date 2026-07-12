"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

type Status = "available" | "active" | "consumed" | "expired" | "overdue" | "family";

const MAP: Record<Status, { key: DictKey; cls: string }> = {
  available: { key: "chipAvailable", cls: "bg-line/60 text-meta" },
  active: { key: "chipActive", cls: "bg-okbg text-ok" },
  consumed: { key: "chipConsumed", cls: "bg-line/60 text-meta line-through" },
  expired: { key: "chipExpired", cls: "border border-danger text-danger" },
  overdue: { key: "chipOverdue", cls: "bg-danger text-white" },
  family: { key: "chipFamily", cls: "bg-tealbg text-tealdeep" },
};

export function StatusChip({ status }: { status: Status }) {
  const { t } = useLang();
  const conf = MAP[status];
  return <span className={`chip ${conf.cls}`}>{t(conf.key)}</span>;
}
