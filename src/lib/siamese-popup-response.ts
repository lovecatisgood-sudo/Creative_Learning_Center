import { NextResponse } from "next/server";
import { withPrivateAuthHeaders } from "@/lib/auth-response";

export function siamesePopupResponse(ok: boolean, message: string, status = 200) {
  const safeMessage = escapeHtml(message);
  const payload = JSON.stringify({ type: "scvd:siamese-auth", ok });
  return withPrivateAuthHeaders(new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Siamese Cat sign-in</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#12091d;color:#fff;font:16px/1.5 system-ui,sans-serif}.card{max-width:28rem;padding:2rem;text-align:center}button{padding:.75rem 1rem;border:0;border-radius:.75rem;font-weight:800}</style><body><main class="card"><h1>${ok ? "Sign-in complete" : "Sign-in could not be completed"}</h1><p>${safeMessage}</p><button onclick="window.close()">Close</button></main><script>try{window.opener&&window.opener.postMessage(${payload},location.origin)}catch(e){}${ok ? "setTimeout(function(){window.close()},250);" : ""}</script></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        "referrer-policy": "no-referrer",
      },
    },
  ));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
