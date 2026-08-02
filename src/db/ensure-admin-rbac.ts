import { sql } from "drizzle-orm";
import { db } from "@/db";

let schemaReady: Promise<void> | null = null;

// Hostinger currently runs the application build without the repository's
// hostinger:build migration wrapper. Keep the migration files authoritative,
// but make authentication self-healing so a deploy can never strand every
// administrator behind missing RBAC columns.
export function ensureAdminRbacSchema(): Promise<void> {
  if (schemaReady) return schemaReady;

  schemaReady = db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(73194420)`);
    await tx.execute(sql.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
          CREATE TYPE admin_role AS ENUM ('manager', 'staff');
        END IF;
      END
      $$;
    `));
    await tx.execute(sql.raw(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS display_name text`));
    await tx.execute(sql.raw(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS role admin_role`));
    await tx.execute(sql.raw(`UPDATE admins SET role = 'manager' WHERE role IS NULL`));
    await tx.execute(sql.raw(`ALTER TABLE admins ALTER COLUMN role SET DEFAULT 'staff'`));
    await tx.execute(sql.raw(`ALTER TABLE admins ALTER COLUMN role SET NOT NULL`));
    await tx.execute(sql.raw(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS active boolean DEFAULT true NOT NULL`));
  }).then(() => undefined).catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}
