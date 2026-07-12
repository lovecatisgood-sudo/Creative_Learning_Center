"use client";

import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

// Temporary placeholder for screens delivered in later milestones. Keeps the
// bottom nav navigable while the app is under construction.
export function ScreenStub({ titleKey, note }: { titleKey: DictKey; note: string }) {
  const { t } = useLang();
  return (
    <div>
      <AppBar title={t(titleKey)} right={<LogoutButton />} />
      <div className="px-6 py-24 text-center text-meta">{note}</div>
    </div>
  );
}
