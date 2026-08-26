const PRIVATE_AUTH_CACHE_CONTROL = "private, no-cache, no-store, max-age=0, must-revalidate";

export function withPrivateAuthHeaders<T extends Response>(response: T, varyOnCookie = true): T {
  response.headers.set("Cache-Control", PRIVATE_AUTH_CACHE_CONTROL);
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (varyOnCookie) appendVary(response.headers, "Cookie");
  return response;
}

export function canonicalPublicRequestUrl(request: Request | URL | string, publicOrigin: string): URL {
  const incoming = request instanceof Request
    ? new URL(request.url)
    : request instanceof URL
      ? request
      : new URL(request);
  const canonical = new URL(incoming.pathname, publicOrigin);
  canonical.search = incoming.search;
  return canonical;
}

export async function finishValidatedAuthTransaction<T>(
  validate: () => Promise<T>,
  destroy: () => void,
): Promise<T> {
  const result = await validate();
  destroy();
  return result;
}

function appendVary(headers: Headers, value: string): void {
  const values = new Set(
    (headers.get("Vary") ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  values.add(value);
  headers.set("Vary", [...values].join(", "));
}

export { PRIVATE_AUTH_CACHE_CONTROL };
