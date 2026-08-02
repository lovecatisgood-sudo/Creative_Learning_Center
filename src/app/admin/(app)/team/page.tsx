import { asc } from "drizzle-orm";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { requireManagerPage } from "@/lib/admin-page-auth";
import { TeamClient } from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [team, current] = await Promise.all([
    db
      .select({ id: admins.id, email: admins.email, displayName: admins.displayName, role: admins.role, active: admins.active })
      .from(admins)
      .orderBy(asc(admins.role), asc(admins.email)),
    requireManagerPage(),
  ]);

  return <TeamClient initialTeam={team} currentAdminId={current?.id ?? -1} />;
}
