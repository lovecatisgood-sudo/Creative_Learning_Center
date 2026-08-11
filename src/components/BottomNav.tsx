"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { isManagerPath, type AdminRole } from "@/lib/admin-roles";

const OPERATION_TABS: { href: string; key: DictKey; icon: string }[] = [
  { href: "/admin/sessions", key: "navSessions", icon: "⏱" },
  { href: "/admin/search", key: "navSearch", icon: "🔍" },
  { href: "/admin/sell", key: "navSell", icon: "🛒" },
];

export function BottomNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const { t } = useLang();
  const tabs = role === "manager"
    ? [{ href: "/admin/manager", key: "navManager" as DictKey, icon: "▦" }, ...OPERATION_TABS]
    : OPERATION_TABS;
  return (
    <nav className="sticky bottom-0 z-20 border-t border-brown2 bg-brown safe-bottom">
      {/* Tab row itself is capped and centered so tabs stay thumb-sized instead
          of stretching edge-to-edge on tablet/landscape; the bar background
          (above) still spans the full fluid width. */}
      <div className={`mx-auto grid w-full max-w-[780px] ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {tabs.map((tab) => {
          const active = tab.href === "/admin/manager"
            ? isManagerPath(pathname)
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "flex min-h-[44px] flex-col items-center gap-0.5 py-2 text-[13px] font-semibold transition " +
                (active ? "text-teal" : "text-cream/70")
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {t(tab.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
