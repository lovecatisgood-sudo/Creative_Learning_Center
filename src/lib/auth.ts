import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type AdminSession } from "./session";

// Server-side session accessor for App Router route handlers & server components.
export async function getSession() {
  return getIronSession<AdminSession>(cookies(), sessionOptions);
}

export async function getAdminId(): Promise<number | null> {
  const session = await getSession();
  return session.adminId ?? null;
}

// Guard for /api/admin/* route handlers. Returns the admin id or throws a 401.
export async function requireAdminId(): Promise<number> {
  const id = await getAdminId();
  if (!id) {
    throw new UnauthorizedError();
  }
  return id;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
