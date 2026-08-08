export const ADMIN_ROLES = ["manager", "staff"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

export const MANAGER_PATH_PREFIXES = [
  "/admin/manager",
  "/admin/overview",
  "/admin/inquiries",
  "/admin/game",
  "/admin/blog",
  "/admin/team",
] as const;

export function isManagerPath(pathname: string): boolean {
  return MANAGER_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
