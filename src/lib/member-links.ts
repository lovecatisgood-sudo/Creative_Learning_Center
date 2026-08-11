export function memberOrigin(): string {
  const configured = process.env.APP_ORIGIN?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") throw new Error("APP_ORIGIN is not configured");
    return "http://localhost:3000";
  }
  const url = new URL(configured);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_ORIGIN must use HTTPS in production");
  }
  return url.origin;
}

export function memberVerifyUrl(token: string): string {
  // Keep the secret in the URL fragment: fragments are not sent in HTTP
  // requests, reverse-proxy logs, Referer headers, or analytics page URLs.
  return `${memberOrigin()}/member/verify#token=${encodeURIComponent(token)}`;
}
