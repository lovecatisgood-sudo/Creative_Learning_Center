/**
 * Reject browser mutations initiated by another origin. Requests without an
 * Origin header remain valid for same-host server integrations and CLI health
 * checks; browsers send Origin on cross-origin POST requests.
 */
export function isTrustedMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    return false;
  }
  const configured = process.env.APP_ORIGIN?.trim();
  if (configured) {
    try {
      allowed.add(new URL(configured).origin);
    } catch {
      return false;
    }
  }
  return allowed.has(origin);
}
