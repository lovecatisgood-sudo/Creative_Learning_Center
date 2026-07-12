"use client";

import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";
import { useLang } from "@/lib/i18n/LanguageProvider";

export function SessionsClient() {
  const { t } = useLang();
  return (
    <div>
      <AppBar title={t("navSessions")} right={<LogoutButton />} />
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <span className="text-4xl">😺</span>
        <p className="text-base text-meta">
          {/* M4 replaces this with the live session dashboard. */}
          No children checked in. Start a package from a child&apos;s page.
        </p>
      </div>
    </div>
  );
}
