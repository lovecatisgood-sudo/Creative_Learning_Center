"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function PublicAnalytics() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>("a[href]");
      if (!link || typeof window.gtag !== "function") return;
      const href = link.getAttribute("href") || "";
      let name = "";
      if (href.startsWith("tel:")) name = "phone_click";
      else if (href.includes("wa.me/")) name = "whatsapp_click";
      else if (href.includes("maps.")) name = "directions_click";
      else if (/\/(playgroup|creative|little-explorer-program|membership)(?:$|[?#])/.test(href)) name = "program_click";
      if (name) window.gtag("event", name, { link_url: href, link_text: (link.textContent || "").trim().slice(0, 100) });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
