"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLang();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-cream/40 px-4 text-[13px] font-semibold text-cream"
    >
      {t("logOut")}
    </button>
  );
}
