import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canonicalPublicRequestUrl, PRIVATE_AUTH_CACHE_CONTROL, withPrivateAuthHeaders } from "../src/lib/auth-response";

async function main() {
  const response = withPrivateAuthHeaders(new Response(null, { headers: { Vary: "Accept-Encoding" } }));
  assert.equal(response.headers.get("cache-control"), PRIVATE_AUTH_CACHE_CONTROL);
  assert.equal(response.headers.get("cdn-cache-control"), "no-store");
  assert.equal(response.headers.get("surrogate-control"), "no-store");
  assert.match(response.headers.get("vary") ?? "", /Accept-Encoding/);
  assert.match(response.headers.get("vary") ?? "", /Cookie/);

  const canonical = canonicalPublicRequestUrl(
    "http://127.0.0.1:3000/api/public/member/connect/callback?code=opaque&state=opaque",
    "https://creative.siamesecat.cafe",
  );
  assert.equal(canonical.toString(), "https://creative.siamesecat.cafe/api/public/member/connect/callback?code=opaque&state=opaque");

  const authResponse = await import("../src/lib/auth-response");
  const finishValidated = (authResponse as unknown as {
    finishValidatedAuthTransaction?: <T>(validate: () => Promise<T>, destroy: () => void) => Promise<T>;
  }).finishValidatedAuthTransaction;
  assert.equal(typeof finishValidated, "function", "auth transaction must survive callbacks that fail before OIDC validation");
  if (!finishValidated) throw new Error("finishValidatedAuthTransaction unavailable");
  let destroyedTransactions = 0;
  await assert.rejects(
    finishValidated(
      () => Promise.reject(new Error("OIDC_VALIDATION_RETRYABLE")),
      () => { destroyedTransactions += 1; },
    ),
    /OIDC_VALIDATION_RETRYABLE/,
  );
  assert.equal(destroyedTransactions, 0, "a callback that fails before validation must retain its bounded transaction");
  assert.equal(await finishValidated(() => Promise.resolve("verified"), () => { destroyedTransactions += 1; }), "verified");
  assert.equal(destroyedTransactions, 1, "a validated callback must consume its transaction once");

  const expectedCancellation = (authResponse as unknown as {
    isExpectedSiameseAuthorizationCancellation?: (callbackUrl: URL, expectedState: string) => boolean;
  }).isExpectedSiameseAuthorizationCancellation;
  assert.equal(typeof expectedCancellation, "function", "expected OIDC cancellation must have an explicit state-validated branch");
  if (!expectedCancellation) throw new Error("isExpectedSiameseAuthorizationCancellation unavailable");
  assert.equal(expectedCancellation(
    new URL("https://creative.siamesecat.cafe/api/public/game/auth/siamese/callback?error=access_denied&state=expected-state"),
    "expected-state",
  ), true);
  assert.equal(expectedCancellation(
    new URL("https://creative.siamesecat.cafe/api/public/game/auth/siamese/callback?error=access_denied&state=wrong-state"),
    "expected-state",
  ), false, "a forged cancellation must not consume the transaction");
  assert.equal(expectedCancellation(
    new URL("https://creative.siamesecat.cafe/api/public/game/auth/siamese/callback?error=server_error&state=expected-state"),
    "expected-state",
  ), false, "provider failures must not be mislabeled as user cancellation");

  const { siamesePopupResponse } = await import("../src/lib/siamese-popup-response");
  const cancelledResponse = (siamesePopupResponse as unknown as (
    ok: boolean,
    message: string,
    status: number,
    title: string,
  ) => Response)(false, "No account access was granted.", 200, "Sign-in cancelled");
  assert.equal(cancelledResponse.status, 200);
  const cancelledHtml = await cancelledResponse.text();
  assert.match(cancelledHtml, /<h1>Sign-in cancelled<\/h1>/);
  assert.doesNotMatch(cancelledHtml, /Sign-in could not be completed/);

  const memberTransactions = await import("../src/lib/siamese-member-link-transaction");
  const bindCurrentMember = (memberTransactions as unknown as {
    bindMemberLinkToCurrentMember?: (
      transaction: { memberAccountId?: number; correlationId?: string; language?: "en" | "th"; returnTo?: string },
      member: { id: number; preferredLanguage: string },
    ) => void;
  }).bindMemberLinkToCurrentMember;
  assert.equal(typeof bindCurrentMember, "function", "member-link transaction must reconcile its target to the authenticated member");
  if (!bindCurrentMember) throw new Error("bindMemberLinkToCurrentMember unavailable");
  const staleTarget = { memberAccountId: 11, correlationId: "stale-flow", language: "th" as const, returnTo: "/signup/success" };
  bindCurrentMember(staleTarget, { id: 22, preferredLanguage: "en" });
  assert.equal(staleTarget.memberAccountId, 22);
  assert.notEqual(staleTarget.correlationId, "stale-flow");
  assert.equal(staleTarget.language, "en");
  assert.equal(staleTarget.returnTo, "/EN/member?membership=linked");
  const preparedTarget = { memberAccountId: 22, correlationId: "prepared-flow", language: "en" as const, returnTo: "/EN/signup/success" };
  bindCurrentMember(preparedTarget, { id: 22, preferredLanguage: "en" });
  assert.deepEqual(preparedTarget, { memberAccountId: 22, correlationId: "prepared-flow", language: "en", returnTo: "/EN/signup/success" });

  const read = (path: string) => readFile(path, "utf8");
  const [config, signupApi, memberStart, memberCallback, gameStart, gameCallback, signinApi, signinClient, mail, health, transaction, creativeConfig, gameConfig, gameTransaction] = await Promise.all([
    read("next.config.mjs"),
    read("src/app/api/public/signup/route.ts"),
    read("src/app/api/public/member/connect/start/route.ts"),
    read("src/app/api/public/member/connect/callback/route.ts"),
    read("src/app/api/public/game/auth/siamese/start/route.ts"),
    read("src/app/api/public/game/auth/siamese/callback/route.ts"),
    read("src/app/api/public/member/signin/route.ts"),
    read("src/app/member/sign-in/MemberSignInClient.tsx"),
    read("src/lib/member-mail.ts"),
    read("src/app/api/public/health/route.ts"),
    read("src/lib/siamese-member-link-transaction.ts"),
    read("src/lib/siamese-creative-auth.ts"),
    read("src/lib/game-features.ts"),
    read("src/lib/siamese-game-transaction.ts"),
  ]);

  for (const value of ["/api/public/member/:path*", "/api/member/:path*", "/api/public/game/auth/:path*", "/api/public/signup", "CDN-Cache-Control", "Surrogate-Control", 'value: "Cookie"']) {
    assert.ok(config.includes(value), `missing CDN auth header contract: ${value}`);
  }
  for (const [name, source] of [["member start", memberStart], ["member callback", memberCallback], ["game start", gameStart], ["game callback", gameCallback]] as const) {
    assert.match(source, /dynamic = "force-dynamic"/, `${name} must be dynamic`);
    assert.match(source, /revalidate = 0/, `${name} must disable revalidation`);
  }
  assert.match(memberStart, /withPrivateAuthHeaders/);
  assert.match(memberStart, /export async function POST/);
  assert.match(memberStart, /isTrustedMutationOrigin/);
  assert.match(memberStart, /bindMemberLinkToCurrentMember/);
  assert.match(memberCallback, /canonicalPublicRequestUrl\(request, appOrigin\)/);
  assert.match(memberCallback, /finishValidatedAuthTransaction/);
  assert.match(gameStart, /withPrivateAuthHeaders/);
  assert.match(gameCallback, /canonicalPublicRequestUrl\(request, memberOrigin\(\)\)/);
  assert.match(gameCallback, /finishValidatedAuthTransaction/);
  assert.match(gameCallback, /isExpectedSiameseAuthorizationCancellation/);
  assert.doesNotMatch(memberCallback, /finish\(requestUrl,/);
  assert.doesNotMatch(gameCallback, /finish\(new URL\(request\.url\),/);

  assert.match(signinApi, /isNotNull\(memberAccounts\.emailVerifiedAt\)/);
  assert.match(signinApi, /Email delivery is temporarily unavailable/);
  assert.match(signinApi, /status:\s*503|privateJson\([^\n]+, 503\)/);
  assert.match(signinClient, /if \(!response\.ok\)/);
  assert.match(signinClient, /role="alert"/);
  assert.match(mail, /result\.accepted/);
  assert.match(mail, /MemberMailDeliveryError/);
  assert.match(transaction, /connect\/start\?flow=/);
  assert.match(transaction, /maxAge:\s*20 \* 60/);
  assert.match(creativeConfig, /transactionMaxAgeMs:\s*20 \* 60 \* 1000/);
  assert.match(gameConfig, /transactionMaxAgeMs:\s*20 \* 60 \* 1000/);
  assert.match(gameTransaction, /maxAge:\s*20 \* 60/);

  for (const value of ["2026-08-26-auth-reliability", "siameseCreativeAuthRequested", "siameseCreativeAuthConfigured", "siameseCreativeLinkSchemaReady", "siameseCreativeAuthReady"]) {
    assert.ok(health.includes(value), `health contract missing ${value}`);
  }
  for (const [name, source] of [["signup", signupApi], ["member start", memberStart], ["member callback", memberCallback], ["game start", gameStart], ["game callback", gameCallback], ["legacy signin", signinApi]] as const) {
    assert.doesNotMatch(source, /console\.error\([^\n]*,\s*error\)/, `${name} logs a raw auth exception`);
  }

  console.log("auth:reliability -> cache isolation, canonical callbacks, truthful email status, and readiness contracts verified");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
