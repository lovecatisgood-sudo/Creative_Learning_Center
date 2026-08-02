"use client";

import { useServerInsertedHTML } from "next/navigation";

const GOOGLE_ADSENSE_CLIENT_ID = "ca-pub-3624708289866566";

export function AdSenseScript() {
  useServerInsertedHTML(() => (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
    />
  ));

  return null;
}
