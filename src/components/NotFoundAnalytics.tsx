"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function NotFoundAnalytics() {
  useEffect(() => {
    let referrerPath = "direct";
    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        referrerPath = `${referrer.origin}${referrer.pathname}`;
      } catch {
        referrerPath = "unparseable";
      }
    }

    window.gtag?.("event", "page_not_found", {
      missing_path: window.location.pathname,
      referrer_path: referrerPath,
    });
  }, []);

  return null;
}
