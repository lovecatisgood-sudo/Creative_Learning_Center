"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

const TABS: { href: string; key: DictKey; icon: string }[] = [
  { href: "/admin/sessions", key: "navSessions", icon: "⏱" },
  { href: "/admin/search", key: "navSearch", icon: "🔍" },
  { href: "/admin/sell", key: "navSell", icon: "🛒" },
  { href: "/admin/overview", key: "navOverview", icon: "📊" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLang();
  return (
    <nav className="sticky bottom-0 z-20 border-t border-brown2 bg-brown">
      {/* Tab row itself is capped and centered so tabs stay thumb-sized instead
          of stretching edge-to-edge on tablet/landscape; the bar background
          (above) still spans the full fluid width. */}
      <div className="mx-auto grid w-full max-w-[640px] grid-cols-4">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
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
